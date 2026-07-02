/**
 * Typed shapes for every WebSocket message the agentic chat backend can send.
 *
 * The handler receives raw JSON from the wire. After parsing, we narrow into
 * one of these types. This eliminates `as string` casts and documents the
 * contract between frontend and backend in one place.
 *
 * Contract: field names must match the Python backend's WS emit calls exactly.
 */

import type { AgenticChartSpec, VaultWritePending } from "./types";

// ---------------------------------------------------------------------------
// Typed messages (discriminated on `type` field)
// ---------------------------------------------------------------------------

export type WsPingMessage = Readonly<{
  type: "ping";
}>;

export type WsThinkingMessage = Readonly<{
  type: "thinking";
}>;

export type WsStatusMessage = Readonly<{
  type: "status";
  message: string;
  phase?: "connecting" | "initializing" | "thinking";
}>;

export type WsTextDeltaMessage = Readonly<{
  type: "text_delta";
  content: string;
}>;

export type WsTextCompleteMessage = Readonly<{
  type: "text_complete";
}>;

export type WsProgressCallingMessage = Readonly<{
  type: "progress";
  status: "calling";
  tool: string;
  tool_call_id: string;
  message?: string;
  tool_input?: Record<string, unknown>;
  sql?: string; // convenience duplicate for pre-rendering SQL chips
}>;

export type WsProgressDoneMessage = Readonly<{
  type: "progress";
  status: "done";
  tool: string;
  tool_call_id?: string;
  message?: string;
  duration_ms?: number;
  tool_result?: string;
  tool_output?: string; // legacy name for tool_result
  tool_input?: Record<string, unknown>;
}>;

export type WsProgressAnalyzingMessage = Readonly<{
  type: "progress";
  status: "analyzing";
  message?: string;
}>;

export type WsProgressMessage =
  | WsProgressCallingMessage
  | WsProgressDoneMessage
  | WsProgressAnalyzingMessage;

export type WsClarificationRequestMessage = Readonly<{
  type: "clarification_request";
  question: string;
  request_id: string;
  options?: string[];
  allow_multiple?: boolean;
}>;

export type WsChartMessage = Readonly<{
  type: "chart";
  chart_spec: AgenticChartSpec;
  tool_call_id?: string;
}>;

export type WsVaultWritePendingMessage = Readonly<{
  type: "vault_write_pending";
  request_id: string;
  tool_name: string;
  vault_path: string;
  payload: VaultWritePending["payload"];
  new_content?: string;
  current_content?: string | null;
  is_new_file?: boolean;
  is_delete?: boolean;
  requested_by?: string;
  created_at?: string;
}>;

export type WsVaultWriteResultMessage = Readonly<{
  type: "vault_write_result";
  request_id?: string;
  success: boolean;
  vault_path?: string;
  version?: number;
  rejected?: boolean;
  reason?: string;
  error?: string;
}>;

export type WsVaultBlockMessage = Readonly<{
  type: "vault_block";
  tool: string;
  input?: Record<string, string>;
  output?: string;
  duration_ms?: number;
}>;

// ---------------------------------------------------------------------------
// Token usage & compaction messages
// ---------------------------------------------------------------------------

export type WsTokenUsageMessage = Readonly<{
  type: "token_usage";
  usage_percent: number;
  estimated_tokens: number;
  context_window: number;
  should_warn: boolean;
  should_compact: boolean;
}>;

export type WsCompactionWarningMessage = Readonly<{
  type: "compaction_warning";
  usage_percent: number;
  message: string;
}>;

export type WsCompactionStartedMessage = Readonly<{
  type: "compaction_started";
  reason: "user_requested" | "auto";
  old_message_count: number;
  old_token_estimate: number;
}>;

export type WsCompactionCompleteMessage = Readonly<{
  type: "compaction_complete";
  success: true;
  old_message_count: number;
  new_message_count: number;
  old_token_estimate: number;
  new_token_estimate: number;
  summary_preview: string;
}>;

export type WsCompactionErrorMessage = Readonly<{
  type: "compaction_error";
  error: string;
  skipped?: boolean;
}>;

