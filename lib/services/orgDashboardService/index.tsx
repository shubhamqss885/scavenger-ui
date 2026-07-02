import { getAxiosInstance } from "@/lib/services/axiosInstances";
import { createServiceUrl } from "@/lib/services/axiosInstances/localDevConfig";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DashboardSummary = Readonly<{
  dashboard_id: string;
  name: string;
  widget_count: number;
  created_at: string;
  created_by?: string;
}>;

export type DashboardWidget = Readonly<{
  widget_id: string;
  widget_type: "chart" | "table";
  title: string;
  sql_query: string;
  cached_result: Record<string, any> | null;
  chart_config: Record<string, any> | null;
  position: number;
  last_refreshed_at: string | null;
  refresh_error: string | null;
  orgdb_id: string;
}>;

export type DashboardViewer = Readonly<{
  user_sub: string;
  granted_by: string;
  created_at: string;
}>;

export type RefreshInterval = "hourly" | "every_6h" | "daily" | "weekly";

export type DashboardSchedule = Readonly<{
  refresh_interval: RefreshInterval | null;
  // 0-23 in the dashboard's timezone (refresh_hour). Backend handles DST via zoneinfo.
  refresh_hour: number | null;
  refresh_day_of_week: number | null;
  // IANA TZ (e.g. 'Europe/Berlin'). Null = use backend default (Europe/Berlin).
  timezone: string | null;
  // BE-computed; the modal's PATCH payload sends null and the BE ignores it.
  next_refresh_at: string | null;
}>;

export type DashboardDetail = Readonly<{
  dashboard_id: string;
  name: string;
  org_id: string;
  created_by: string;
  created_at: string;
  widgets: DashboardWidget[];
  viewers: DashboardViewer[];
  refresh_interval: RefreshInterval | null;
  refresh_hour: number | null;
  refresh_day_of_week: number | null;
  timezone: string | null;
  next_refresh_at: string | null;
}>;

// ─── Dashboard CRUD ──────────────────────────────────────────────────────────

export const listDashboards = async (
  orgId: string,
): Promise<DashboardSummary[]> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get("/organization/dashboards", {
    params: { org_id: orgId },
  });
  return data.dashboards;
};

export const listMyDashboards = async (): Promise<DashboardSummary[]> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get("/organization/dashboards/my");
  return data.dashboards;
};

export const createDashboard = async (
  name: string,
  orgId: string,
): Promise<{ dashboard_id: string; name: string }> => {
  const axios = getAxiosInstance();
  const { data } = await axios.post("/organization/dashboards", {
    name,
    org_id: orgId,
  });
  return data;
};

export const deleteDashboard = async (dashboardId: string): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.delete(`/organization/dashboards/${dashboardId}`);
};

export const renameDashboard = async (
  dashboardId: string,
  name: string,
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.patch(`/organization/dashboards/${dashboardId}`, { name });
};

export const getDashboard = async (
  dashboardId: string,
): Promise<DashboardDetail> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(`/organization/dashboards/${dashboardId}`);
  return data;
};

export const updateDashboardSchedule = async (
  dashboardId: string,
  schedule: DashboardSchedule,
): Promise<DashboardSchedule> => {
  const axios = getAxiosInstance();
  const { data } = await axios.patch(
    `/organization/dashboards/${dashboardId}/schedule`,
    {
      interval: schedule.refresh_interval,
      hour: schedule.refresh_hour,
      day_of_week: schedule.refresh_day_of_week,
      timezone: schedule.timezone,
    },
  );
  return {
    refresh_interval: data.refresh_interval,
    refresh_hour: data.refresh_hour,
    refresh_day_of_week: data.refresh_day_of_week,
    timezone: data.timezone,
    next_refresh_at: data.next_refresh_at ?? null,
  };
};

// ─── Widget Operations ───────────────────────────────────────────────────────

export type AddWidgetPayload = Readonly<{
  orgdb_id: string;
  widget_type: "chart" | "table";
  title: string;
  sql_query: string;
  cached_result?: unknown;
}>;

export const addWidget = async (
  dashboardId: string,
  payload: AddWidgetPayload,
): Promise<{ widget_id: string; position: number }> => {
  const axios = getAxiosInstance();
  const { data } = await axios.post(
    `/organization/dashboards/${dashboardId}/widgets`,
    payload,
  );
  return data;
};

