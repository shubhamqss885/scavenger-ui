import { getAxiosInstance } from "@/lib/services/axiosInstances";
import type { AgenticChartSpec } from "@/components/modules/AgenticChat/types";

// --- Types ---

type ModeInfo = Readonly<{
  id: string;
  name: string;
  description: string;
}>;

type GetModesResponse = Readonly<{
  modes: ModeInfo[];
  current_mode: string;
}>;

type SelectModeResponse = Readonly<{
  ok: boolean;
}>;

type IntegrationStatusResponse = Readonly<{
  enabled: boolean;
}>;

type SlackChannel = Readonly<{
  id: string;
  name: string;
}>;

type SlackChannelsResponse = Readonly<{
  channels: SlackChannel[];
}>;

type TeamsChannel = Readonly<{
  name: string;
}>;

type TeamsChannelsResponse = Readonly<{
  channels: TeamsChannel[];
}>;

export type FullHistoryMessage = Readonly<{
  role: "user" | "assistant";
  content: string;
  conversation_id: string;
  feedback_chat?: string;
  feedback_comment?: string;
  interrupted?: boolean;
  // Group chat: sender info for user messages
  user_sub?: string;
  user_name?: string;
}>;

export type VaultWriteStatus = Readonly<{
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}>;

export type VaultStatusesResponse = Readonly<{
  statuses: Record<string, VaultWriteStatus>;
}>;

export type FullHistoryToolCall = Readonly<{
  tool_call_id: string;
  conversation_id: string;
  tool_name: string;
  tool_input: Record<string, string> | null;
  tool_result: string;
  duration_ms: number;
  tool_use_id: string;
  sql_rs_id: string | null;
  created_at: string;
  has_chart: boolean;
  vault_write_status?: VaultWriteStatus;
  vault_write_request_id?: string;
}>;

export type FullHistorySqlResponse = Readonly<{
  rs_id: string;
  chat_query: string;
  generated_sql: string;
  table_data: Record<string, string>[];
  text_response: string;
  mixed_text_response: string;
  sql_title: string | null;
  created_at: string;
}>;

export type FullHistoryTokenUsage = Readonly<{
  estimated_tokens: number;
  context_window: number;
  usage_percent: number;
  should_warn: boolean;
  should_compact: boolean;
}>;

export type FullHistoryResponse = Readonly<{
  session_id: string;
  messages: FullHistoryMessage[];
  tool_calls: FullHistoryToolCall[];
  sql_responses: FullHistorySqlResponse[];
  token_usage?: FullHistoryTokenUsage;
}>;

// --- APIs ---

export const getAgenticTableDownloadLink = async (
  toolCallId: string,
  filename: string,
): Promise<string> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<{ download_link: string }>(
    "/agentic/download_table",
    { params: { tool_call_id: toolCallId, filename } },
  );
  return data.download_link;
};

export const getFullHistory = async (
  projectId: string,
): Promise<FullHistoryResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<FullHistoryResponse>(
    "/agentic/get_full_history",
    { params: { project_id: projectId } },
  );
  return data;
};

// Get full history from the Agentic service (for groups with Agno enabled)
export const getFullHistoryAgno = async (
  projectId: string,
): Promise<FullHistoryResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<FullHistoryResponse>(
    "/agentic/get_full_history",
    { params: { project_id: projectId } },
  );
  return data;
};

export type InferProjectNameResponse = Readonly<{
  project_name: string;
  updated: boolean;
}>;

// Title a brand-new project from its first turn. Idempotent on the BE via
// `expected_current_name` — racing calls collapse to one canonical result.
export const inferProjectName = async (
  projectId: string,
  expectedCurrentName: string,
): Promise<InferProjectNameResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<InferProjectNameResponse>(
    "/agentic/infer_name",
    { project_id: projectId, expected_current_name: expectedCurrentName },
  );
  return data;
};

export const getModes = async (
  projectId: string,
): Promise<GetModesResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<GetModesResponse>("/agentic/modes", {
    params: { project_id: projectId },
  });
  return data;
};

export const getVaultWriteStatuses = async (
  requestIds: string[],
): Promise<VaultStatusesResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<VaultStatusesResponse>(
    "/agentic/vault/statuses",
    requestIds,
  );
  return data;
};

export const selectMode = async (
  projectId: string,
  mode: string,
): Promise<SelectModeResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<SelectModeResponse>(
    "/agentic/select_mode",
    null,
    {
      params: { project_id: projectId, mode },
    },
  );
  return data;
};

export const getSlackStatus = async (): Promise<IntegrationStatusResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<IntegrationStatusResponse>(
    "/agentic/slack_status",
  );
  return data;
};

export const getSlackChannels = async (
  projectId: string,
): Promise<SlackChannel[]> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<SlackChannelsResponse>(
    "/agentic/slack_channels",
    {
      params: { project_id: projectId },
    },
  );
  return data.channels ?? [];
};

