import {
  ChatMessage,
  ProgressStep,
  parseVaultWritePath,
  parseVaultWriteRequestId,
} from "./types";
import { isToolName, isToolCategory } from "./toolMeta";

// --- State ---

export type AgenticChatState = Readonly<{
  messages: ChatMessage[];
  isLoadingHistory: boolean;
}>;

export const initialAgenticChatState: AgenticChatState = {
  messages: [],
  isLoadingHistory: true,
};

// --- Actions ---

type LoadHistoryStartAction = Readonly<{ type: "LOAD_HISTORY_START" }>;

type LoadHistorySuccessAction = Readonly<{
  type: "LOAD_HISTORY_SUCCESS";
  payload: { messages: ChatMessage[] };
}>;

type LoadHistoryFailureAction = Readonly<{ type: "LOAD_HISTORY_FAILURE" }>;

type AddMessagesAction = Readonly<{
  type: "ADD_MESSAGES";
  payload: { newMessages: ChatMessage[] };
}>;

type FinalizeAgentMessageAction = Readonly<{
  type: "FINALIZE_AGENT_MESSAGE";
  payload: {
    text: string;
    steps: ProgressStep[];
    conversationId: string;
    interrupted?: boolean;
  };
}>;

type SetAgentErrorAction = Readonly<{
  type: "SET_AGENT_ERROR";
  payload: { error: string; guardEmpty?: boolean };
}>;

type ResetMessagesAction = Readonly<{ type: "RESET_MESSAGES" }>;

type SnapshotClarificationAction = Readonly<{
  type: "SNAPSHOT_CLARIFICATION";
  payload: {
    text: string;
    steps: ProgressStep[];
  };
}>;

type SubmitClarificationAction = Readonly<{
  type: "SUBMIT_CLARIFICATION";
  payload: {
    userMessage: ChatMessage;
    agentMessage: ChatMessage;
    inputReceivedLabel: string;
  };
}>;

type UpdateVaultWriteStatusAction = Readonly<{
  type: "UPDATE_VAULT_WRITE_STATUS";
  payload: {
    vaultPath: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string | null;
  };
}>;

type BatchUpdateVaultWriteStatusesAction = Readonly<{
  type: "BATCH_UPDATE_VAULT_WRITE_STATUSES";
  payload: {
    statuses: Record<
      string,
      {
        status: "pending" | "approved" | "rejected";
        reviewedBy?: string | null;
        reviewedAt?: string | null;
        rejectionReason?: string | null;
      }
    >;
  };
}>;

type CompleteClarificationAction = Readonly<{
  type: "COMPLETE_CLARIFICATION";
  payload: {
    requestId: string;
    question: string;
    answer: string;
    options?: string[];
    inputReceivedLabel: string;
  };
}>;

// Idempotent: ensures the messages array ends in a trailing empty agent
// bubble (with a preceding user bubble if needed). Dispatched before
// FINALIZE_AGENT_MESSAGE / SET_AGENT_ERROR drains so those reducers can
// stay strict about their precondition (last must be agent).
//
// Synthesizes:
//   - Nothing, if the last message is already an agent bubble (fast path).
//   - Nothing, if isLoadingHistory is true (LOAD_HISTORY_SUCCESS would
//     clobber synthesized bubbles).
//   - A user bubble (if last isn't already the user's current question) +
//     an agent bubble, otherwise.
type EnsureInflightTailAction = Readonly<{
  type: "ENSURE_INFLIGHT_TAIL";
  payload: {
    fallbackUserQuery?: string;
    conversationId?: string;
  };
}>;

// Add a message from another group member (received via pub/sub)
type AddGroupMessageAction = Readonly<{
  type: "ADD_GROUP_MESSAGE";
  payload: {
    message: ChatMessage;
  };
}>;

export type AgenticChatAction =
  | LoadHistoryStartAction
  | LoadHistorySuccessAction
  | LoadHistoryFailureAction
  | AddMessagesAction
  | FinalizeAgentMessageAction
  | SetAgentErrorAction
  | ResetMessagesAction
  | SnapshotClarificationAction
  | SubmitClarificationAction
  | UpdateVaultWriteStatusAction
  | BatchUpdateVaultWriteStatusesAction
  | CompleteClarificationAction
  | EnsureInflightTailAction
  | AddGroupMessageAction;

