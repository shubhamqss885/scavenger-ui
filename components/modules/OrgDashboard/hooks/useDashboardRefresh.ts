"use client";

import { useEffect, useRef, useState } from "react";
import {
  refreshDashboard,
  type RefreshEvent,
} from "@/lib/services/orgDashboardService";

type RefreshProgress = Readonly<{
  index: number;
  total: number;
}>;

type UseDashboardRefreshArgs = Readonly<{
  dashboardId: string;
  widgetCount: number;
  onComplete: () => void;
}>;

type UseDashboardRefreshReturn = Readonly<{
  refreshing: boolean;
  progress: RefreshProgress;
  handleRefresh: () => void;
  cancel: () => void;
}>;

export const useDashboardRefresh = ({
  dashboardId,
  widgetCount,
  onComplete,
}: UseDashboardRefreshArgs): UseDashboardRefreshReturn => {
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress>({
    index: 0,
    total: 0,
  });
  const abortRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(0);
  const doneRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.();
      abortRef.current = null;
    };
  }, []);

  const handleRefresh = () => {
    if (refreshing || !dashboardId) return;
    setRefreshing(true);
    startedRef.current = 0;
    doneRef.current = 0;
    setProgress({ index: 0, total: widgetCount });

    abortRef.current = refreshDashboard(
      dashboardId,
      (event: RefreshEvent) => {
        if (typeof event.total === "number") {
          if (event.status === "refreshing") startedRef.current += 1;
          else if (event.status === "ok" || event.status === "error")
            doneRef.current += 1;
          const total = event.total;
          const index =
            doneRef.current + (startedRef.current - doneRef.current) * 0.5;
          setProgress({ index, total });
        }
      },
      () => {
        abortRef.current = null;
        setRefreshing(false);
        onComplete();
      },
    );
  };

  // FE-only cancel: aborts the SSE stream so the user gets back to interactive
  // state. The BE may keep working until done; we refetch so the dashboard
  // reflects whichever widgets actually completed before the abort landed.
  const cancel = () => {
    if (!abortRef.current) return;
    abortRef.current();
    abortRef.current = null;
    setRefreshing(false);
    startedRef.current = 0;
    doneRef.current = 0;
    setProgress({ index: 0, total: 0 });
    onComplete();
  };

  return { refreshing, progress, handleRefresh, cancel };
};