export const getTeamsStatus = async (
  projectId: string,
): Promise<IntegrationStatusResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<IntegrationStatusResponse>(
    "/agentic/teams_status",
    {
      params: { project_id: projectId },
    },
  );
  return data;
};

export const getTeamsChannels = async (
  projectId: string,
): Promise<TeamsChannel[]> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<TeamsChannelsResponse>(
    "/agentic/teams_channels",
    {
      params: { project_id: projectId },
    },
  );
  return data.channels ?? [];
};

/**
 * Fetch chart data for a tool call. Returns an AgenticChartSpec (new format)
 * or a base64 data URL string (legacy PNG format for old conversations).
 */
export const getToolCallChartData = async (
  toolCallId: string,
): Promise<AgenticChartSpec | string> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(
    `/agentic/tool_call_chart/${toolCallId}`,
    { responseType: "arraybuffer" },
  );
  const contentType =
    (response.headers["content-type"] as string) ?? "image/png";

  // New format: JSON chart spec
  if (contentType.includes("application/json")) {
    const text = new TextDecoder().decode(new Uint8Array(response.data));
    return JSON.parse(text) as AgenticChartSpec;
  }

  // Legacy format: PNG image -> data URL
  const bytes = new Uint8Array(response.data as ArrayBuffer);
  const chunks: string[] = [];
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    chunks.push(
      String.fromCodePoint(...Array.from(bytes.subarray(i, i + CHUNK))),
    );
  }
  return `data:${contentType};base64,${btoa(chunks.join(""))}`;
};

// --- Knowledge Graph Types ---

export type KGColumnNode = Readonly<{
  name: string;
  data_type: string;
  description: string;
  is_pk: boolean;
  column_confidence: number;
  nullable: boolean | null;
  unique_values: number | null;
  min_value: string | null;
  max_value: string | null;
  aliases: string[] | null;
}>;

export type KGTableNode = Readonly<{
  description: string;
  row_count: number | null;
  aliases: string[] | null;
  table_type: string | null;
}>;

export type KGRelationEdge = Readonly<{
  LEFT_TABLE: string;
  RIGHT_TABLE: string;
  COLS: [string, string][];
}>;

export type KGRelationshipNode = Readonly<{
  name: string | null;
  description: string | null;
  business_meaning: string | null;
  certified: boolean | null;
  cardinality: string | null;
  parent_table: string | null;
  child_table: string | null;
  aliases: string[] | null;
}>;

export type KGGraphStructure = Readonly<{
  nodes: {
    Column: Record<string, KGColumnNode>;
    Table: Record<string, KGTableNode>;
    View?: Record<string, KGTableNode>;
    ViewColumn?: Record<string, KGColumnNode>;
    Relationship?: Record<string, KGRelationshipNode>;
    Example?: Record<string, unknown>;
  };
  edges: {
    Table_OUT: { HAS_COLUMN: Record<string, { column_id: string }[]> };
    Relation_OUT: Record<string, KGRelationEdge>;
    View_OUT?: Record<string, unknown>;
    ViewColumn_OUT?: Record<string, unknown>;
    EXAMPLE_OUT?: Record<string, unknown>;
  };
  allowed_joins?: unknown[];
}>;

type KGGraphResponse = Readonly<{
  status_code: number;
  message: string;
  data: KGGraphStructure;
}>;

// --- Knowledge Graph API ---

export const getKnowledgeGraphStructure = async (
  orgdbId: string,
): Promise<KGGraphStructure> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<KGGraphResponse>(
    `/text2sql/graph/${orgdbId}/structure`,
  );
  return data.data;
};

export type KGStatus = Readonly<{
  orgdb_id: string;
  kg_name: string;
  kg_created_at: string | null;
  db_kg_exists: boolean;
  graph_kg_exists: boolean;
}>;

type KGStatusResponse = Readonly<{
  status_code: number;
  message: string;
  data: KGStatus;
}>;

export const getKnowledgeGraphStatus = async (
  orgdbId: string,
): Promise<KGStatus> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<KGStatusResponse>(
    `/text2sql/graph/${orgdbId}/status`,
  );
  return data.data;
};

export const generateKnowledgeGraph = async (
  orgdbId: string,
): Promise<void> => {
  const axiosInstance = getAxiosInstance();
  await axiosInstance.put(
    `/text2sql/graph/${orgdbId}/generate?skip_semantic_generation=true`,
  );
};

export type KGGenerationStatus = Readonly<{
  orgdb_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  error: string | null;
  started_at: string | null;
  kg_name: string | null;
  kg_created_at: string | null;
}>;

type KGGenerationStatusResponse = Readonly<{
  status_code: number;
  message: string;
  data: KGGenerationStatus;
}>;

