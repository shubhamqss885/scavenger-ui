"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useFeedbackData } from "./hooks/useFeedbackData";
import { FeedbackFilters } from "./components/FeedbackFilters";
import { FeedbackTable } from "./components/FeedbackTable";
import { FeedbackEmptyState } from "./components/FeedbackEmptyState";
import { FeedbackDetailPanel } from "./components/FeedbackDetailPanel";
import { FeedbackTableSkeleton } from "./components/FeedbackTableSkeleton";
import { TablePagination } from "@/components/modules/DataSources/routes/Data/components/TablePagination";
import {
  FeedbackRecord,
  TextToSqlFeedbackRecord,
  updateFeedbackResolution,
} from "@/lib/services/orgDbFeedbackService";
import { toast } from "sonner";
import { downloadFeedbackAsCsv } from "./utils/feedbackCsvExport";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExampleFormModal } from "@/components/modules/DataSources/routes/Examples/components/ExampleFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Large, P } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export const DataSourceFeedbackModule = () => {
  const { t } = useTranslation("database");
  const { databaseId } = useDatabaseDescription();
  const [selectedRecord, setSelectedRecord] = useState<FeedbackRecord | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [exampleModalOpen, setExampleModalOpen] = useState(false);
  const [examplePrefill, setExamplePrefill] = useState<{
    title?: string;
    category?: string;
    example?: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const {
    records,
    filteredRecords,
    loading,
    filters,
    availableEmails,
    ratio,
    page,
    pageSize,
    totalCount,
    totalPages,
    setFilters,
    setPage,
    setPageSize,
    refresh,
    updateRecordResolution,
  } = useFeedbackData(databaseId);

  const handleRowClick = (record: FeedbackRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({
      feedbackType: "all",
      feedbackValue: "with_rating",
      startDate: null,
      endDate: null,
      userEmails: [],
      resolutionStatus: "open",
    });
  };

  const handleSaveAsExample = (record: FeedbackRecord) => {
    const sqlRecord = record as TextToSqlFeedbackRecord;
    setExamplePrefill({
      title: sqlRecord.sql_title ?? "",
      category: "",
      example: sqlRecord.generated_sql ?? "",
    });
    setExampleModalOpen(true);
  };

  const handleDownload = () => {
    downloadFeedbackAsCsv(
      filteredRecords,
      `feedback-${databaseId}-${new Date().toISOString().slice(0, 10)}`,
    );
  };

  const handleToggleResolved = async (record: FeedbackRecord) => {
    const next = !record.is_resolved;
    setResolvingId(record.conversation_id);
    updateRecordResolution(record.conversation_id, next);
    try {
      const res = await updateFeedbackResolution({
        conversation_id: record.conversation_id,
        is_resolved: next,
      });

      if (res.status !== "success") throw new Error(res.message ?? "Failed");
      toast.success(
        t(
          next
            ? "feedbackTab.actions.markResolvedToast"
            : "feedbackTab.actions.markUnresolvedToast",
        ),
      );
      if (selectedRecord?.conversation_id === record.conversation_id) {
        setSelectedRecord({
          ...selectedRecord,
          is_resolved: next,
        } as FeedbackRecord);
      }
    } catch {
      toast.error(t("feedbackTab.actions.markResolvedError"));
      refresh();
    } finally {
      setResolvingId(null);
    }
  };

  const hasActiveFilters =
    filters.feedbackType !== "all" ||
    filters.feedbackValue !== "with_rating" ||
    filters.startDate ||
    filters.endDate ||
    filters.userEmails.length > 0 ||
    filters.resolutionStatus !== "open";

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.feedbackType !== "all") count++;
    if (filters.feedbackValue !== "with_rating") count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.userEmails.length > 0) count++;
    if (filters.resolutionStatus !== "open") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="flex h-0 min-h-full flex-col">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 sm:px-6 sm:py-[7.5px]">
        {/* Left - Stats & Filter Toggle */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-600">
          <span>
            {t("feedbackTab.results")}:{" "}
            <strong className="text-gray-900">
              {loading ? "..." : totalCount.toLocaleString()}
            </strong>
          </span>
          {!loading && totalCount > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="ThumbsUp" size="xs" variant="success" />
                <strong className="text-foreground">{ratio.positive}</strong>
                <span className="text-xs text-gray-400">
                  ({ratio.positivePercent}%)
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="ThumbsDown" size="xs" variant="destructive" />
                <strong className="text-foreground">{ratio.negative}</strong>
                <span className="text-xs text-gray-400">
                  ({ratio.negativePercent}%)
                </span>
              </span>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("ml-2 text-slate-950", showFilters && "bg-slate-100")}
          >
            <Icon name="Search" size="sm" className="mr-2" />
            {t("details.buttons.searchAndFilter")}
            <Icon
              name="ChevronDown"
              size="sm"
              className={cn(
                "ml-1 transition-transform",
                showFilters && "rotate-180",
              )}
            />
          </Button>

          {/* Active filter badges when collapsed */}
          {!showFilters && activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="pointer-events-none ml-1 rounded-full text-xs"
            >
              {activeFilterCount}{" "}
              {activeFilterCount === 1
                ? t("feedbackTab.filters.type")
                : t("details.buttons.filters")}
            </Badge>
          )}
        </div>

        {/* Right - Download & How It Works */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
              >
                {t("feedbackTab.howItWorks.cta")}
                <Icon
                  name="HelpCircle"
                  size="xs"
                  className="ml-1.5 text-muted-foreground"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="end">
              <div className="space-y-2">
                <Large className="font-medium">
                  {t("feedbackTab.howItWorks.title")}
                </Large>
                <P className="leading-normal text-muted-foreground">
                  {t("feedbackTab.howItWorks.description")}
                </P>
                <P className="leading-normal text-muted-foreground">
                  {t("feedbackTab.howItWorks.hint")}
                </P>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading || totalCount === 0}
            className="gap-2"
          >
            <Icon name="Download" size="sm" />
            {t("feedbackTab.actions.downloadCsv")}
          </Button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="border-b px-6 py-2">
          <FeedbackFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableEmails={availableEmails}
          />
        </div>
      )}

      {/* Main Content */}
      <ScrollArea className="flex-1">
        {loading && <FeedbackTableSkeleton />}
        {!loading && records.length === 0 && (
          <FeedbackEmptyState
            variant={hasActiveFilters ? "no-results" : "no-data"}
            onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          />
        )}
        {!loading && records.length > 0 && (
          <FeedbackTable
            data={records}
            onRowClick={handleRowClick}
            onSaveAsExample={handleSaveAsExample}
            onToggleResolved={handleToggleResolved}
            resolvingId={resolvingId}
          />
        )}
      </ScrollArea>

      {/* Footer with Pagination */}
      {!loading && records.length > 0 && (
        <div className="border-t">
          <TablePagination
            pagination={{
              page,
              page_size: pageSize,
              total_pages: totalPages,
            }}
            totalRows={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Detail Panel */}
      <FeedbackDetailPanel
        record={selectedRecord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSaveAsExample={handleSaveAsExample}
        onToggleResolved={handleToggleResolved}
        isResolving={resolvingId !== null}
      />

      {/* Save as Example Modal */}
      <ExampleFormModal
        open={exampleModalOpen}
        onOpenChange={(open) => {
          setExampleModalOpen(open);
          if (!open) {
            setExamplePrefill(null);
          }
        }}
        initialValues={examplePrefill}
        headerText={t("feedbackTab.actions.saveModalTitle")}
        primaryButtonText={t("feedbackTab.actions.save")}
      />
    </div>
  );
};