export const removeWidget = async (
  dashboardId: string,
  widgetId: string,
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.delete(
    `/organization/dashboards/${dashboardId}/widgets/${widgetId}`,
  );
};

export const reorderWidgets = async (
  dashboardId: string,
  widgetIds: string[],
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.patch(`/organization/dashboards/${dashboardId}/widgets/reorder`, {
    widget_ids: widgetIds,
  });
};

export type UpdateWidgetPayload = Readonly<{
  widget_type: "chart" | "table";
  title: string;
  sql_query: string;
  cached_result?: unknown;
}>;

// Replace a widget's content in place (edit-from-dashboard). The BE keeps the
// widget's id and position and returns the full updated widget.
export const updateWidget = async (
  dashboardId: string,
  widgetId: string,
  payload: UpdateWidgetPayload,
): Promise<DashboardWidget> => {
  const axios = getAxiosInstance();
  const { data } = await axios.patch(
    `/organization/dashboards/${dashboardId}/widgets/${widgetId}`,
    payload,
  );
  return data.widget;
};

// ─── Refresh ─────────────────────────────────────────────────────────────────

export type RefreshEvent = Readonly<{
  event: "progress" | "done" | "complete";
  widget_id?: string;
  index?: number;
  total?: number;
  status?: "refreshing" | "ok" | "error";
  error?: string;
}>;

export const refreshDashboard = (
  dashboardId: string,
  onEvent: (event: RefreshEvent) => void,
  onComplete: () => void,
): (() => void) => {
  const axios = getAxiosInstance();
  // Initial `createAxiosInstance` puts the token on `defaults.headers.Authorization`
  // (top-level); only the 401-refresh path writes to `.common.Authorization`. Check
  // both so a fresh page load before any refresh still carries auth.
  const token =
    axios.defaults.headers.common["Authorization"]?.toString() ??
    (axios.defaults.headers as any).Authorization?.toString() ??
    "";

  const baseUrl = createServiceUrl(
    axios.defaults.baseURL ?? "",
    "organization",
  );
  const url = `${baseUrl}/organization/dashboards/${dashboardId}/refresh`;

  // SSE doesn't support auth headers natively, so we use a fetch-based reader
  // with the Authorization header instead of EventSource.
  const controller = new AbortController();

  // Guarantee onComplete fires at most once. Without this, the happy path
  // double-fires (once for the "complete" event, once on stream-end), and a
  // null response.body would leave the caller's spinner stuck forever.
  let completed = false;
  const fireOnce = () => {
    if (completed) return;
    completed = true;
    onComplete();
  };

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.body) {
        fireOnce();
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as RefreshEvent;
              onEvent(event);
              if (event.event === "complete") fireOnce();
            } catch {
              // skip malformed lines
            }
          }
        }
      }
      fireOnce();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Refresh stream error:", err);
        fireOnce();
      }
    });

  return () => controller.abort();
};

// ─── Viewer Access ───────────────────────────────────────────────────────────

export const grantViewerAccess = async (
  dashboardId: string,
  userSub: string,
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.post(`/organization/dashboards/${dashboardId}/viewers`, {
    user_sub: userSub,
  });
};

export const revokeViewerAccess = async (
  dashboardId: string,
  userSub: string,
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.delete(
    `/organization/dashboards/${dashboardId}/viewers/${userSub}`,
  );
};

// ─── Share Link ───────────────────────────────────────────────────────────────

export const getShareToken = async (
  dashboardId: string,
): Promise<string | null> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(
    `/organization/dashboards/${dashboardId}/share`,
  );
  return data.share_token ?? null;
};

export const generateShareToken = async (
  dashboardId: string,
): Promise<string> => {
  const axios = getAxiosInstance();
  const { data } = await axios.post(
    `/organization/dashboards/${dashboardId}/share`,
  );
  return data.share_token;
};

export const revokeShareToken = async (dashboardId: string): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.delete(`/organization/dashboards/${dashboardId}/share`);
};

// Returns true if access was newly granted, false if the user already had it.
// Defaults to true when the field is absent (older BE) so we keep the positive copy.
export const redeemShareToken = async (
  dashboardId: string,
  token: string,
): Promise<boolean> => {
  const axios = getAxiosInstance();
  const { data } = await axios.post(
    `/organization/dashboards/${dashboardId}/share/redeem`,
    { token },
  );
  return data?.newly_granted ?? true;
};

