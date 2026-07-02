"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useContextSelector } from "use-context-selector";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import type { SqlBlock } from "../../types";
import {
  extractSqlTitle,
  copyToClipboard,
  copyTableToClipboard,
} from "../../utils";
import { AgenticChatContext } from "../../AgenticChatContext";
import { downloadSqlBlockCsv } from "./SqlDetailSheet/downloadSqlCsv";
import WidgetResultActions from "@/components/blocks/WidgetResultActions";

export const SqlCodeBlock = ({
  block,
  onOpenSheet,
  disabled,
  isFirst,
  isLast,
}: Readonly<{
  block: SqlBlock;
  onOpenSheet: (tab: "table" | "sql") => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const orgdbId = useContextSelector(AgenticChatContext, (ctx) => ctx?.orgdbId);
  const groupId = useContextSelector(AgenticChatContext, (ctx) => ctx?.groupId);
  const isGroupChat = Boolean(groupId);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clean up copy-feedback timer on unmount
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const hasData = (block.table_data ?? []).length > 0;
  const isFinished = block.durationMs != null;
  const isCancelled = block.is_cancelled === true;
  const isEmpty = isFinished && !hasData;
  const isLoading = !isCancelled && !isFinished && !hasData;
  const rawTitle = extractSqlTitle(block.sql);
  const title = rawTitle
    ? /^\w+$/.test(rawTitle)
      ? t("sql.queryOnTable", { table: rawTitle })
      : rawTitle
    : t("sql.title");

  const handleCopyTable = useCallback(async () => {
    if (!hasData) return;
    try {
      await copyTableToClipboard(block.table_data);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("sql.copyError"));
    }
  }, [block.table_data, hasData, t]);

  const handleDownloadCsv = useCallback(async () => {
    if (!block || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadSqlBlockCsv(block);
    } catch {
      toast.error(t("sql.downloadError"));
    } finally {
      setIsDownloading(false);
    }
  }, [block, isDownloading, t]);

  const handleCopySqlAndOpen = useCallback(() => {
    copyToClipboard(block.sql);
    onOpenSheet("sql");
  }, [block.sql, onOpenSheet]);

  const iconBtnClass =
    "shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300";

  return (
    <div
      className={cn(
        "w-full border border-slate-200 bg-white text-left transition-colors dark:border-slate-700 dark:bg-slate-900",
        isFirst !== false && "rounded-t-lg",
        isLast !== false && "rounded-b-lg",
        !isFirst && "border-t-0",
      )}
    >
      <div className="flex items-center justify-between px-3 py-1.5">
        {/* Left side */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <Icon
            name="ChevronRight"
            size="xxs"
            className={cn(
              "shrink-0 text-slate-400 transition-transform dark:text-slate-500",
              expanded && "rotate-90",
            )}
          />
          {isLoading ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <span
                className="h-2 w-2 rounded-full bg-amber-400"
                style={{ animation: "sqlPulse 1.4s step-end infinite" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-amber-400"
                style={{
                  opacity: 0.15,
                  animation: "sqlPulse 1.4s step-end infinite 0.7s",
                }}
              />
            </span>
          ) : (
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                isCancelled && "bg-slate-300 dark:bg-slate-600",
                !isCancelled && hasData && "bg-green-500",
                !isCancelled && isEmpty && "bg-red-400",
              )}
            />
          )}
          <Icon
            name="Database"
            size="xxs"
            className="shrink-0 text-slate-500 dark:text-slate-400"
          />
          <span className="truncate">{title}</span>
          {hasData && (
            <span className="ml-1 shrink-0 whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
              {block.table_data.length} {t("sql.rows")}
            </span>
          )}
          {!isCancelled && isEmpty && (
            <span className="ml-1 shrink-0 whitespace-nowrap text-red-400">
              {t("sql.noDataFound")}
            </span>
          )}
          {block.durationMs != null && (
            <span className="ml-1 shrink-0 whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
              {block.durationMs >= 1000
                ? `${(block.durationMs / 1000).toFixed(1)} s`
                : `${block.durationMs} ms`}
            </span>
          )}
        </button>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            onClick={handleCopySqlAndOpen}
            className="shrink-0 text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            disabled={disabled}
          >
            SQL
          </button>
          {hasData && (
            <button
              onClick={handleDownloadCsv}
              className={iconBtnClass}
              disabled={disabled || isDownloading}
            >
              <Icon
                name={isDownloading ? "Loader2" : "Download"}
                size="xxs"
                className={
                  isDownloading ? "animate-spin text-inherit" : "text-inherit"
                }
              />
            </button>
          )}
          {hasData && (
            <button
              onClick={handleCopyTable}
              className={iconBtnClass}
              disabled={disabled}
            >
              <Icon
                name={copied ? "Check" : "Copy"}
                size="xxs"
                className="text-inherit"
              />
            </button>
          )}
          {hasData && orgdbId && !isGroupChat && (
            <WidgetResultActions
              widgetType="table"
              title={title}
              sqlQuery={block.sql}
              cachedResult={{
                columns: Object.keys(block.table_data[0] ?? {}),
                data: block.table_data,
                row_count: block.table_data.length,
              }}
              orgdbId={orgdbId}
            />
          )}
        </div>
      </div>
      {expanded && hasData && (
        <div className="max-h-[200px] overflow-auto border-t border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                {Object.keys(block.table_data[0]).map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-2 py-1 text-left font-medium text-slate-600 dark:text-slate-300"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table_data.map((row, rowIdx) => (
                <tr
                  key={`row-${rowIdx}-${Object.values(row).join("-")}`}
                  className="border-t border-slate-100 dark:border-slate-700/50"
                >
                  {Object.entries(row).map(([col, val]) => (
                    <td
                      key={col}
                      className="whitespace-nowrap px-2 py-1 text-slate-500 dark:text-slate-400"
                    >
                      {val ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
