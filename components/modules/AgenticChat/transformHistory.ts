import type {
  FullHistoryResponse,
  FullHistoryToolCall,
  FullHistorySqlResponse,
} from "@/lib/services/agenticChatService";
import type {
  AgenticChartSpec,
  ChatMessage,
  PendingClarification,
  ProgressStep,
} from "./types";
import { getToolMeta, isToolName } from "./toolMeta";

export type TransformHistoryResult = {
  messages: ChatMessage[];
  pendingClarification: PendingClarification | null;
};

// Synthetic user turns the backend (or the fallback-path frontend) persists
// around clarifications. They're prompt scaffolding, not real user input, so
// we hide them from history. Anchored on specific literals — not a broad
// regex — so real user prompts that happen to begin with "CONTEXT:" or
// "Response of…" aren't silently dropped.
const SYNTHETIC_USER_PREFIXES = [
  `CONTEXT: The user's original question was:`,
  `Response of Clarification Question:`,
] as const;

// Sentinel the backend writes as the assistant response body when a turn was
// interrupted with no streamed text (see server/handlers/chat.py). The amber
// interrupted banner already conveys this state, so we suppress the text.
const INTERRUPTED_SENTINEL = "[Agent interrupted while processing]";

// --- Transform ---

export const transformFullHistory = (
  response: FullHistoryResponse,
): TransformHistoryResult => {
  // Index sql_responses by rs_id for O(1) lookup
  const sqlMap = new Map<string, FullHistorySqlResponse>();
  for (const sr of response.sql_responses) {
    sqlMap.set(sr.rs_id, sr);
  }

  // Group tool_calls by conversation_id, sorted by created_at
  const toolCallMap = new Map<string, FullHistoryToolCall[]>();
  for (const tc of response.tool_calls) {
    const list = toolCallMap.get(tc.conversation_id) ?? [];
    list.push(tc);
    toolCallMap.set(tc.conversation_id, list);
  }
  toolCallMap.forEach((list) => {
    list.sort((a: FullHistoryToolCall, b: FullHistoryToolCall) =>
      a.created_at.localeCompare(b.created_at),
    );
  });

  // Track which conversation_ids have assistant messages
  const assistantConversationIds = new Set<string>();
  for (const msg of response.messages) {
    if (msg.role === "assistant") {
      assistantConversationIds.add(msg.conversation_id);
    }
  }

  // Helper to build steps from tool calls. When `interrupted` is true, the
  // last tool call by created_at is the one BE killed — flip it to "cancelled"
  // so chips stop animating on refresh / navigate-back.
  const buildStepsFromToolCalls = (
    toolCalls: FullHistoryToolCall[],
    interrupted = false,
  ): ProgressStep[] => {
    const steps: ProgressStep[] = [];

    for (const tc of toolCalls) {
      const step: ProgressStep = {
        id: tc.tool_call_id,
        tool: tc.tool_name,
        message: getToolMeta(tc.tool_name).label,
        status: "done",
        durationMs: tc.duration_ms,
        toolInput: tc.tool_input ?? undefined,
        toolOutput: { raw: tc.tool_result },
      };

      if (tc.sql_rs_id) {
        const sqlResp = sqlMap.get(tc.sql_rs_id);

        if (sqlResp) {
          step.toolInput = { ...step.toolInput, sql: sqlResp.generated_sql };
          step.toolOutput = {
            ...step.toolOutput,
            tableData: sqlResp.table_data,
          };
        }
      }

      if (isToolName(tc.tool_name, "generate_chart_data")) {
        // New tool: chart spec is embedded in tool_result as JSON
        // Parse first — a valid spec with "error" in title/data is NOT a failure
        let parsed: Record<string, unknown> | null = null;
        if (tc.tool_result) {
          try {
            parsed = JSON.parse(tc.tool_result);
          } catch {
            // not valid JSON
          }
        }

        if (parsed?.chart_type && parsed?.data) {
          step.toolOutput = {
            ...step.toolOutput,
            chartSpec: parsed as unknown as AgenticChartSpec,
          };
        } else if (tc.tool_result?.toLowerCase().includes("error")) {
          step.toolOutput = { ...step.toolOutput, isError: true };
        }
      } else if (isToolName(tc.tool_name, "generate_chart")) {
        // Old tool: chart image stored in DB, lazy-fetch via REST
        const hasError = tc.tool_result?.toLowerCase().includes("error");

        if (tc.has_chart && !hasError) {
          step.toolOutput = { ...step.toolOutput, chartSpec: null };
        } else if (hasError) {
          step.toolOutput = { ...step.toolOutput, isError: true };
        }
      }

      if (
        isToolName(tc.tool_name, "ask_clarification") &&
        tc.tool_input?.question
      ) {
        // A pending clarification has no real answer yet — keep status "calling"
        // so the fallback-path reducer (COMPLETE_CLARIFICATION) can find and
        // update it when the user picks an option post-refresh
        const isPending =
          !tc.tool_result ||
          tc.tool_result === "No selection made." ||
          tc.tool_result.trim() === "";

        if (isPending) {
          step.status = "calling";
        } else {
          // Options can be either a JSON string or already an array
          let options: string[] | undefined;
          const rawOptions = tc.tool_input.options;

          if (Array.isArray(rawOptions)) {
            options = rawOptions;
          } else if (typeof rawOptions === "string") {
            try {
              options = JSON.parse(rawOptions);
            } catch {
              // options is not valid JSON — skip
            }
          }

          step.clarificationData = {
            question: tc.tool_input.question,
            answer: tc.tool_result,
            options,
          };
        }
      }

      // Use vault_write_status from API for vault write tools
      if (tc.vault_write_status) {
        step.toolOutput = {
          ...step.toolOutput,
          vaultWriteStatus: {
            status: tc.vault_write_status.status,
            reviewedBy: tc.vault_write_status.reviewed_by,
            reviewedAt: tc.vault_write_status.reviewed_at,
            rejectionReason: tc.vault_write_status.rejection_reason,
          },
        };
      }

      // Add request_id to raw output for vault write tools (for clickable chips)
      if (tc.vault_write_request_id && step.toolOutput?.raw) {
        const hasRequestId = step.toolOutput.raw.includes("Request ID:");

        if (!hasRequestId) {
          step.toolOutput = {
            ...step.toolOutput,
            raw: `${step.toolOutput.raw}\nRequest ID: ${tc.vault_write_request_id}`,
          };
        }
      }

      steps.push(step);
    }

    if (interrupted && steps.length > 0) {
      const lastIdx = steps.length - 1;
      const lastStep = steps[lastIdx];

      // Skip pending clarifications — their "calling" status is meaningful
      // (drives the post-refresh clarification answer flow), not a leftover.
      if (lastStep.status !== "calling") {
        steps[lastIdx] = { ...lastStep, status: "cancelled" };
      }
    }

    return steps;
  };

  // Build ChatMessage[]
  const messages: ChatMessage[] = [];

  for (const msg of response.messages) {
    if (msg.role === "user") {
      const isClarificationWrapper = SYNTHETIC_USER_PREFIXES.some((p) =>
        msg.content.startsWith(p),
      );

      if (!isClarificationWrapper) {
        messages.push({
          id: msg.conversation_id,
          conversationId: msg.conversation_id,
          role: "user",
          text: msg.content,
          userSub: msg.user_sub,
          userName: msg.user_name,
        });
      }

      // If there are tool calls for this conversation but no assistant message,
      // create a synthetic agent message
      const toolCalls = toolCallMap.get(msg.conversation_id);

      if (toolCalls && !assistantConversationIds.has(msg.conversation_id)) {
        const steps = buildStepsFromToolCalls(toolCalls);
        messages.push({
          id: `${msg.conversation_id}-agent`,
          conversationId: msg.conversation_id,
          role: "agent",
          text: "",
          steps: steps.length > 0 ? steps : undefined,
        });
      }

      continue;
    }

    // Assistant → agent message
    const toolCalls = toolCallMap.get(msg.conversation_id) ?? [];
    const interrupted = msg.interrupted ?? false;
    const steps = buildStepsFromToolCalls(toolCalls, interrupted);

    const text =
      interrupted && msg.content === INTERRUPTED_SENTINEL ? "" : msg.content;

    messages.push({
      id: msg.conversation_id,
      conversationId: msg.conversation_id,
      role: "agent",
      text,
      steps: steps.length > 0 ? steps : undefined,
      feedbackChat: msg.feedback_chat ?? undefined,
      feedbackComment: msg.feedback_comment ?? undefined,
      interrupted,
    });
  }

  // Check for pending clarification (last ask_clarification with no real answer)
  // Only show if it's truly the last thing - no newer messages after it
  let pendingClarification: PendingClarification | null = null;
  const allToolCalls = response.tool_calls;

  if (allToolCalls.length > 0) {
    // Sort by created_at descending to find the most recent
    const sorted = [...allToolCalls].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    const lastClarification = sorted.find((tc) =>
      isToolName(tc.tool_name, "ask_clarification"),
    );

    // Check if the clarification is pending (no answer or placeholder text)
    const isPending =
      !lastClarification?.tool_result ||
      lastClarification.tool_result === "No selection made." ||
      lastClarification.tool_result.trim() === "";

    // Check if there are any messages after this clarification
    // (meaning user moved on without answering)
    const clarificationConversationId = lastClarification?.conversation_id;
    const lastMessageConversationId =
      response.messages[response.messages.length - 1]?.conversation_id;
    const isLastConversation =
      clarificationConversationId === lastMessageConversationId;

    if (
      lastClarification &&
      lastClarification.tool_input?.question &&
      isPending &&
      isLastConversation
    ) {
      // Options can be either a JSON string or already an array
      let options: string[] | undefined;
      const rawOptions = lastClarification.tool_input.options;

      if (Array.isArray(rawOptions)) {
        options = rawOptions;
      } else if (typeof rawOptions === "string") {
        try {
          options = JSON.parse(rawOptions);
        } catch {
          // options is not valid JSON — skip
        }
      }

      pendingClarification = {
        question: lastClarification.tool_input.question,
        requestId: lastClarification.tool_call_id,
        options,
        allowMultiple: lastClarification.tool_input.allow_multiple === "true",
      };
    }
  }

  return { messages, pendingClarification };
};