// ─── Email Reports ───────────────────────────────────────────────────────────

export type EmailInterval = "daily" | "weekly" | "monthly";

export type EmailSchedule = Readonly<{
  email_interval: EmailInterval | null;
  email_hour: number | null;
  email_day_of_week: number | null;
  email_day_of_month: number | null;
  email_paused: boolean;
  email_refresh_before_send: boolean;
  next_email_at: string | null;
  last_email_at: string | null;
  custom_title: string | null;
  custom_note: string | null;
  context: string | null;
  exclude_data: boolean;
  max_charts: number;
  language: string | null;
}>;

export type EmailSchedulePayload = Readonly<{
  email_interval: EmailInterval | null;
  email_hour: number | null;
  email_day_of_week: number | null;
  email_day_of_month: number | null;
  email_paused: boolean;
  email_refresh_before_send: boolean;
  timezone?: string | null;
  custom_title?: string | null;
  custom_note?: string | null;
  context?: string | null;
  max_charts?: number;
  language?: string | null;
}>;

export type EmailSubscriber = Readonly<{
  id: string;
  email: string;
  user_sub: string | null;
  added_by: string;
  created_at: string;
  auto_added_as_viewer?: boolean;
}>;

export type EmailHistoryEntry = Readonly<{
  id: string;
  sent_at: string;
  subject: string | null;
  recipient_count: number;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  summary_text: string | null;
}>;

export const getEmailSchedule = async (
  dashboardId: string,
): Promise<EmailSchedule | null> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(
    `/organization/dashboards/${dashboardId}/email-schedule`,
  );

  if (!data || Object.keys(data).length === 0) return null;

  return data as EmailSchedule;
};

export const updateEmailSchedule = async (
  dashboardId: string,
  payload: EmailSchedulePayload,
): Promise<EmailSchedule> => {
  const axios = getAxiosInstance();
  const { data } = await axios.patch(
    `/organization/dashboards/${dashboardId}/email-schedule`,
    payload,
  );
  return data as EmailSchedule;
};

export const listEmailSubscribers = async (
  dashboardId: string,
): Promise<EmailSubscriber[]> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(
    `/organization/dashboards/${dashboardId}/email-subscribers`,
  );
  return data as EmailSubscriber[];
};

export const addEmailSubscriber = async (
  dashboardId: string,
  email: string,
): Promise<EmailSubscriber> => {
  const axios = getAxiosInstance();
  const { data } = await axios.post(
    `/organization/dashboards/${dashboardId}/email-subscribers`,
    { email },
  );
  return data as EmailSubscriber;
};

export const removeEmailSubscriber = async (
  dashboardId: string,
  email: string,
): Promise<void> => {
  const axios = getAxiosInstance();
  await axios.delete(
    `/organization/dashboards/${dashboardId}/email-subscribers/${encodeURIComponent(email)}`,
  );
};

export const getEmailHistory = async (
  dashboardId: string,
): Promise<EmailHistoryEntry[]> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(
    `/organization/dashboards/${dashboardId}/email-history`,
  );
  return data as EmailHistoryEntry[];
};

export const getEmailPreviewHtml = async (
  dashboardId: string,
): Promise<string> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get<string>(
    `/organization/dashboards/${dashboardId}/email-preview`,
    { responseType: "text" },
  );
  return data;
};

export const unsubscribeByToken = async (
  token: string,
): Promise<{ message: string }> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get(
    `/organization/dashboards/email/unsubscribe/${token}`,
  );
  return data;
};

// ─── Org Members ────────────────────────────────────────────────────────────

export type OrgMember = Readonly<{
  user_sub: string;
  username: string;
  email: string;
  role_name: string;
}>;

// The backend returns members as { sub, name, email, role_name }; map to the
// FE shape so downstream code (grant body, dedupe, display) reads user_sub.
type OrgMemberResponse = Readonly<{
  sub: string;
  name: string;
  email: string;
  role_name: string;
}>;

export const getOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
  const axios = getAxiosInstance();
  const { data } = await axios.get("/organization/dashboards/org_members", {
    params: { org_id: orgId },
  });
  return (data.members as OrgMemberResponse[]).map((m) => ({
    user_sub: m.sub,
    username: m.name,
    email: m.email,
    role_name: m.role_name,
  }));
};