const synthesizeInflightTail = (
  state: AgenticChatState,
  payload: EnsureInflightTailAction["payload"],
): AgenticChatState => {
  // Don't synthesize while history loads — LOAD_HISTORY_SUCCESS would
  // replace the messages array and clobber the synthesized bubbles.
  // The orchestrator will re-dispatch after history settles.
  if (state.isLoadingHistory) return state;

  const { fallbackUserQuery, conversationId } = payload;

  // Skip if REST already includes the assistant message for this turn —
  // REST is authoritative, and FINALIZE will write into that bubble.
  // Without this, navigating back after REST has caught up duplicates
  // the user+agent pair.
  if (
    conversationId &&
    state.messages.some(
      (m) => m.role === "agent" && m.conversationId === conversationId,
    )
  ) {
    return state;
  }

  const last = state.messages.at(-1);

  // Fast path: trailing agent is an in-flight bubble we can attach to.
  // Identity is explicit (`inflight: true`), not inferred from
  // text/steps shape — that inference was the root of past regressions
  // (interrupted-flag leak, stale-empty-bubble misattach).
  if (last?.role === "agent" && last.inflight) {
    return state;
  }

  const idSuffix = conversationId ?? "pending";
  const newMessages: ChatMessage[] = [];

  // Skip the user bubble if the last message is already the user's current
  // question (REST persisted user but not agent yet). Match strictly on
  // conversationId when we have one (finalize carried it); otherwise — still
  // streaming, so REST may have already persisted this turn's user message
  // *with* a conversationId before the agent finished — fall back to a text
  // match. A trailing user bubble in REST always belongs to the in-flight
  // turn (a completed turn would end in an agent message), so the text match
  // can't collide with an older turn. Without this, navigating away and back
  // mid-stream duplicates the user bubble (REST's + a synthesized one).
  const lastIsCurrentUser =
    last?.role === "user" &&
    (conversationId
      ? last.conversationId === conversationId
      : last.text === fallbackUserQuery);

  if (!lastIsCurrentUser && fallbackUserQuery) {
    newMessages.push({
      id: `inflight-user-${idSuffix}`,
      conversationId: conversationId || undefined,
      role: "user",
      text: fallbackUserQuery,
      inflight: true,
    });
  }

  newMessages.push({
    id: `inflight-agent-${idSuffix}`,
    conversationId: conversationId || undefined,
    role: "agent",
    text: "",
    inflight: true,
  });

  return { ...state, messages: [...state.messages, ...newMessages] };
};

// --- Reducer ---

