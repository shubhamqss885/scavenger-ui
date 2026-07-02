import {
  ProgressStep,
  TokenUsage,
  ToolOutput,
  VaultWritePending,
  parseVaultWriteRequestId,
  parseVaultWritePath,
} from "../types";
import { isToolCategory, isToolName } from "../toolMeta";
import { tryParseJSON } from "../utils";
import {
  isResponseEnded,
  isSqlBlocks,
  isWsError,
  isTokenLimitReached,
  isNotGroupMember,
  isTypedMessage,
  type WsClarificationRequestMessage,
  type WsProgressCallingMessage,
  type WsProgressDoneMessage,
  type WsProgressAnalyzingMessage,
  type WsTextDeltaMessage,
  type WsChartMessage,
  type WsVaultBlockMessage,
} from "../wsTypes";
import { ChatSession, Translator } from "./types";
import { clearStreamingState, finalize, notify } from "./lifecycle";

// Monotonic step id counter (matches the original useAgenticWebSocket behavior).
let nextStepId = 0;

// Maps known technical backend errors to user-friendly i18n strings.
const classifyBackendError = (
  raw: string,
  lower: string,
  t: Translator,
): string => {
  if (
    lower.includes("failed to connect") ||
    lower.includes("could not connect to database") ||
    lower.includes("pyodbc") ||
    lower.includes("odbc")
  ) {
    return t("errors.dbConnectionFailed", { ns: "common" });
  }
  return raw;
};

// Flush the active text_delta buffer into textAccum and close the trailing
// _text streaming step. Tool steps use calling/done; if BE adds non-text
// streaming steps later, handle that as a separate path.
const drainStreamingTextInto = (s: ChatSession): void => {
  if (s.state.streamingDelta) {
    if (s.state.textAccum && !s.state.textAccum.endsWith("\n")) {
      s.state.textAccum += "\n\n";
    }
    s.state.textAccum += s.state.streamingDelta;
    s.state.streamingDelta = "";
  }

  const last = s.state.progressSteps.at(-1);

  if (last?.tool === "_text" && last.status === "streaming") {
    s.state.progressSteps = [
      ...s.state.progressSteps.slice(0, -1),
      { ...last, status: "done" as const },
    ];
  }
};

const handleTextDelta = (s: ChatSession, msg: WsTextDeltaMessage): void => {
  s.state.statusMessage = null;
  s.state.streamingDelta += msg.content;
  const blockText = s.state.streamingDelta;
  const last = s.state.progressSteps.at(-1);

  if (last?.tool === "_text" && last.status === "streaming") {
    // New array reference is intentional: React subscribers bail out on
    // Object.is, so in-place trailing-step mutation would skip streaming renders.
    s.state.progressSteps = [
      ...s.state.progressSteps.slice(0, -1),
      { ...last, toolOutput: { raw: blockText } },
    ];
  } else {
    s.state.progressSteps = [
      ...s.state.progressSteps,
      {
        id: `step-${nextStepId++}`,
        tool: "_text",
        message: "",
        status: "streaming" as const,
        toolOutput: { raw: blockText },
      },
    ];
  }
  notify(s);
};

const handleTextComplete = (s: ChatSession): void => {
  drainStreamingTextInto(s);
  notify(s);
};

const handleProgressCalling = (
  s: ChatSession,
  msg: WsProgressCallingMessage,
): void => {
  const t = s.t;

  if (msg.message) s.state.statusMessage = msg.message;
  drainStreamingTextInto(s);

  const step: ProgressStep = {
    id: msg.tool_call_id,
    tool: msg.tool,
    message: msg.message || t("status.working"),
    status: "calling",
    toolInput: msg.tool_input,
  };

  if (isToolName(msg.tool, "execute_sql") && msg.sql) {
    step.toolInput = { ...step.toolInput, sql: msg.sql };
  }
  s.state.progressSteps = [...s.state.progressSteps, step];
  notify(s);
};

