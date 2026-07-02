export type SqlBlock = {
  sql: string;
  table_data: Record<string, string>[];
  durationMs?: number;
  is_error?: boolean;
  is_cancelled?: boolean;
  tool_call_id?: string;
};

// Present when this chat edits a dashboard widget. Result blocks use it to show
// Update/Add instead of the normal pin and push changes live to the dashboard.
export type WidgetEditContext = Readonly<{
  dashboardId: string;
  widgetId: string;
  onWidgetUpdated: (
    widget: import("@/lib/services/orgDashboardService").DashboardWidget,
  ) => void;
  onWidgetAdded: (
    widget: import("@/lib/services/orgDashboardService").DashboardWidget,
  ) => void;
}>;

export type YAxisConfig = Readonly<{
  dual_axis: true;
  axis_map: Record<string, "left" | "right">;
  left_label: string;
  right_label: string;
}>;

export type AgenticChartSpec = Readonly<{
  chart_type:
    | "bar"
    | "line"
    | "area"
    | "step"
    | "scatter"
    | "pie"
    | "horizontal_bar"
    | "radar"
    | "stackedBar"
    | "stackedPie"
    | "radialBar"
    | "composed";
  title: string;
  x_key: string;
  y_keys: string[];
  x_label: string | null;
  y_label: string | null;
  y_axis_config: YAxisConfig | null;
  data: Record<string, string | number>[];
  grouping: string | null;
  sort_order: "asc" | "desc" | null;
  data_points: number;
  colors?: readonly string[];
}>;

export type ChartBlock = {
  chart_id: string;
  chart_spec: AgenticChartSpec;
  sql: string;
};

export type VaultBlock = {
  tool: string;
  input: Record<string, string>;
  output: string;
  durationMs?: number;
};

export type ClarificationData = Readonly<{
  question: string;
  answer: string;
  options?: string[];
}>;

export type VaultWriteStatusInfo = Readonly<{
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}>;

export type ToolOutput = Readonly<{
  raw?: string;
  tableData?: Record<string, string>[];
  isError?: boolean;
  chartSpec?: AgenticChartSpec | null;
  /** @deprecated Legacy field for old conversations with PNG chart images */
  chartImage?: string | null;
  vaultBlock?: VaultBlock;
  /** Vault write status from API */
  vaultWriteStatus?: VaultWriteStatusInfo;
}>;

export type ProgressStep = {
  id: string;
  tool: string;
  message: string;
  status: "calling" | "done" | "streaming" | "cancelled";
  durationMs?: number;
  toolInput?: Record<string, unknown>;
  toolOutput?: ToolOutput;
  clarificationData?: ClarificationData;
};

export type ChatMessage = {
  id: string;
  conversationId?: string;
  role: "user" | "agent";
  text: string;
  isClarification?: boolean;
  steps?: ProgressStep[];
  feedbackChat?: string;
  feedbackComment?: string;
  interrupted?: boolean;
  // True for an optimistically-rendered in-flight bubble (synthesized either
  // by `sendWsMessage`/`SUBMIT_CLARIFICATION` at send time, or by
  // `ENSURE_INFLIGHT_TAIL` on mid-stream remount). Cleared by FINALIZE /
  // SET_AGENT_ERROR. Used as the structural identity check so reconciliation
  // never has to infer "is this bubble in-flight?" from `text`/`steps` shape.
  inflight?: boolean;
  // Group chat: sender info for user messages
  userSub?: string;
  userName?: string;
};

export type PendingClarification = Readonly<{
  question: string;
  requestId: string;
  options?: string[];
  allowMultiple?: boolean;
}>;

// --- Vault Write Approval ---

export type VaultWritePayload = Readonly<{
  question?: string;
  sql?: string;
  title?: string;
  rule?: string;
  term?: string;
  definition?: string;
  filename?: string;
  directory?: string;
  content?: string;
  content_preview?: string;
  path?: string;
  reason?: string;
  [key: string]: unknown;
}>;

