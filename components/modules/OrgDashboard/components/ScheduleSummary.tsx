"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { DashboardDetail } from "@/lib/services/orgDashboardService";
import {
  formatDayLocale,
  formatHourLocale,
  formatRelativeTime,
  formatTimezoneShort,
  getBrowserTimezone,
} from "@/lib/utils/dashboardSchedule";

type Props = Readonly<{
  dashboard: DashboardDetail;
  canEdit: boolean;
  disabled: boolean;
  // True while useScheduledDashboardRefetch is actively polling the BE for
  // post-fire-time updates. Surfaces as an animated Clock icon.
  refreshing: boolean;
  onOpenModal: () => void;
}>;

/**
 * Header chip that surfaces the dashboard's auto-refresh schedule. Admins get
 * a button that opens the schedule modal; viewers get a read-only span. Both
 * show base + tiny relative countdown (e.g. "Auto: hourly · in 45 min").
 */
const ScheduleSummary = ({
  dashboard,
  canEdit,
  disabled,
  refreshing,
  onOpenModal,
}: Props) => {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  // Drives the "in 45 min" countdown. Idle when no schedule is set.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!dashboard.next_refresh_at) return;
    const tickId = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tickId);
  }, [dashboard.next_refresh_at]);

  const summary = useMemo<{
    base: string;
    relative: string | null;
  } | null>(() => {
    if (!dashboard.refresh_interval) return null;

    // Times live in the dashboard's TZ; the BE handles DST so we just format.
    let base: string | null = null;
    if (dashboard.refresh_interval === "hourly") {
      base = t("orgDashboard.schedule.summary.hourly");
    } else if (dashboard.refresh_interval === "every_6h") {
      base = t("orgDashboard.schedule.summary.every_6h");
    } else {
      const time =
        dashboard.refresh_hour !== null
          ? formatHourLocale(dashboard.refresh_hour, locale)
          : "";

      if (dashboard.refresh_interval === "daily") {
        base = t("orgDashboard.schedule.summary.daily", { time });
      } else if (dashboard.refresh_interval === "weekly") {
        const day =
          dashboard.refresh_day_of_week !== null
            ? formatDayLocale(dashboard.refresh_day_of_week, locale, "short")
            : "";
        base = t("orgDashboard.schedule.summary.weekly", { day, time });
      }
    }
    if (!base) return null;
    const relative = dashboard.next_refresh_at
      ? formatRelativeTime(dashboard.next_refresh_at, locale, now)
      : null;
    return { base, relative };
  }, [dashboard, t, locale, now]);

  // TZ suffix only when the dashboard's TZ differs from the viewer's — saves
  // them from misreading "9:00" as their local time.
  const tooltip = useMemo(() => {
    if (!summary) return undefined;
    const full = summary.relative
      ? `${summary.base} · ${summary.relative}`
      : summary.base;

    if (!dashboard.timezone) return full;
    const browserTz = getBrowserTimezone();

    if (dashboard.timezone === browserTz) return full;
    return `${full} · ${formatTimezoneShort(dashboard.timezone)}`;
  }, [summary, dashboard.timezone]);

  if (canEdit) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onOpenModal}
        disabled={disabled}
        title={tooltip ?? undefined}
      >
        <Icon
          name="Clock"
          size="sm"
          className={cn("mr-1", refreshing && "animate-spin")}
        />
        {summary ? (
          <span className="flex max-w-[260px] items-baseline gap-1 overflow-hidden">
            <span className="truncate">{summary.base}</span>
            {summary.relative && (
              <span className="shrink-0 text-[10px] font-normal text-muted-foreground">
                · {summary.relative}
              </span>
            )}
          </span>
        ) : (
          <span>{t("orgDashboard.schedule.trigger")}</span>
        )}
      </Button>
    );
  }

  if (!summary) return null;
  return (
    <span
      className="flex max-w-[280px] items-baseline gap-1 overflow-hidden whitespace-nowrap text-xs text-muted-foreground"
      title={tooltip ?? undefined}
    >
      <span className="truncate">{summary.base}</span>
      {summary.relative && (
        <span className="shrink-0 text-[10px] opacity-80">
          · {summary.relative}
        </span>
      )}
    </span>
  );
};

export default ScheduleSummary;