const handleProgressDone = (
  s: ChatSession,
  msg: WsProgressDoneMessage,
): void => {
  const t = s.t;

  s.state.statusMessage = null;
  const rawOutput = msg.tool_result ?? msg.tool_output;

  if (
    msg.tool &&
    isToolCategory(msg.tool, "vault-write") &&
    rawOutput?.includes("pending approval")
  ) {
    const requestId = parseVaultWriteRequestId(rawOutput);
    const vaultPath = parseVaultWritePath(rawOutput);

    if (requestId) {
      const existingStep = s.state.progressSteps.find((step) =>
        msg.tool_call_id
          ? step.id === msg.tool_call_id
          : step.tool === msg.tool && step.status === "calling",
      );
      const payload =
        (msg.tool_input as VaultWritePending["payload"]) ||
        (existingStep?.toolInput as VaultWritePending["payload"]) ||
        {};

      s.state.pendingReplay.vaultWritePending ??= [];
      s.state.pendingReplay.vaultWritePending.push({
        request_id: requestId,
        tool_name: msg.tool,
        vault_path: vaultPath || "",
        payload,
      });
    }
  }

  const updated = [...s.state.progressSteps];
  const idx = updated.findIndex((step) =>
    msg.tool_call_id
      ? step.id === msg.tool_call_id
      : step.status === "calling" && step.tool === msg.tool,
  );

  if (idx >= 0) {
    const isChartError =
      isToolCategory(updated[idx].tool, "chart") &&
      rawOutput?.toLowerCase().includes("error");

    updated[idx] = {
      ...updated[idx],
      status: "done",
      message:
        msg.message && msg.message !== t("status.done")
          ? msg.message
          : updated[idx].message || t("status.done"),
      durationMs: msg.duration_ms,
      toolOutput: rawOutput
        ? {
            ...updated[idx].toolOutput,
            raw: rawOutput,
            ...(isChartError ? { isError: true } : {}),
          }
        : updated[idx].toolOutput,
    };
  } else if (msg.tool && rawOutput) {
    const isChartError =
      isToolCategory(msg.tool, "chart") &&
      rawOutput.toLowerCase().includes("error");

    updated.push({
      id: msg.tool_call_id || `step-${nextStepId++}`,
      tool: msg.tool,
      message: msg.message || t("status.done"),
      status: "done",
      durationMs: msg.duration_ms,
      toolInput: msg.tool_input,
      toolOutput: {
        raw: rawOutput,
        ...(isChartError ? { isError: true } : {}),
      },
    });
  }
  s.state.progressSteps = updated;
  notify(s);
};

const handleProgressAnalyzing = (
  s: ChatSession,
  msg: WsProgressAnalyzingMessage,
): void => {
  const t = s.t;

  s.state.statusMessage = null;
  drainStreamingTextInto(s);
  s.state.progressSteps = [
    ...s.state.progressSteps,
    {
      id: `step-${nextStepId++}`,
      tool: "",
      message: msg.message || t("status.analyzingResults"),
      status: "calling" as const,
    },
  ];
  notify(s);
};

const handleClarificationRequest = (
  s: ChatSession,
  msg: WsClarificationRequestMessage,
): void => {
  const t = s.t;

  s.state.pendingClarification = {
    question: msg.question,
    requestId: msg.request_id,
    options: Array.isArray(msg.options) ? msg.options : undefined,
    allowMultiple: msg.allow_multiple === true,
  };

  const steps = s.state.progressSteps.map((step) =>
    step.status === "calling" && isToolName(step.tool, "ask_clarification")
      ? { ...step, message: t("status.waitingForInput") }
      : { ...step },
  );

  s.state.pendingReplay.snapshotClarification = {
    text: s.state.textAccum || msg.question,
    steps,
  };
  s.state.pendingReplay.newClarification = true;
  s.state.progressSteps = [];
  s.state.isStreaming = false;
  s.state.bannerArmedAt = null;
  s.state.notifyOnDone = false;
  notify(s);
};