export const agenticChatReducer = (
  state: AgenticChatState,
  action: AgenticChatAction,
): AgenticChatState => {
  switch (action.type) {
    case "LOAD_HISTORY_START":
      return { ...state, isLoadingHistory: true };

    case "LOAD_HISTORY_SUCCESS":
      return {
        ...state,
        messages: action.payload.messages,
        isLoadingHistory: false,
      };

    case "LOAD_HISTORY_FAILURE":
      return { ...state, isLoadingHistory: false };

    case "ADD_MESSAGES":
      return {
        ...state,
        messages: [...state.messages, ...action.payload.newMessages],
      };

    case "FINALIZE_AGENT_MESSAGE": {
      const messages = [...state.messages];
      const last = messages.at(-1);

      if (last?.role !== "agent") return state;

      const { text, steps, conversationId, interrupted } = action.payload;
      // Preserve `id` (React identity) so AgentMessage doesn't remount and
      // replay chart animations / lose chip state. Stamp the backend
      // conversation id onto the dedicated `conversationId` field, and only
      // when we got one — the ws.onclose / missing-conversation_id paths pass "".
      const conversationIdPatch = conversationId ? { conversationId } : {};
      // On interrupt, any step still in flight ("calling") was killed BE-side
      // and will never get its completion event — flip it to "cancelled" so
      // chips stop animating.
      const finalizedSteps = interrupted
        ? steps.map((s) =>
            s.status === "calling" ? { ...s, status: "cancelled" as const } : s,
          )
        : steps;

      messages[messages.length - 1] = {
        ...last,
        ...conversationIdPatch,
        text,
        steps: finalizedSteps,
        inflight: false,
        ...(interrupted ? { interrupted: true } : {}),
      };

      const prev = messages.at(-2);

      if (prev?.role === "user") {
        messages[messages.length - 2] = {
          ...prev,
          ...conversationIdPatch,
          inflight: false,
        };
      }

      return { ...state, messages };
    }

    case "SET_AGENT_ERROR": {
      const messages = [...state.messages];
      const last = messages.at(-1);

      if (last?.role !== "agent") return state;

      // guardEmpty: only set error when last agent message has no text
      if (action.payload.guardEmpty && last.text) return state;

      messages[messages.length - 1] = {
        ...last,
        text: action.payload.error,
        inflight: false,
        // Preserve interrupted flag if it was set
        ...(last.interrupted ? { interrupted: true } : {}),
      };
      return { ...state, messages };
    }

    case "RESET_MESSAGES":
      return { ...state, messages: [] };

    case "SNAPSHOT_CLARIFICATION": {
      const messages = [...state.messages];
      const last = messages.at(-1);

      if (last?.role !== "agent") return state;

      messages[messages.length - 1] = {
        ...last,
        text: action.payload.text || last.text,
        steps: action.payload.steps,
      };
      return { ...state, messages };
    }

    case "SUBMIT_CLARIFICATION": {
      const { userMessage, agentMessage, inputReceivedLabel } = action.payload;
      // Mark "Waiting for input" steps as done on all agent messages
      const updated = state.messages.map((msg) => {
        if (msg.role !== "agent" || !msg.steps) return msg;
        const hasWaiting = msg.steps.some(
          (s) =>
            s.status === "calling" && isToolName(s.tool, "ask_clarification"),
        );

        if (!hasWaiting) return msg;
        return {
          ...msg,
          steps: msg.steps.map((s) =>
            s.status === "calling" && isToolName(s.tool, "ask_clarification")
              ? { ...s, status: "done" as const, message: inputReceivedLabel }
              : s,
          ),
        };
      });
      return {
        ...state,
        messages: [...updated, userMessage, agentMessage],
      };
    }

    case "UPDATE_VAULT_WRITE_STATUS": {
      const { vaultPath, status, rejectionReason } = action.payload;
      // Find and update vault_write steps that match this path
      const updated = state.messages.map((msg) => {
        if (msg.role !== "agent" || !msg.steps) return msg;

        const hasMatchingVaultWrite = msg.steps.some(
          (s) =>
            isToolCategory(s.tool, "vault-write") &&
            s.toolOutput?.raw &&
            parseVaultWritePath(s.toolOutput.raw) === vaultPath,
        );

        if (!hasMatchingVaultWrite) return msg;

        return {
          ...msg,
          steps: msg.steps.map((s) => {
            if (!isToolCategory(s.tool, "vault-write") || !s.toolOutput?.raw) {
              return s;
            }
            const stepPath = parseVaultWritePath(s.toolOutput.raw);

            if (stepPath !== vaultPath) return s;

            return {
              ...s,
              toolOutput: {
                ...s.toolOutput,
                vaultWriteStatus: {
                  status,
                  rejectionReason,
                },
              },
            };
          }),
        };
      });

      return { ...state, messages: updated };
    }

    case "BATCH_UPDATE_VAULT_WRITE_STATUSES": {
      const { statuses } = action.payload;
      const requestIds = Object.keys(statuses);

      if (requestIds.length === 0) return state;

      const updated = state.messages.map((msg) => {
        if (msg.role !== "agent" || !msg.steps) return msg;

        const hasMatchingVaultWrite = msg.steps.some(
          (s) =>
            isToolCategory(s.tool, "vault-write") &&
            s.toolOutput?.raw &&
            requestIds.includes(
              parseVaultWriteRequestId(s.toolOutput.raw) ?? "",
            ),
        );

        if (!hasMatchingVaultWrite) return msg;

        return {
          ...msg,
          steps: msg.steps.map((s) => {
            if (!isToolCategory(s.tool, "vault-write") || !s.toolOutput?.raw) {
              return s;
            }
            const requestId = parseVaultWriteRequestId(s.toolOutput.raw);

            if (!requestId || !statuses[requestId]) return s;

            const newStatus = statuses[requestId];
            return {
              ...s,
              toolOutput: {
                ...s.toolOutput,
                vaultWriteStatus: newStatus,
              },
            };
          }),
        };
      });

      return { ...state, messages: updated };
    }

    case "COMPLETE_CLARIFICATION": {
      const { requestId, question, answer, options, inputReceivedLabel } =
        action.payload;
      // Attach clarificationData to the *specific* pending ask_clarification
      // step identified by requestId (= tool_call_id). Matching on status alone
      // would also overwrite older abandoned clarifications that
      // transformFullHistory left in "calling" state.
      const messages = state.messages.map((msg) => {
        if (msg.role !== "agent" || !msg.steps) return msg;
        const hasTarget = msg.steps.some(
          (s) =>
            s.id === requestId &&
            s.status === "calling" &&
            isToolName(s.tool, "ask_clarification"),
        );

        if (!hasTarget) return msg;
        return {
          ...msg,
          steps: msg.steps.map((s) =>
            s.id === requestId &&
            s.status === "calling" &&
            isToolName(s.tool, "ask_clarification")
              ? {
                  ...s,
                  status: "done" as const,
                  message: inputReceivedLabel,
                  clarificationData: { question, answer, options },
                }
              : s,
          ),
        };
      });
      return { ...state, messages };
    }

    case "ENSURE_INFLIGHT_TAIL": {
      return synthesizeInflightTail(state, action.payload);
    }

    case "ADD_GROUP_MESSAGE": {
      const { message } = action.payload;
      // Don't add duplicate messages (check by conversationId or id)
      const isDuplicate = state.messages.some(
        (m) =>
          (message.conversationId &&
            m.conversationId === message.conversationId) ||
          m.id === message.id,
      );

      if (isDuplicate) return state;

      return {
        ...state,
        messages: [...state.messages, message],
      };
    }

    default:
      return state;
  }
};