export const getKnowledgeGraphGenerationStatus = async (
  orgdbId: string,
): Promise<KGGenerationStatus> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<KGGenerationStatusResponse>(
    `/text2sql/graph/${orgdbId}/generation-status`,
  );
  return data.data;
};

// --- Project Files (Excel Upload) ---

export type ExcelSheet = Readonly<{
  name: string;
  rows: number;
  columns: number;
  headers: string[];
}>;

export type ProjectFile = Readonly<{
  file_id: string;
  filename: string;
  project_id: string;
  sheets?: ExcelSheet[];
  total_rows: number;
  uploaded_at?: string;
  extension?: string;
}>;

export type UploadProjectFileResponse = Readonly<{
  file_id: string;
  filename: string;
  project_id: string;
  file_size_bytes: number;
}>;

export type ListProjectFilesResponse = Readonly<{
  files: ProjectFile[];
  count: number;
}>;

export type SheetDataResponse = Readonly<{
  sheet_name: string;
  columns: string[];
  data: Record<string, unknown>[];
  total_rows: number;
  total_columns: number;
  returned_rows: number;
  start_row: number;
}>;

export type DeleteFileResponse = Readonly<{
  ok: boolean;
  deleted: string;
  file_size_bytes: number;
}>;

export type PresignUploadResponse = Readonly<{
  file_id: string;
  filename: string;
  upload_url: string;
  expires_in: number;
}>;

export const uploadProjectFile = async (
  projectId: string,
  file: File,
): Promise<UploadProjectFileResponse> => {
  const axiosInstance = getAxiosInstance();

  // Step 1: Get presigned URL
  const { data: presign } = await axiosInstance.post<PresignUploadResponse>(
    `/agentic/upload_project_files/presign`,
    {
      project_id: projectId,
      filename: file.name,
      file_size_bytes: file.size,
      content_type: file.type || "application/octet-stream",
    },
  );

  // Step 2: Upload directly to S3
  const s3Response = await fetch(presign.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!s3Response.ok) {
    throw new Error(`S3 upload failed: ${s3Response.status}`);
  }

  // Step 3: Confirm upload (triggers pipeline)
  const { data } = await axiosInstance.post<UploadProjectFileResponse>(
    `/agentic/upload_project_files/confirm`,
    {
      project_id: projectId,
      file_id: presign.file_id,
      filename: presign.filename,
      file_size_bytes: file.size,
    },
  );
  return data;
};

export const listProjectFiles = async (
  projectId: string,
): Promise<ListProjectFilesResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<ListProjectFilesResponse>(
    `/agentic/project_files`,
    { params: { project_id: projectId } },
  );
  return data;
};

export const getProjectFile = async (fileId: string): Promise<ProjectFile> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<ProjectFile>(
    `/agentic/project_files/${fileId}`,
  );
  return data;
};

export const getSheetData = async (
  fileId: string,
  sheetName?: string,
  maxRows = 100,
  startRow = 2,
): Promise<SheetDataResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<SheetDataResponse>(
    `/agentic/project_files/${fileId}/sheet`,
    {
      params: {
        sheet_name: sheetName,
        max_rows: maxRows,
        start_row: startRow,
      },
    },
  );
  return data;
};

export const deleteProjectFile = async (
  fileId: string,
): Promise<DeleteFileResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.delete<DeleteFileResponse>(
    `/agentic/project_files/${fileId}`,
  );
  return data;
};

// Canonical indexing-stage taxonomy. Shared by the REST status endpoint
// (below) and the WS file.indexing_progress event payload (EventsContext).
export type FileIndexingStage =
  | "queued"
  | "extracting"
  | "chunking"
  | "embedding"
  | "upserting"
  | "validating"
  | "done"
  | "failed"
  | "dead";

export type IndexingStatusFile = Readonly<{
  file_id: string;
  filename: string;
  progress: number;
  stage: FileIndexingStage;
  started_at: number;
  updated_at: number;
}>;

export type IndexingStatusResponse = Readonly<{
  files: IndexingStatusFile[];
  count: number;
}>;

export const getIndexingStatus = async (
  projectId: string,
): Promise<IndexingStatusResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<IndexingStatusResponse>(
    `/agentic/project_files/indexing_status`,
    { params: { project_id: projectId } },
  );
  return data;
};

// --- Schema Refresh ---

export type RefreshOrgDbSchemaResponse = Readonly<{
  ok: boolean;
  changed?: boolean;
  message?: string;
  current_hash?: string;
  previous_hash?: string;
  schema_chars?: number;
  diff?: {
    added_tables?: string[];
    removed_tables?: string[];
  };
  error?: string;
}>;

export const refreshOrgDbSchema = async (
  orgdbId: string,
): Promise<RefreshOrgDbSchemaResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<RefreshOrgDbSchemaResponse>(
    "/agentic/orgdb_schema_refresh",
    null,
    { params: { orgdb_id: orgdbId } },
  );
  return data;
};
