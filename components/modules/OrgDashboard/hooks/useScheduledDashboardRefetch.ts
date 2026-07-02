import { useCallback, useEffect, useRef } from "react";

import { usePolling } from "@/lib/hooks/usePolling";
import {
  getDashboard,
  type DashboardDetail,
  type DashboardWidget,
} from "@/lib/services/orgDashboardService";

type Args = Readonly<{
  dashboardId: string;
  nextRefreshAt: string | null;
  widgets: readonly DashboardWidget[];
  onRefetched: (next: DashboardDetail) => void;
  enabled?: boolean;
}>;

// Buffer past next_refresh_at before checking — lets the BE start its refresh.
const POST_FIRE_BUFFER_MS = 5_000;
const RETRY_MS = 10_000;
const MAX_ATTEMPTS = 6;
// Past this much in the past, assume the BE already fired and the initial
// fetch is post-refresh. If the BE scheduler is broken the FE stays silent
// here — broken scheduler is a separate alerting concern, not a poll-loop one.
const STALE_LOAD_THRESHOLD_MS = 5 * 60 * 1_000;

type WidgetBaseline = Readonly<{
  lastRefreshedAt: string | null;
  refreshError: string | null;
}>;

const snapshotWidgets = (
  widgets: readonly DashboardWidget[],
): Map<string, WidgetBaseline> =>
  new Map(
    widgets.map((w) => [
      w.widget_id,
      { lastRefreshedAt: w.last_refreshed_at, refreshError: w.refresh_error },
    ]),
  );

/**
 * Polls around `next_refresh_at` so scheduler-driven refreshes surface in the
 * UI without a manual reload.
 *
 * Freshness = every widget moved from its baseline (timestamp advanced OR
 * error string differs). Avoids stopping mid-stream when widget 1 finished
 * but 2 and 3 are still running. Known limitation: BE rewriting the exact
 * same error verbatim is not detectable.
 */
export const useScheduledDashboardRefetch = ({
  dashboardId,
  nextRefreshAt,
  widgets,
  onRefetched,
  enabled = true,
}: Args) => {
  const baselineRef = useRef<Map<string, WidgetBaseline> | null>(null);
  // Synchronous re-entry guard. isPolling propagates via useEffect, so
  // checking it isn't enough to block timer + visibility racing into a
  // double-start.
  const startedRef = useRef(false);

  // Held in refs (not deps) so the scheduling effect doesn't churn. usePolling's
  // `start` identity flips with isPolling, and widgets/onRefetched change every
  // parent render — depending on any of them re-fires begin() on each render,
  // which becomes an infinite loop when next_refresh_at is in the past.
  const onRefetchedRef = useRef(onRefetched);
  const widgetsRef = useRef(widgets);
  useEffect(() => {
    onRefetchedRef.current = onRefetched;
  }, [onRefetched]);
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  const isFresh = (data: DashboardDetail | null): boolean => {
    if (!data) return false;
    const baselines = baselineRef.current;

    if (!baselines || data.widgets.length === 0) return false;
    return data.widgets.every((w) => {
      const b = baselines.get(w.widget_id);

      // Widget added since baseline → counts as touched.
      if (!b) return true;
      // Parse to ms — string compare on ISO would break if BE ever varies
      // fractional-second precision (e.g. with/without ".000Z").
      if (
        w.last_refreshed_at &&
        (!b.lastRefreshedAt ||
          Date.parse(w.last_refreshed_at) > Date.parse(b.lastRefreshedAt))
      ) {
        return true;
      }
      return w.refresh_error !== b.refreshError;
    });
  };

  const { start, stop, isPolling } = usePolling<DashboardDetail>({
    fn: () => getDashboard(dashboardId),
    interval: { type: "fixed", value: RETRY_MS },
    autoStart: false,
    immediate: true,
    maxAttempts: MAX_ATTEMPTS,
    stopWhen: (data) => isFresh(data),
    onSuccess: (data) => {
      if (isFresh(data)) onRefetchedRef.current(data);
    },
  });

  const startRef = useRef(start);
  const stopRef = useRef(stop);
  const isPollingRef = useRef(isPolling);
  useEffect(() => {
    startRef.current = start;
    stopRef.current = stop;
    isPollingRef.current = isPolling;
    // Release the re-entry guard once polling actually stops.
    if (!isPolling) startedRef.current = false;
  }, [start, stop, isPolling]);

  const begin = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    baselineRef.current = snapshotWidgets(widgetsRef.current);
    startRef.current();
  }, []);

  useEffect(() => {
    if (!enabled || !nextRefreshAt) {
      stopRef.current();
      return;
    }

    const fireAt = new Date(nextRefreshAt).getTime() + POST_FIRE_BUFFER_MS;
    const delay = fireAt - Date.now();

    if (delay < -STALE_LOAD_THRESHOLD_MS) {
      stopRef.current();
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (delay <= 0) {
      begin();
    } else {
      timer = setTimeout(begin, delay);
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopRef.current();
    };
  }, [enabled, nextRefreshAt, begin]);

  // Backgrounded tabs throttle setTimeout — fall back to a visibility check.
  useEffect(() => {
    if (!enabled || !nextRefreshAt) return;

    const handler = () => {
      if (document.visibilityState !== "visible") return;
      const fireAt = new Date(nextRefreshAt).getTime() + POST_FIRE_BUFFER_MS;

      if (Date.now() >= fireAt) begin();
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enabled, nextRefreshAt, begin]);

  return { isPolling };
};
