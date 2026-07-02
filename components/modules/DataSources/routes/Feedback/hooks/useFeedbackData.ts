"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  getOrgDbFeedback,
  FeedbackRecord,
  GetOrgDbFeedbackParams,
  FeedbackTypeFilter,
  FeedbackRating,
} from "@/lib/services/orgDbFeedbackService";

export type FeedbackFiltersState = {
  feedbackType: FeedbackTypeFilter;
  feedbackValue: FeedbackRating | "with_rating";
  startDate: string | null;
  endDate: string | null;
  userEmails: string[];
  resolutionStatus: "open" | "resolved" | "all";
};

type FeedbackRatioCounts = Readonly<{
  positive: number;
  negative: number;
  positivePercent: number;
  negativePercent: number;
}>;

type UseFeedbackDataReturn = Readonly<{
  data: { records: FeedbackRecord[] } | null;
  records: FeedbackRecord[];
  filteredRecords: FeedbackRecord[];
  loading: boolean;
  error: string | null;
  filters: FeedbackFiltersState;
  availableEmails: string[];
  ratio: FeedbackRatioCounts;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  setFilters: (filters: Partial<FeedbackFiltersState>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  updateRecordResolution: (
    conversation_id: string,
    is_resolved: boolean,
  ) => void;
}>;

const MAX_PAGE_SIZE = 1000;

export const useFeedbackData = (orgdbId: string): UseFeedbackDataReturn => {
  const [allRecords, setAllRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<FeedbackFiltersState>({
    feedbackType: "all",
    feedbackValue: "with_rating",
    startDate: null,
    endDate: null,
    userEmails: [],
    resolutionStatus: "all",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Only server-side filters trigger a refetch
  const fetchData = useCallback(async () => {
    if (!orgdbId) return;

    setLoading(true);
    setError(null);

    try {
      const params: GetOrgDbFeedbackParams = {
        orgdb_id: orgdbId,
        page: 1,
        page_size: MAX_PAGE_SIZE,
        feedback_type: filters.feedbackType,
        feedback_value: filters.feedbackValue,
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      };

      const response = await getOrgDbFeedback(params);

      if (response.status === "success") {
        setAllRecords(
          response.data.records.filter((r) => r.type !== "quick_action"),
        );
      } else {
        throw new Error(response.message || "Failed to fetch feedback");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load feedback";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
    // userEmails is client-side only — excluded from deps to avoid refetch
  }, [
    orgdbId,
    filters.feedbackType,
    filters.feedbackValue,
    filters.startDate,
    filters.endDate,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique emails from fetched records (for combobox options)
  const availableEmails = useMemo(() => {
    const emails = new Set(allRecords.map((r) => r.user_email));
    return Array.from(emails).sort();
  }, [allRecords]);

  // Client-side filtering (resolution status + email) + pagination
  const filteredRecords = useMemo(() => {
    let rows: FeedbackRecord[] = allRecords;
    if (filters.resolutionStatus === "open") {
      rows = rows.filter((r) => !r.is_resolved);
    } else if (filters.resolutionStatus === "resolved") {
      rows = rows.filter((r) => r.is_resolved);
    }
    if (filters.userEmails.length > 0) {
      rows = rows.filter((r) =>
        filters.userEmails.includes(r.user_email.toLowerCase()),
      );
    }
    return rows;
  }, [allRecords, filters.userEmails, filters.resolutionStatus]);

  const totalCount = filteredRecords.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Feedback ratio counts (based on filtered records)
  const ratio = useMemo<FeedbackRatioCounts>(() => {
    const positive = filteredRecords.filter((r) => r.feedback === "+1").length;
    const negative = filteredRecords.filter((r) => r.feedback === "-1").length;
    const total = positive + negative;
    return {
      positive,
      negative,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
    };
  }, [filteredRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const setFilters = useCallback(
    (newFilters: Partial<FeedbackFiltersState>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
    },
    [],
  );

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const updateRecordResolution = useCallback(
    (conversation_id: string, is_resolved: boolean) => {
      setAllRecords((prev) =>
        prev.map((r) =>
          r.conversation_id === conversation_id
            ? ({ ...r, is_resolved } as FeedbackRecord)
            : r,
        ),
      );
    },
    [],
  );

  return {
    data: allRecords.length > 0 ? { records: allRecords } : null,
    records: paginatedRecords,
    filteredRecords,
    loading,
    error,
    filters,
    availableEmails,
    ratio,
    page,
    pageSize,
    totalCount,
    totalPages,
    setFilters,
    setPage,
    setPageSize: handleSetPageSize,
    refresh: fetchData,
    updateRecordResolution,
  };
};