export type WsAutoCompactionTriggeredMessage = Readonly<{
  type: "auto_compaction_triggered";
  usage_percent: number;
  message: string;
}>;

export type WsAutoCompactionCompleteMessage = Readonly<{
  type: "auto_compaction_complete";
  old_message_count: number;
  new_message_count: number;
  old_token_estimate: number;
  new_token_estimate: number;
  summary_preview: string;
}>;

export type WsToolExecutingMessage = Readonly<{
  type: "tool_executing";
  tool_call_id: string;
  tool: string;
  message: string;
  elapsed_ms: number;
}>;

export type WsStopAcknowledgedMessage = Readonly<{
  type: "stop_acknowledged";
  message: string;
}>;

export type WsAgentStoppedMessage = Readonly<{
  type: "agent_stopped";
  message: "response ended";
  conversation_id?: string;
  reason: "user_requested" | "ws_disconnect";
  partial_response?: string;
  token_usage?: WsResponseEndedTokenUsage;
  interrupted?: boolean;
}>;

// Group chat messages
export type WsAgentBusyMessage = Readonly<{
  type: "agent_busy";
  message?: string;
}>;

export type WsAgentReadyMessage = Readonly<{
  type: "agent_ready";
  message?: string;
}>;

// All messages that have a `type` field
export type WsTypedMessage =
  | WsPingMessage
  | WsThinkingMessage
  | WsStatusMessage
  | WsTextDeltaMessage
  | WsTextCompleteMessage
  | WsProgressMessage
  | WsClarificationRequestMessage
  | WsChartMessage
  | WsVaultWritePendingMessage
  | WsVaultWriteResultMessage
  | WsVaultBlockMessage
  | WsTokenUsageMessage
  | WsCompactionWarningMessage
  | WsCompactionStartedMessage
  | WsCompactionCompleteMessage
  | WsCompactionErrorMessage
  | WsAutoCompactionTriggeredMessage
  | WsAutoCompactionCompleteMessage
  | WsToolExecutingMessage
  | WsStopAcknowledgedMessage
  | WsAgentStoppedMessage
  | WsAgentBusyMessage
  | WsAgentReadyMessage;

// ---------------------------------------------------------------------------
// Untyped messages (no `type` field — identified by other keys)
// ---------------------------------------------------------------------------

export type WsSqlBlock = Readonly<{
  sql: string;
  table_data: Record<string, string>[];
  is_error?: boolean;
  duration_ms?: number;
  tool_call_id?: string;
}>;

export type WsResponseEndedTokenUsage = Readonly<{
  estimated_tokens: number;
  context_window: number;
  usage_percent: number;
  should_warn: boolean;
  should_compact: boolean;
  tokens_delta?: number;
}>;

export type WsResponseEndedMessage = Readonly<{
  message: "response ended";
  conversation_id?: string;
  token_usage?: WsResponseEndedTokenUsage;
}>;

export type WsSqlBlocksMessage = Readonly<{
  sql_blocks: WsSqlBlock[];
}>;

export type WsErrorMessage = Readonly<{
  error: string;
}>;

// ---------------------------------------------------------------------------
// Type guards for narrowing untyped messages
// ---------------------------------------------------------------------------

export const isResponseEnded = (
  msg: Record<string, unknown>,
): msg is WsResponseEndedMessage =>
  msg.message === "response ended" && !("type" in msg);

export const isSqlBlocks = (
  msg: Record<string, unknown>,
): msg is WsSqlBlocksMessage => Array.isArray(msg.sql_blocks);

export const isWsError = (
  msg: Record<string, unknown>,
): msg is WsErrorMessage => typeof msg.error === "string" && !("type" in msg);

export const isTokenLimitReached = (msg: Record<string, unknown>): boolean =>
  msg.type === "error" && msg.code === "TOKEN_LIMIT_REACHED";

export const isNotGroupMember = (msg: Record<string, unknown>): boolean =>
  msg.type === "error" && msg.error_code === "NOT_GROUP_MEMBER";

export const isTypedMessage = (
  msg: Record<string, unknown>,
): msg is WsTypedMessage => typeof msg.type === "string";
