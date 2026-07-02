"use client";

// @deprecated Feedback conversation-history UI — flag-hidden, retained for reference pending cleanup review.

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import { Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeedbackRecord } from "@/lib/services/orgDbFeedbackService";
import { formatFeedbackForClipboard } from "../utils/formatFeedbackForClipboard";
import { canSaveAsExample as checkCanSaveAsExample } from "../utils/canSaveAsExample";

const typeLabels: Record<string, string> = {
  chat: "CHAT",
  text_to_sql: "SQL",
  text_to_nosql: "NOSQL",
};

type FeedbackDetailPanelHeaderProps = Readonly<{
  record: FeedbackRecord;
  onSaveAsExample?: () => void;
  onToggleResolved?: () => void;
  isResolving?: boolean;
}>;

export function FeedbackDetailPanelHeader({
  record,
  onSaveAsExample,
  onToggleResolved,
  isResolving,
}: FeedbackDetailPanelHeaderProps) {
  const { t } = useTranslation("database");
  const [copied, setCopied] = useState(false);

  const isPositive = record.feedback === "+1";
  const showSaveAsExample = checkCanSaveAsExample(record);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatFeedbackForClipboard(record));
      setCopied(true);
      toast.success(t("feedbackTab.detail.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <SheetHeader
      className={cn(
        "shrink-0 border-b px-6 pb-4 pt-6",
        isPositive ? "bg-emerald-50/50" : "bg-rose-50/50",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Feedback icon */}
        <div
          className={cn(
            "shrink-0 rounded-full p-3",
            isPositive ? "bg-emerald-100" : "bg-rose-100",
          )}
        >
          <Icon
            name={isPositive ? "ThumbsUp" : "ThumbsDown"}
            size="md"
            className={isPositive ? "text-emerald-600" : "text-rose-600"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <SheetTitle className="text-left">
            {t("feedbackTab.detail.title")}
          </SheetTitle>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase text-gray-600">
              {typeLabels[record.type] ?? record.type}
            </span>
            <span className="text-gray-300">•</span>
            <Muted className="text-xs">
              UTC{" "}
              {record.created_at.includes("T")
                ? record.created_at.slice(0, 16).replace("T", " ")
                : record.created_at}
            </Muted>
          </div>
          {/* Actions */}
          <div className="mt-2 flex w-full items-center justify-between gap-2">
            <div className="flex gap-2">
              {onToggleResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleResolved}
                  disabled={isResolving}
                  className="h-8 gap-1 bg-white/60 text-xs"
                >
                  <Icon
                    name={record.is_resolved ? "CheckCircle2" : "Circle"}
                    size="xs"
                    className={
                      record.is_resolved ? "text-emerald-600" : undefined
                    }
                  />
                  {t(
                    record.is_resolved
                      ? "feedbackTab.actions.markUnresolved"
                      : "feedbackTab.actions.markResolved",
                  )}
                </Button>
              )}
              {showSaveAsExample && onSaveAsExample && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSaveAsExample}
                  className="h-8 gap-1 text-xs"
                >
                  <Icon name="Bookmark" size="xs" className="text-white" />
                  {t("feedbackTab.actions.saveAsExample")}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8"
            >
              <Icon
                name={copied ? "Check" : "Copy"}
                size="xs"
                className={copied ? "text-emerald-500" : undefined}
              />
            </Button>
          </div>
        </div>
      </div>
    </SheetHeader>
  );
}
