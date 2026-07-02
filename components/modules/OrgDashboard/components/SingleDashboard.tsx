"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import {
  getDashboard,
  redeemShareToken,
  removeWidget,
  type DashboardDetail,
} from "@/lib/services/orgDashboardService";
import { OrgDashboardsContext } from "@/lib/context/OrgDashboardContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useWidgetEdit } from "../hooks/useWidgetEdit";
import EditWidgetSheet from "./EditWidgetSheet";
import { useContextSelector } from "use-context-selector";
import PageHeader from "@/components/blocks/Header";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { useDashboardRefresh } from "../hooks/useDashboardRefresh";
import { useScheduledDashboardRefetch } from "../hooks/useScheduledDashboardRefetch";
import WidgetCard from "./WidgetCard";
import ShareDashboardModal from "./ShareDashboardModal";
import ScheduleModal from "./ScheduleModal";
import ScheduleSummary from "./ScheduleSummary";
import DashboardEmptyState from "./DashboardEmptyState";
import EmailReportsModal from "./EmailReportsModal";

// Roles allowed to manage a share link. Keep in sync with the BE.
const SHARE_DASHBOARD_ROLES = [
  "org-admin",
  "org-user",
  "super-admin",
  "private-user",
] as const;

const DashboardPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;
  const { isFeatureEnabled, FEATURE_FLAGS, homeRoute } = useOrgFeatures();
  const { userProfile } = useUserContext();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_ORG_DASHBOARDS);
  const canSchedule = isFeatureEnabled(FEATURE_FLAGS.SCHEDULE_ORG_DASHBOARDS);
  const canShareDashboard =
    !!userProfile?.user_role_name &&
    (SHARE_DASHBOARD_ROLES as readonly string[]).includes(
      userProfile.user_role_name,
    );
  // Only org-viewers need to redeem — every other role already has access.
  const roleKnown = !!userProfile?.user_role_name;
  const isOrgViewer = userProfile?.user_role_name === "org-viewer";
  const dashboardId = typeof id === "string" ? id : "";

  const decrementWidgetCount = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.decrementWidgetCount,
  )!;

  const fetchOrgDashboards = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.fetchOrgDashboards,
  );

  const dashboardNameFromContext = useContextSelector(
    OrgDashboardsContext,
    (ctx) =>
      ctx?.orgDashboards.find((d) => d.dashboard_id === dashboardId)?.name,
  );

  const { organizationDbs } = useOrganizationDbData();

  // Membership set for the per-widget "is its datasource still available" check
  // in the render loop (avoids O(widgets × dbs) scans each render).
  const availableOrgdbIds = useMemo(
    () => new Set(organizationDbs.map((db) => db.orgdb_id)),
    [organizationDbs],
  );

  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Edit-a-widget-in-a-chat-sheet orchestration (open, edit context, live
  // updates, teardown) lives in this hook.
  const { editing, editContext, handleEdit, closeEdit, deleteEditChat } =
    useWidgetEdit(dashboardId, setDashboard);

  // Read ?share once at mount (lazy init avoids useSearchParams' Suspense
  // boundary). Frozen for the component's life; the redeem effect strips it.
  const [shareToken] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("share"),
  );
  const [shareError, setShareError] = useState<"wrong_org" | "invalid" | null>(
    null,
  );
  const redeemedRef = useRef(false);

  const fetchDashboard = useCallback(
    async (options?: { silent?: boolean; fromShare?: boolean }) => {
      if (!dashboardId) return;
      const silent = options?.silent ?? false;

      // Silent mode (used after refresh completes): swap data in without
      // unmounting the dashboard. Prevents the brief loading flash where the
      // old widgets disappear before fresh ones render.
      if (!silent) {
        setLoading(true);
        setDashboard(null);
      }
      setLoadFailed(false);
      try {
        const data = await getDashboard(dashboardId);
        setDashboard(data);
      } catch (err: any) {
        // 404 = resource genuinely missing; let the "not found" branch render.
        // Anything else (5xx, network, timeout) is a load failure.
        if (err?.response?.status !== 404) {
          console.error("Error fetching dashboard:", err);
          // Arrived via a share link and got 403 → it's a cross-org block, not a
          // generic failure; show the specific "wrong org" message.
          if (options?.fromShare && err?.response?.status === 403) {
            setShareError("wrong_org");
          } else if (silent) {
            // Silent mode (post-refresh): we already have valid dashboard state
            // on screen, so toast instead of clobbering it with the error view.
            toast.error(t("orgDashboard.page.loadFailed"));
          } else {
            setLoadFailed(true);
          }
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [dashboardId, t],
  );

  // Preload the recharts chart chunk on mount so dashboard widget charts render
  // with no wait. recharts is code-split out of First Load JS (see WidgetCard's
  // dynamic AgenticChart import); this downloads it in parallel with the widget
  // fetch instead of on first chart render.
  useEffect(() => {
    void import(
      "@/components/modules/AgenticChat/components/tools/AgenticChart"
    );
  }, []);

  // A viewer redeeming via ?share owns the load (their GET would 403 until
  // granted). A non-viewer on a share link just loads normally — same-org loads
  // fine; cross-org 403s, and fromShare surfaces that as the wrong-org message.
  const shouldRedeem = !!shareToken && isOrgViewer;
  useEffect(() => {
    if (shareError || shouldRedeem) return;
    if (shareToken && !roleKnown) return; // wait until we know if they redeem
    if (shareToken) {
      router.replace(`/dashboard/${dashboardId}`);
      fetchDashboard({ fromShare: true });
      return;
    }
    fetchDashboard();
  }, [
    fetchDashboard,
    shareToken,
    shouldRedeem,
    roleKnown,
    shareError,
    router,
    dashboardId,
  ]);

  // Redeem the share link once (org-viewers only), then strip ?share.
  useEffect(() => {
    if (!shouldRedeem || !shareToken || redeemedRef.current) return;
    redeemedRef.current = true; // StrictMode guard (BE is idempotent too)
    (async () => {
      try {
        const newlyGranted = await redeemShareToken(dashboardId, shareToken);
        toast.success(
          t(
            newlyGranted
              ? "orgDashboard.shareLink.redeemed"
              : "orgDashboard.shareLink.alreadyHadAccess",
          ),
        );
        fetchOrgDashboards?.(); // it now shows in the viewer's list
        router.replace(`/dashboard/${dashboardId}`);
        fetchDashboard();
      } catch (err: any) {
        setShareError(
          err?.response?.data?.detail === "wrong_org" ? "wrong_org" : "invalid",
        );
        setLoading(false);
        router.replace(`/dashboard/${dashboardId}`);
      }
    })();
  }, [
    shouldRedeem,
    shareToken,
    dashboardId,
    fetchDashboard,
    fetchOrgDashboards,
    router,
    t,
  ]);

  const { refreshing, progress, handleRefresh, cancel } = useDashboardRefresh({
    dashboardId,
    widgetCount: dashboard?.widgets.length ?? 0,
    onComplete: () => fetchDashboard({ silent: true }),
  });

  // Pulls in scheduler-driven refreshes silently. Disabled during a manual
  // refresh — useDashboardRefresh already triggers its own refetch on complete.
  const { isPolling: scheduledRefreshing } = useScheduledDashboardRefetch({
    dashboardId,
    nextRefreshAt: dashboard?.next_refresh_at ?? null,
    widgets: dashboard?.widgets ?? [],
    onRefetched: (next) => setDashboard(next),
    // Pause while editing so a poll snapshot can't clobber a live in-place update.
    enabled: !refreshing && !editing,
  });

  const handleRemoveWidget = useCallback(
    async (widgetId: string) => {
      if (!dashboardId) return;
      try {
        await removeWidget(dashboardId, widgetId);
        setDashboard((prev) =>
          prev
            ? {
                ...prev,
                widgets: prev.widgets.filter((w) => w.widget_id !== widgetId),
              }
            : prev,
        );
        decrementWidgetCount(dashboardId);
      } catch (err) {
        console.error("Error removing widget:", err);
        toast.error(t("orgDashboard.widget.removeFailed"));
      }
    },
    [dashboardId, decrementWidgetCount, t],
  );

  const lastRefreshedAt = useMemo(() => {
    const timestamps = (dashboard?.widgets ?? [])
      .map((w) => w.last_refreshed_at)
      .filter(Boolean) as string[];

    if (timestamps.length === 0) return null;
    return timestamps.sort().pop()!;
  }, [dashboard?.widgets]);

  // Redeem failure: show the specific reason, not the generic load error.
  if (shareError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon name="AlertCircle" size="lg" variant="destructive" />
        <p className="text-sm text-muted-foreground">
          {shareError === "wrong_org"
            ? t("orgDashboard.shareLink.wrongOrg")
            : t("orgDashboard.shareLink.invalid")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          {t("orgDashboard.page.goToDashboards")}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {t("orgDashboard.widget.loading")}
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon name="AlertCircle" size="lg" variant="destructive" />
        <p className="text-sm text-muted-foreground">
          {t("orgDashboard.page.loadFailed")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          {t("orgDashboard.page.goToDashboards")}
        </Button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon name="LayoutDashboard" size="lg" variant="muted" />
        <p className="text-sm text-muted-foreground">
          {t("orgDashboard.page.notFound")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          {t("orgDashboard.page.goToDashboards")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 @container">
      <PageHeader title={dashboardNameFromContext ?? dashboard.name}>
        {lastRefreshedAt && (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {t("orgDashboard.refresh.lastRefreshed", {
              time: new Date(lastRefreshedAt).toLocaleString(),
            })}
          </span>
        )}
        <ScheduleSummary
          dashboard={dashboard}
          canEdit={canSchedule}
          disabled={refreshing || dashboard.widgets.length === 0}
          refreshing={scheduledRefreshing}
          onOpenModal={() => setShowScheduleModal(true)}
        />
        {canEdit &&
          (refreshing ? (
            <Button size="sm" variant="outline" onClick={cancel}>
              <Icon name="X" size="sm" className="mr-1" />
              {t("orgDashboard.refresh.cancel")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={dashboard.widgets.length === 0}
            >
              <Icon name="RefreshCw" size="sm" className="mr-1" />
              {t("orgDashboard.refresh.all")}
            </Button>
          ))}
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEmailModal(true)}
          >
            <Icon name="Mail" size="sm" className="mr-1" />
            {t("orgDashboard.emailReports.button")}
          </Button>
        )}
        {(canShareDashboard || canEdit) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowShareModal(true)}
          >
            <Icon name="Share2" size="sm" className="mr-1" />
            {t("orgDashboard.shareLink.share")}
          </Button>
        )}
      </PageHeader>

      {refreshing && (
        <div className="mb-4">
          <Progress
            value={(progress.index / Math.max(progress.total, 1)) * 100}
            className="h-1.5"
          />
        </div>
      )}

      {dashboard.widgets.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 pb-8 @5xl:grid-cols-2">
          {dashboard.widgets.map((widget) => (
            <WidgetCard
              key={widget.widget_id}
              widget={widget}
              onRemove={handleRemoveWidget}
              refreshing={refreshing}
              canEdit={canEdit}
              onEdit={canEdit ? handleEdit : undefined}
              datasourceAvailable={availableOrgdbIds.has(widget.orgdb_id)}
            />
          ))}
        </div>
      )}

      <ShareDashboardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        dashboardId={dashboardId}
        orgId={dashboard.org_id}
        viewers={dashboard.viewers}
        onViewersChange={(viewers) =>
          setDashboard((prev) => (prev ? { ...prev, viewers } : prev))
        }
        canShareLink={canShareDashboard}
        canManageViewers={canEdit}
      />

      <EmailReportsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        dashboardId={dashboardId}
        orgId={dashboard.org_id}
        timezone={dashboard.timezone}
      />

      <ScheduleModal
        isOpen={canSchedule && showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        dashboardId={dashboardId}
        schedule={{
          refresh_interval: dashboard.refresh_interval,
          refresh_hour: dashboard.refresh_hour,
          refresh_day_of_week: dashboard.refresh_day_of_week,
          timezone: dashboard.timezone,
          next_refresh_at: dashboard.next_refresh_at,
        }}
        onScheduleChange={(next) =>
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  refresh_interval: next.refresh_interval,
                  refresh_hour: next.refresh_hour,
                  refresh_day_of_week: next.refresh_day_of_week,
                  timezone: next.timezone,
                  next_refresh_at: next.next_refresh_at ?? null,
                }
              : prev,
          )
        }
      />

      <EditWidgetSheet
        projectId={editing?.projectId ?? null}
        widget={editing?.widget ?? null}
        edit={editContext}
        onClose={closeEdit}
        onDeleteChat={deleteEditChat}
      />
    </div>
  );
};

export default DashboardPage;