const handleChart = (s: ChatSession, msg: WsChartMessage): void => {
  const t = s.t;
  const updated = [...s.state.progressSteps];
  const chartOutput: ToolOutput = { chartSpec: msg.chart_spec };

  let idx = msg.tool_call_id
    ? updated.findIndex(
        (step) =>
          step.id === msg.tool_call_id && step.toolOutput?.chartSpec == null,
      )
    : -1;

  if (idx < 0) {
    idx = updated.findIndex(
      (step) =>
        isToolCategory(step.tool, "chart") &&
        step.toolOutput?.chartSpec == null,
    );
  }

  if (idx >= 0) {
    updated[idx] = {
      ...updated[idx],
      toolOutput: { ...updated[idx].toolOutput, ...chartOutput },
    };
  } else {
    updated.push({
      id: msg.tool_call_id ?? `step-${nextStepId++}`,
      tool: "generate_chart",
      message: `${t("sql.chart")}: ${msg.chart_spec.title}`,
      status: "done",
      toolOutput: chartOutput,
    });
  }
  s.state.progressSteps = updated;
  notify(s);
};

const handleVaultBlock = (s: ChatSession, msg: WsVaultBlockMessage): void => {
  const updated = [...s.state.progressSteps];
  const vaultOutput: ToolOutput = {
    vaultBlock: {
      tool: msg.tool,
      input: msg.input ?? {},
      output: msg.output ?? "",
      durationMs: msg.duration_ms,
    },
  };

  let idx = -1;

  for (let i = updated.length - 1; i >= 0; i--) {
    if (
      isToolCategory(updated[i].tool, "vault-read") &&
      !updated[i].toolOutput?.vaultBlock
    ) {
      idx = i;
      break;
    }
  }

  if (idx >= 0) {
    updated[idx] = {
      ...updated[idx],
      toolOutput: { ...updated[idx].toolOutput, ...vaultOutput },
      durationMs: msg.duration_ms ?? updated[idx].durationMs,
    };
  } else {
    updated.push({
      id: `step-${nextStepId++}`,
      tool: msg.tool || "vault",
      message: "Vault lookup complete",
      status: "done",
      durationMs: msg.duration_ms,
      toolOutput: vaultOutput,
    });
  }
  s.state.progressSteps = updated;
  notify(s);
};

// --- WS event handler ---

