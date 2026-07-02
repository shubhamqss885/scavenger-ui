"use client";

import { useMemo, useState, useEffect } from "react";
import { diffLines as computeDiff } from "diff";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { VaultWritePending } from "../types";

const getToolDisplayName = (toolName: string, isDelete: boolean): string => {
  if (isDelete) {
    if (toolName === "vault_delete_rule") return "Delete Rule";
    if (toolName === "vault_delete_golden_query") return "Delete Golden Query";
    if (toolName === "vault_delete_file") return "Delete File";
  }
  if (toolName === "vault_save_rule") return "Save Rule";
  if (toolName === "vault_save_golden_query") return "Save Golden Query";
  if (toolName === "vault_write") return "Write File";
  return toolName
    .replace(/_/g, " ")
    .replace(/\bvault\b/gi, "")
    .trim();
};

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  content: string;
};

const SimpleDiff = ({
  oldValue,
  newValue,
}: {
  oldValue: string;
  newValue: string;
}) => {
  const lines = useMemo(() => {
    const changes = computeDiff(oldValue, newValue);
    const result: DiffLine[] = [];

    for (const change of changes) {
      const lineContents = change.value.split("\n");

      // Remove last empty string from split if value ended with \n
      if (lineContents[lineContents.length - 1] === "") {
        lineContents.pop();
      }

      for (const line of lineContents) {
        const type = change.added
          ? "added"
          : change.removed
            ? "removed"
            : "unchanged";

        result.push({
          type,
          content: line,
        });
      }
    }
    return result;
  }, [oldValue, newValue]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm dark:border-slate-700 dark:bg-slate-900">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "flex min-h-[1.75rem] whitespace-pre-wrap break-words px-3 py-0.5",
            line.type === "added" &&
              "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
            line.type === "removed" &&
              "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
            line.type === "unchanged" && "text-slate-600 dark:text-slate-400",
          )}
        >
          <span className="mr-3 w-4 shrink-0 select-none text-slate-400 dark:text-slate-500">
            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
          </span>
          <span className="break-all">{line.content || " "}</span>
        </div>
      ))}
    </div>
  );
};

type VaultWriteApprovalModalProps = Readonly<{
  pending: VaultWritePending | null;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
  onClose: () => void;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrev?: () => void;
}>;

export const VaultWriteApprovalModal = ({
  pending,
  onApprove,
  onReject,
  onClose,
  currentIndex = 0,
  totalCount = 1,
  onNext,
  onPrev,
}: VaultWriteApprovalModalProps) => {
  const { t } = useTranslation("agentic-chat");
  const [loading, setLoading] = useState(false);

  // Get old/new content for diff
  const diffContent = useMemo(() => {
    if (!pending?.new_content) return null;
    const oldContent =
      pending.is_new_file || pending.current_content == null
        ? ""
        : pending.current_content;
    return { old: oldContent, new: pending.new_content };
  }, [pending?.new_content, pending?.current_content, pending?.is_new_file]);

  // Reset state when modal closes or changes
  useEffect(() => {
    if (!pending) {
      setLoading(false);
    }
  }, [pending]);

  if (!pending) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(pending.request_id);
      // Hook handles advancing to next item or closing if none left
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(pending.request_id);
      // Hook handles advancing to next item or closing if none left
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isProcessed = pending.status === "processed";
  const isDelete = pending.is_delete === true;
  const toolDisplayName = getToolDisplayName(pending.tool_name, isDelete);

  // Simple view for already-processed requests
  if (isProcessed) {
    return (
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("vault.modal.titleProcessed")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("vault.modal.descriptionProcessed")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCancel}>
              {t("vault.modal.ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="max-w-3xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <DialogTitle>
              {isDelete ? t("vault.modal.titleDelete") : t("vault.modal.title")}
            </DialogTitle>
            <Badge variant={isDelete ? "destructive" : "secondary"}>
              {toolDisplayName}
            </Badge>
          </div>
          <DialogDescription className="text-sm">
            {isDelete
              ? t("vault.modal.descriptionDelete")
              : t("vault.modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          {isDelete ? (
            <>
              {/* Delete reason */}
              {pending.payload?.reason && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {t("vault.modal.deleteReason")}:
                  </span>{" "}
                  {pending.payload.reason}
                </div>
              )}
              {/* Content being deleted */}
              {pending.current_content && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("vault.modal.contentToDelete")}:
                  </p>
                  <pre className="max-h-[350px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm">
                    {pending.current_content}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Diff view for writes/updates */}
              {diffContent ? (
                <div className="max-h-[400px] w-full min-w-0 overflow-y-auto">
                  <SimpleDiff
                    oldValue={diffContent.old}
                    newValue={diffContent.new}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {t("vault.modal.noContent")}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          {/* Pagination controls */}
          {totalCount > 1 && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <Icon name="ChevronLeft" size="xs" />
              </button>
              <span>
                {currentIndex + 1} / {totalCount}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex >= totalCount - 1}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <Icon name="ChevronRight" size="xs" />
              </button>
            </div>
          )}
          {totalCount <= 1 && <div />}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReject} disabled={loading}>
              {t("vault.modal.reject")}
            </Button>
            <Button
              variant={isDelete ? "destructive" : "default"}
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? (
                t("vault.modal.saving")
              ) : (
                <>
                  <Icon
                    name={isDelete ? "Trash2" : "Check"}
                    size="xxs"
                    className="mr-1"
                  />
                  {isDelete
                    ? t("vault.modal.approveDelete")
                    : t("vault.modal.approve")}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
