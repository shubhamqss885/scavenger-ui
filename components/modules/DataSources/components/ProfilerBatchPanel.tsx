"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";
import { Small, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BatchTableStatus } from "@/components/modules/DataSources/types";
import type { DatabaseTable } from "@/lib/services/organizationDbService";

type ProfilerBatchPanelProps = Readonly<{
  tables: readonly DatabaseTable[];
  batchStatus: Record<string, BatchTableStatus>;
  isBatchProfiling: boolean;
  onGenerateAll: (forceAll?: boolean) => void;
  onRetrigger: (tableName: string) => void;
  onSelectTable: (tableName: string) => void;
  selectedTable?: string;
}>;

const TableStatusBadge = ({ status, errorMessage }: BatchTableStatus) => {
  const { t } = useTranslation("database");

  if (status === "running") {
    return (
      <div className="flex items-center gap-1 text-primary">
        <Icon name="Loader2" size="xs" className="animate-spin" />
        <Muted className="text-xs text-primary">
          {t("profiler.batch.status.running")}
        </Muted>
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <Icon name="CheckCircle" size="xs" className="text-green-600" />
        <Muted className="text-xs text-green-600">
          {t("profiler.batch.status.done")}
        </Muted>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1 text-destructive">
        <Icon name="XCircle" size="xs" className="text-destructive" />
        <Muted className="text-xs text-destructive">
          {errorMessage || t("profiler.batch.status.error")}
        </Muted>
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <Icon name="AlertTriangle" size="xs" className="text-yellow-600" />
        <Muted className="text-xs text-yellow-600">
          {errorMessage || t("profiler.batch.status.skipped")}
        </Muted>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-400">
      <Icon name="Clock" size="xs" className="text-slate-400" />
      <Muted className="text-xs text-slate-400">
        {t("profiler.batch.status.pending")}
      </Muted>
    </div>
  );
};

export const ProfilerBatchPanel = ({
  tables,
  batchStatus,
  isBatchProfiling,
  onGenerateAll,
  onRetrigger,
  onSelectTable,
  selectedTable,
}: ProfilerBatchPanelProps) => {
  const { t } = useTranslation("database");

  const { done, errors, skipped, running } = useMemo(
    () => ({
      done: Object.values(batchStatus).filter((s) => s.status === "done")
        .length,
      errors: Object.values(batchStatus).filter((s) => s.status === "error")
        .length,
      skipped: Object.values(batchStatus).filter((s) => s.status === "skipped")
        .length,
      running: Object.values(batchStatus).filter((s) => s.status === "running")
        .length,
    }),
    [batchStatus],
  );

  const hasAnyStatus = Object.keys(batchStatus).length > 0;
  const total = tables.length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Small className="font-semibold text-sm">
              {t("profiler.batch.title")}
            </Small>
            <Muted className="text-xs">
              {isBatchProfiling
                ? t("profiler.batch.progressLabel", {
                    done,
                    total,
                    running,
                  })
                : hasAnyStatus
                  ? t(
                      errors > 0 && skipped > 0
                        ? "profiler.batch.doneLabelBoth"
                        : errors > 0
                          ? "profiler.batch.doneLabelErrors"
                          : skipped > 0
                            ? "profiler.batch.doneLabelSkipped"
                            : "profiler.batch.doneLabel",
                      { done, total, errors, skipped },
                    )
                  : t("profiler.batch.description", { count: total })}
            </Muted>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {errors > 0 && !isBatchProfiling && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateAll(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Icon name="RefreshCw" size="xs" />
                {t("profiler.batch.retryFailed", { count: errors })}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onGenerateAll()}
              disabled={isBatchProfiling}
              className="h-8 text-xs gap-1.5"
            >
              {isBatchProfiling ? (
                <>
                  <Icon name="Loader2" size="xs" className="animate-spin" />
                  {t("profiler.batch.generating")}
                </>
              ) : (
                <>
                  <Icon name="Zap" size="xs" />
                  {hasAnyStatus
                    ? t("profiler.batch.regenerateAll")
                    : t("profiler.batch.generateAll")}
                </>
              )}
            </Button>
          </div>
        </div>

        {isBatchProfiling && (
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </div>
        )}
      </CardHeader>

      {hasAnyStatus && (
        <CardContent>
          <ScrollArea className="max-h-[260px]">
            <div className="space-y-1 pr-2">
              {tables.map((table) => {
                const status = batchStatus[table.table_name];
                const isSelected = selectedTable === table.table_name;
                const isDone = status?.status === "done";
                const canRetrigger =
                  !isBatchProfiling &&
                  (status?.status === "done" || status?.status === "error");
                // skipped = row limit exceeded; retrying will always be rejected

                return (
                  <div
                    key={table.table_name}
                    onClick={() => isDone && onSelectTable(table.table_name)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 gap-2 transition-colors",
                      isDone && "cursor-pointer hover:bg-muted/60",
                      isSelected && "bg-muted",
                      !isDone && "opacity-70",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        name={table.object_type === "view" ? "Eye" : "Table"}
                        size="xs"
                        className="shrink-0 text-muted-foreground"
                      />
                      <Small className="truncate text-xs">
                        {table.table_name}
                      </Small>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status ? (
                        <TableStatusBadge {...status} />
                      ) : (
                        <Muted className="text-xs">
                          {t("profiler.batch.status.notStarted")}
                        </Muted>
                      )}
                      {canRetrigger && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title={t("profiler.batch.retrigger")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetrigger(table.table_name);
                          }}
                        >
                          <Icon name="RefreshCw" size="xs" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {errors > 0 && !isBatchProfiling && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 mt-3">
              <Icon
                name="AlertCircle"
                size="xs"
                className="text-destructive mt-0.5 shrink-0"
              />
              <Muted className="text-xs text-destructive">
                {t("profiler.batch.failedBanner", {
                  tables: tables
                    .filter(
                      (tbl) => batchStatus[tbl.table_name]?.status === "error",
                    )
                    .map((tbl) => tbl.table_name)
                    .join(", "),
                })}
              </Muted>
            </div>
          )}
          {skipped > 0 && !isBatchProfiling && (
            <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 mt-2">
              <Icon
                name="AlertTriangle"
                size="xs"
                className="text-yellow-600 mt-0.5 shrink-0"
              />
              <Muted className="text-xs text-yellow-700">
                {t("profiler.batch.skippedBanner", {
                  tables: tables
                    .filter(
                      (tbl) =>
                        batchStatus[tbl.table_name]?.status === "skipped",
                    )
                    .map((tbl) => tbl.table_name)
                    .join(", "),
                })}
              </Muted>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
