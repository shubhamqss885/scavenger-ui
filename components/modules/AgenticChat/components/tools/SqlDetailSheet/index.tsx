"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { SqlBlock } from "../../../types";
import { MAX_SHEET_ROWS } from "../../../types";
import { copyTableToClipboard, extractSqlTitle } from "../../../utils";
import { CorrectionInput } from "./CorrectionInput";
import { SqlTabContent } from "./SqlTabContent";
import { TableTabContent } from "./TableTabContent";
import { downloadSqlBlockCsv } from "./downloadSqlCsv";

export const SqlDetailSheet = ({
  block,
  open,
  onClose,
  onSendCorrection,
  hideCorrectionInput = false,
  initialTab = "table",
}: Readonly<{
  block: SqlBlock | null;
  open: boolean;
  onClose: () => void;
  onSendCorrection: (msg: string) => void;
  hideCorrectionInput?: boolean;
  initialTab?: "table" | "sql";
}>) => {
  const { t } = useTranslation("agentic-chat");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopyCsv = useCallback(async () => {
    const tableData = block?.table_data ?? [];

    if (tableData.length === 0) return;
    try {
      await copyTableToClipboard(tableData);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("sql.copyError"));
    }
  }, [block?.table_data, t]);

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

  // Reset state when a different block is opened
  useEffect(() => {
    if (!open || !block) return;
    setCorrectionText("");
    setActiveTab(initialTab);
  }, [open, block, initialTab]);

  // Clean up copy timer on unmount
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCorrection = () => {
    if (!correctionText.trim() || !block) return;
    const correction = `${t("sql.correction.previousQuery")}\n\`\`\`sql\n${block.sql}\n\`\`\`\n\n${t("sql.correction.userFeedback", { feedback: correctionText.trim() })}\n\n${t("sql.correction.generateCorrectedQuery")}`;
    onSendCorrection(correction);
    onClose();
  };

  if (!block) return null;

  const data = block.table_data ?? [];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayRows = data.slice(0, MAX_SHEET_ROWS);
  const truncated = data.length > MAX_SHEET_ROWS;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-[900px]"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>{t("sql.queryDetails")}</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "table" | "sql")}
          className="mt-4 flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="h-auto w-full shrink-0 justify-start gap-4 rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="table"
              className="rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("sql.table")}
            </TabsTrigger>
            <TabsTrigger
              value="sql"
              className="rounded-none border-b-2 border-transparent px-1 pb-2 pt-1 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t("sql.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="table"
            className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            {/* SQL title + copy */}
            <div className="flex shrink-0 items-center gap-2 py-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {extractSqlTitle(block.sql) ?? t("sql.title")}
              </span>
              {truncated && (
                <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {t("sql.showingRows", {
                    max: MAX_SHEET_ROWS,
                    total: data.length,
                  })}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0",
                  copied
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                )}
                onClick={handleCopyCsv}
                title={t("sql.copyCsv")}
              >
                <Icon name={copied ? "Check" : "Copy"} size="sm" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                onClick={handleDownloadCsv}
                disabled={isDownloading || data.length === 0}
                title={
                  isDownloading ? t("sql.downloadingCsv") : t("sql.downloadCsv")
                }
              >
                <Icon
                  name={isDownloading ? "Loader2" : "Download"}
                  size="sm"
                  className={isDownloading ? "animate-spin" : undefined}
                />
              </Button>
            </div>

            {/* Table fills remaining space */}
            <div className="min-h-0 flex-1 overflow-auto">
              <TableTabContent
                columns={columns}
                displayRows={displayRows}
                data={data}
              />
            </div>
          </TabsContent>

          {/* -- SQL Tab -- */}
          <TabsContent
            value="sql"
            className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-auto">
              <SqlTabContent sql={block.sql} />
            </div>

            {/* Correction bar */}
            {!hideCorrectionInput && (
              <div className="shrink-0 border-t pt-3">
                <CorrectionInput
                  value={correctionText}
                  placeholder={t("sql.suggestCorrection")}
                  disabled={!correctionText.trim()}
                  onChange={setCorrectionText}
                  onSubmit={handleCorrection}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
