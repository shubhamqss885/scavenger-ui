import { getAxiosInstance } from "@/lib/services/axiosInstances";

// Shared Type Aliases
export type FeedbackTypeFilter = "all" | "chat" | "text_to_sql";

export type FeedbackValueFilter = "+1" | "-1" | "with_rating" | "all";

export type FeedbackRating = "+1" | "-1";

export type RecordType =
  | "chat"
  | "text_to_sql"
  | "text_to_nosql"
  | "quick_action";

// Request Types
export interface GetOrgDbFeedbackParams {
  orgdb_id: string;
  feedback_type?: FeedbackTypeFilter;
  feedback_value?: FeedbackValueFilter;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
}

// Response Types
export type Pagination = Readonly<{
  page: number;
  page_size: number;
  total_pages: number;
  returned_count: number;
}>;

export type FeedbackFiltersResponse = Readonly<{
  orgdb_id: string;
  feedback_type: FeedbackTypeFilter;
  feedback_value: FeedbackValueFilter;
  start_date: string | null;
  end_date: string | null;
}>;

// Base fields shared by all feedback types
export type BaseFeedbackRecord = Readonly<{
  type: RecordType;
  conversation_id: string;
  session_id: string;
  prompt: string;
  response: string;
  feedback: FeedbackRating;
  feedback_comment: string | null;
  created_at: string;
  user_sub: string;
  user_name: string;
  user_email: string;
  project_name: string;
  is_resolved: boolean;
}>;

// Chat feedback (NORMAL_CHAT)
export type ChatFeedbackRecord = BaseFeedbackRecord &
  Readonly<{
    type: "chat";
  }>;

// Text-to-SQL/NoSQL feedback
export type TextToSqlFeedbackRecord = BaseFeedbackRecord &
  Readonly<{
    type: "text_to_sql" | "text_to_nosql";
    generated_sql: string | null;
    visualization: string | null;
    analysis: string | null;
    sql_title: string | null;
    table_data: string | null;
    orgdb_id: string | null;
    sql_explanation: string | null;
  }>;

// Quick action feedback
export type QuickActionFeedbackRecord = BaseFeedbackRecord &
  Readonly<{
    type: "quick_action";
    subtype: string;
  }>;

// Union type for all feedback records
export type FeedbackRecord =
  | ChatFeedbackRecord
  | TextToSqlFeedbackRecord
  | QuickActionFeedbackRecord;

export type FeedbackData = Readonly<{
  total_count: number;
  pagination: Pagination;
  filters: FeedbackFiltersResponse;
  records: FeedbackRecord[];
}>;

export type GetOrgDbFeedbackResponse = Readonly<{
  status: "success" | "error";
  data: FeedbackData;
  message?: string;
}>;

// ---------------------------------------------------------------------------
// Architecture note: Client-side filtering & CSV export
// ---------------------------------------------------------------------------
// All feedback records are fetched in a single request (up to MAX_PAGE_SIZE)
// and filtering, sorting, pagination, and CSV generation are handled entirely
// on the frontend. This avoids extra round-trips for every filter change and
// keeps the UX snappy. The backend download endpoint below is kept for
// reference but is NO LONGER USED — CSV export is now generated client-side
// from the filtered dataset so users always get exactly what they see.
// ---------------------------------------------------------------------------

// Download request params (no pagination - backend caps at 10,000 rows)
// DEPRECATED: Kept for reference. CSV export is now handled client-side
// in useFeedbackData so all active filters (including email) are respected.
export interface DownloadOrgDbFeedbackParams {
  orgdb_id: string;
  feedback_type?: FeedbackTypeFilter;
  feedback_value?: FeedbackValueFilter;
  start_date?: string;
  end_date?: string;
}

export type DownloadOrgDbFeedbackResponse = Readonly<{
  status: "success" | "error";
  data: { download_link: string };
  message?: string;
}>;

// Update feedback resolution
export type UpdateFeedbackResolutionParams = Readonly<{
  conversation_id: string;
  is_resolved: boolean;
}>;

export type UpdateFeedbackResolutionResponse = Readonly<{
  status: "success" | "error";
  message?: string;
}>;

// API Functions
export async function getOrgDbFeedback(
  params: GetOrgDbFeedbackParams,
): Promise<GetOrgDbFeedbackResponse> {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<GetOrgDbFeedbackResponse>(
    "/llm/get_orgdb_feedback",
    { params },
  );
  return response.data;
}

// DEPRECATED: Kept for reference. Use client-side CSV generation instead.
export async function downloadOrgDbFeedback(
  params: DownloadOrgDbFeedbackParams,
): Promise<DownloadOrgDbFeedbackResponse> {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<DownloadOrgDbFeedbackResponse>(
    "/llm/download_orgdb_feedback",
    { params },
  );
  return response.data;
}

export async function updateFeedbackResolution(
  params: UpdateFeedbackResolutionParams,
): Promise<UpdateFeedbackResolutionResponse> {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<UpdateFeedbackResolutionResponse>(
    "/llm/update_feedback_resolution",
    null,
    { params },
  );
  return response.data;
}