export type VaultWritePending = Readonly<{
  type?: "vault_write_pending";
  request_id: string;
  tool_name: string;
  vault_path: string;
  payload: VaultWritePayload;
  new_content?: string;
  current_content?: string | null;
  is_new_file?: boolean;
  is_delete?: boolean;
  requested_by?: string;
  created_at?: string;
  status?: "pending" | "processed" | "unknown";
}>;

export type VaultWriteResult = Readonly<{
  request_id?: string;
  success: boolean;
  vault_path?: string;
  version?: number;
  rejected?: boolean;
  reason?: string;
  error?: string;
}>;

// Canonical UUID shape (8-4-4-4-12). Matches both visible and HTML comment formats:
// - "Request ID: uuid" (legacy)
// - "<!-- Request ID: uuid -->" (hidden from agent)
const VAULT_REQUEST_ID_RE =
  /(?:<!--\s*)?Request ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\s*-->)?/i;

export const parseVaultWriteRequestId = (toolResult: string): string | null => {
  const match = toolResult.match(VAULT_REQUEST_ID_RE);
  return match ? match[1] : null;
};

export const parseVaultWritePath = (toolResult: string): string | null => {
  const match = toolResult.match(/Path:\s*(\S+)/);
  return match ? match[1] : null;
};

// --- Token Usage ---

export type TokenUsage = Readonly<{
  usagePercent: number;
  estimatedTokens: number;
  contextWindow: number;
  shouldWarn: boolean;
  shouldCompact: boolean;
}>;

export type CompactionResult = Readonly<{
  type: "success" | "error" | "skipped";
  message: string;
  oldMessageCount?: number;
  newMessageCount?: number;
}>;

// --- Constants ---

export const MAX_SHEET_ROWS = 100;

const ALLOWED_FILE_EXTENSIONS = [
  "xlsx",
  "xlsm",
  "xls",
  "csv",
  "pdf",
  "docx",
  "pptx",
  "txt",
  "md",
  "eml",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
] as const;

export const ALLOWED_FILE_EXTENSION_SET: ReadonlySet<string> = new Set(
  ALLOWED_FILE_EXTENSIONS,
);

export const ALLOWED_FILE_ACCEPT = ALLOWED_FILE_EXTENSIONS.map(
  (e) => `.${e}`,
).join(",");

// Accepted but hidden from the user-facing list to keep it short — these are
// redundant or niche: .xlsm/.xls (covered by .xlsx), .pptx, .eml, .jpeg (covered by .jpg).
const EXTENSIONS_HIDDEN_FROM_LABEL: ReadonlySet<string> = new Set([
  "xlsm",
  "xls",
  "pptx",
  "eml",
  "jpeg",
  "gif",
]);

// Human-readable, comma-separated list of the primary accepted extensions
// shown to the user (e.g. ".xlsx, .csv, …"). All extensions remain accepted.
export const ALLOWED_FILE_EXTENSION_LABEL = ALLOWED_FILE_EXTENSIONS.filter(
  (e) => !EXTENSIONS_HIDDEN_FROM_LABEL.has(e),
)
  .map((e) => `.${e}`)
  .join(", ");

const MAX_FILE_SIZE_MB = 30;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const INDEXING_ACTIVE_STAGES: ReadonlySet<string> = new Set([
  "queued",
  "extracting",
  "chunking",
  "embedding",
  "upserting",
  "validating",
]);

// Terminal indexing stages emitted by the backend pipeline.
export const INDEXING_DONE_STAGE = "done";

export const INDEXING_FAILED_STAGES: ReadonlySet<string> = new Set([
  "failed",
  "dead",
]);

// Read at call time (not module-load) so an embedder that supplies the WS base
// URL after bundle load — e.g. the <scavenger-chat> web component, which writes it
// from props into process.env — is honored. In the Next app this is identical: the
// same env var, resolved when the socket opens instead of at import.
export const getWsUrl = () =>
  (process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000") +
  "/agentic/chat_with_your_data_ws";