export const handleWsMessage = (s: ChatSession, event: MessageEvent): void => {
  const data = event.data as string;
  const obj = tryParseJSON(data);
  const t = s.t;

  // Text chunk — add as a timeline entry (chronological with steps)
  if (!obj) {
    if (s.state.textAccum && !s.state.textAccum.endsWith("\n")) {
      s.state.textAccum += "\n\n";
    }
    s.state.textAccum += data;

    const last = s.state.progressSteps.at(-1);

    if (last?.tool === "_text") {
      s.state.progressSteps = [
        ...s.state.progressSteps.slice(0, -1),
        {
          ...last,
          status: "done" as const,
          toolOutput: { raw: (last.toolOutput?.raw || "") + "\n\n" + data },
        },
      ];
    } else {
      s.state.progressSteps = [
        ...s.state.progressSteps,
        {
          id: `step-${nextStepId++}`,
          tool: "_text",
          message: "",
          status: "done" as const,
          toolOutput: { raw: data },
        },
      ];
    }
    notify(s);
    return;
  }

  // --- Untyped messages (no `type` field) ---

  if (isResponseEnded(obj)) {
    if (!obj.conversation_id) {
      console.warn("WS 'response ended' missing conversation_id");
    }

    const errorField = (obj as Record<string, unknown>).error;

    if (typeof errorField === "string" && errorField) {
      const lower = errorField.toLowerCase();
      const isJwtError =
        lower.includes("token has expired") || lower.includes("invalid token");

      if (isJwtError) {
        s.state.pendingReplay.authError = true;
      } else {
        s.state.pendingReplay.agentError = {
          error: classifyBackendError(errorField, lower, t),
        };
      }
      clearStreamingState(s);
      notify(s);
      return;
    }

    if (obj.token_usage) {
      s.state.pendingReplay.tokenUsage = {
        usagePercent: obj.token_usage.usage_percent,
        estimatedTokens: obj.token_usage.estimated_tokens,
        contextWindow: obj.token_usage.context_window,
        shouldWarn: obj.token_usage.should_warn,
        shouldCompact: obj.token_usage.should_compact,
      };
      s.state.tokenUsage = s.state.pendingReplay.tokenUsage;
    }

    const tokensDelta = obj.token_usage?.tokens_delta;

    if (typeof tokensDelta === "number" && tokensDelta > 0) {
      s.state.pendingReplay.tokensDelta =
        (s.state.pendingReplay.tokensDelta ?? 0) + tokensDelta;
    }

    finalize(s, obj.conversation_id ?? "", false);
    return;
  }

  if (isSqlBlocks(obj)) {
    const updated = [...s.state.progressSteps];

    for (const incoming of obj.sql_blocks) {
      const durationMs = incoming.duration_ms;
      const output: ToolOutput = {
        tableData: incoming.table_data,
        isError: incoming.is_error,
      };

      let idx = incoming.tool_call_id
        ? updated.findIndex((step) => step.id === incoming.tool_call_id)
        : -1;

      if (idx < 0) {
        idx = updated.findIndex((step) => step.toolInput?.sql === incoming.sql);
      }

      if (idx < 0) {
        idx = updated.findIndex(
          (step) =>
            isToolName(step.tool, "execute_sql") && !step.toolOutput?.tableData,
        );
      }

      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          toolInput: { ...updated[idx].toolInput, sql: incoming.sql },
          toolOutput: { ...updated[idx].toolOutput, ...output },
          durationMs: durationMs ?? updated[idx].durationMs,
        };
      } else {
        updated.push({
          id: incoming.tool_call_id ?? `step-${nextStepId++}`,
          tool: "execute_sql",
          message: t("status.done"),
          status: "done",
          durationMs,
          toolInput: { sql: incoming.sql },
          toolOutput: output,
        });
      }
    }
    s.state.progressSteps = updated;
    notify(s);
    return;
  }

  if (isWsError(obj)) {
    const lower = obj.error.toLowerCase();

    s.state.pendingReplay.agentError = {
      error: classifyBackendError(obj.error, lower, t),
    };
    notify(s);
    return;
  }

  if (isTokenLimitReached(obj)) {
    s.state.pendingReplay.agentError = {
      error: t("errors.tokenLimitReached", { ns: "common" }),
    };
    s.state.pendingReplay.tokenLimitReached = true;
    clearStreamingState(s);
    notify(s);
    return;
  }

  if (isNotGroupMember(obj)) {
    s.state.pendingReplay.agentError = {
      error: t("errors.notGroupMember", {
        ns: "common",
        defaultValue: "You are no longer a member of this group",
      }),
    };
    clearStreamingState(s);
    notify(s);
    return;
  }

  if (!isTypedMessage(obj)) return;

  if (obj.type === "ping") return;

  if (obj.type === "stop_acknowledged") {
    s.state.statusMessage = t("status.stopping");
    notify(s);
    return;
  }

  if (obj.type === "agent_stopped") {
    if (obj.token_usage) {
      s.state.pendingReplay.tokenUsage = {
        usagePercent: obj.token_usage.usage_percent,
        estimatedTokens: obj.token_usage.estimated_tokens,
        contextWindow: obj.token_usage.context_window,
        shouldWarn: obj.token_usage.should_warn,
        shouldCompact: obj.token_usage.should_compact,
      };
      s.state.tokenUsage = s.state.pendingReplay.tokenUsage;
    }
    finalize(s, obj.conversation_id ?? "", obj.interrupted ?? true);
    return;
  }

  if (obj.type === "thinking") return;

  if (obj.type === "status") {
    s.state.statusMessage = obj.message;
    notify(s);
    return;
  }

  if (obj.type === "tool_executing") {
    s.state.statusMessage = obj.message;
    notify(s);
    return;
  }

  if (obj.type === "text_delta") {
    handleTextDelta(s, obj);
    return;
  }

  if (obj.type === "text_complete") {
    handleTextComplete(s);
    return;
  }

  if (obj.type === "progress") {
    if (obj.status === "calling") {
      handleProgressCalling(s, obj);
      return;
    }
    if (obj.status === "done") {
      handleProgressDone(s, obj);
      return;
    }
    if (obj.status === "analyzing") {
      handleProgressAnalyzing(s, obj);
      return;
    }
    return;
  }

  if (obj.type === "clarification_request") {
    handleClarificationRequest(s, obj);
    return;
  }

  if (obj.type === "chart") {
    handleChart(s, obj);
    return;
  }

  if (obj.type === "vault_write_pending") {
    s.state.pendingReplay.vaultWritePending ??= [];
    s.state.pendingReplay.vaultWritePending.push({
      request_id: obj.request_id,
      tool_name: obj.tool_name,
      vault_path: obj.vault_path,
      payload: obj.payload,
      new_content: obj.new_content,
      current_content: obj.current_content,
      is_new_file: obj.is_new_file,
      is_delete: obj.is_delete,
      requested_by: obj.requested_by,
      created_at: obj.created_at,
    });
    notify(s);
    return;
  }

  if (obj.type === "vault_write_result") {
    s.state.pendingReplay.vaultWriteResult ??= [];
    s.state.pendingReplay.vaultWriteResult.push({
      request_id: obj.request_id,
      success: obj.success,
      vault_path: obj.vault_path,
      version: obj.version,
      rejected: obj.rejected,
      reason: obj.reason,
      error: obj.error,
    });
    notify(s);
    return;
  }

  if (obj.type === "vault_block") {
    handleVaultBlock(s, obj);
    return;
  }

  if (obj.type === "token_usage") {
    const usage: TokenUsage = {
      usagePercent: obj.usage_percent,
      estimatedTokens: obj.estimated_tokens,
      contextWindow: obj.context_window,
      shouldWarn: obj.should_warn,
      shouldCompact: obj.should_compact,
    };

    s.state.tokenUsage = usage;
    s.state.pendingReplay.tokenUsage = usage;
    notify(s);
    return;
  }

  if (obj.type === "compaction_warning") return;

  if (obj.type === "compaction_started") {
    s.state.pendingReplay.compactionStarted = true;
    notify(s);
    return;
  }

  if (obj.type === "compaction_complete") {
    s.state.pendingReplay.compactionResult = {
      type: "success",
      message: t("tokenUsage.compactionSuccess", {
        oldCount: obj.old_message_count,
        newCount: obj.new_message_count,
      }),
      oldMessageCount: obj.old_message_count,
      newMessageCount: obj.new_message_count,
    };
    notify(s);
    return;
  }

  if (obj.type === "compaction_error") {
    s.state.pendingReplay.compactionResult = {
      type: obj.skipped ? "skipped" : "error",
      message: obj.skipped ? t("tokenUsage.compactionSkipped") : obj.error,
    };
    notify(s);
    return;
  }

  if (obj.type === "auto_compaction_triggered") {
    s.state.pendingReplay.compactionStarted = true;
    notify(s);
    return;
  }

  if (obj.type === "auto_compaction_complete") {
    s.state.pendingReplay.compactionResult = {
      type: "success",
      message: t("tokenUsage.autoCompactionComplete", {
        oldCount: obj.old_message_count,
        newCount: obj.new_message_count,
      }),
      oldMessageCount: obj.old_message_count,
      newMessageCount: obj.new_message_count,
    };
    notify(s);
    return;
  }

  // Group chat: agent is busy processing another member's message
  if (obj.type === "agent_busy") {
    s.state.statusMessage = obj.message || "Another member is chatting...";
    s.state.isAgentBusy = true;
    notify(s);
    return;
  }

  // Group chat: agent is ready to process this user's message
  if (obj.type === "agent_ready") {
    s.state.statusMessage = obj.message || "Processing your message...";
    s.state.isAgentBusy = false;
    notify(s);
    return;
  }

  if ("error" in obj && typeof obj.error === "string") {
    s.state.pendingReplay.agentError = { error: `Error: ${obj.error}` };
    notify(s);
  }
};
