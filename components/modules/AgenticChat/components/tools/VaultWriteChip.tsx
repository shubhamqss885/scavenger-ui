"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VaultWritePayload, VaultWriteStatusInfo } from "../../types";
import { parseVaultWriteRequestId, parseVaultWritePath } from "../../types";

type VaultWriteChipProps = Readonly<{
  toolName: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  isLoading?: boolean;
  vaultWriteStatus?: VaultWriteStatusInfo;
  onCheckAndOpenModal?: (
    requestId: string,
    toolName: string,
    vaultPath: string,
    payload: VaultWritePayload,
  ) => void;
}>;

export const VaultWriteChip = ({
  toolName,
  toolInput,
  toolResult,
  isLoading,
  vaultWriteStatus,
  onCheckAndOpenModal,
}: VaultWriteChipProps) => {
  const { t } = useTranslation("agentic-chat");
  const [checking, setChecking] = useState(false);

  const requestId = toolResult ? parseVaultWriteRequestId(toolResult) : null;
  const vaultPath = toolResult ? parseVaultWritePath(toolResult) : null;

  const status = vaultWriteStatus?.status ?? "pending";

  // Chip is only clickable for pending status
  const isClickable =
    !!requestId && !!onCheckAndOpenModal && !isLoading && status === "pending";

  const handleChipClick = () => {
    if (!requestId || !onCheckAndOpenModal || checking || isLoading) return;
    if (status !== "pending") return;

    setChecking(true);
    onCheckAndOpenModal(
      requestId,
      toolName,
      vaultPath || "",
      (toolInput as VaultWritePayload) || {},
    );
    setTimeout(() => setChecking(false), 500);
  };

  // Status-based styling
  const statusConfig = {
    pending: {
      borderColor: "border-amber-300 dark:border-amber-700",
      bgColor: "bg-amber-50/50 dark:bg-amber-950/30",
      hoverBg: "hover:bg-amber-100/50 dark:hover:bg-amber-900/40",
      dotColor: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      label: t("vault.chip.pendingApproval"),
    },
    approved: {
      borderColor: "border-green-200 dark:border-green-800",
      bgColor: "bg-green-50/30 dark:bg-green-950/20",
      hoverBg: "",
      dotColor: "bg-green-500",
      textColor: "text-green-700 dark:text-green-300",
      label: t("vault.chip.approved"),
    },
    rejected: {
      borderColor: "border-red-200 dark:border-red-800",
      bgColor: "bg-red-50/30 dark:bg-red-950/20",
      hoverBg: "",
      dotColor: "bg-red-500",
      textColor: "text-red-700 dark:text-red-300",
      label: t("vault.chip.rejected"),
    },
  };

  const config = statusConfig[status];

  const chipContent = (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        "my-2 w-full rounded-lg border px-3 py-1.5 text-left transition-all",
        config.borderColor,
        config.bgColor,
        isClickable && [
          "cursor-pointer",
          config.hoverBg,
          "hover:border-amber-400 dark:hover:border-amber-500",
          "hover:shadow-sm",
        ],
      )}
      onClick={handleChipClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleChipClick();
        }
      }}
    >
      <div className="flex items-center justify-between gap-1.5 text-xs font-medium">
        <div className="flex items-center gap-1.5 min-w-0">
          {(isLoading || checking) && status === "pending" ? (
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
              className={cn("h-2 w-2 shrink-0 rounded-full", config.dotColor)}
            />
          )}
          <span className={cn("shrink-0", config.textColor)}>
            {config.label}
          </span>
          {vaultPath && (
            <>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="truncate font-mono text-slate-500 dark:text-slate-400">
                {vaultPath}
              </span>
            </>
          )}
        </div>
        {isClickable && (
          <span className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400 opacity-70">
            {t("vault.chip.clickToReview")}
          </span>
        )}
      </div>
    </div>
  );

  // Show tooltip for rejected (with reason)
  if (status === "rejected" && vaultWriteStatus?.rejectionReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{chipContent}</TooltipTrigger>
          <TooltipContent side="top">
            {t("vault.chip.rejectedReason", {
              reason: vaultWriteStatus.rejectionReason,
            })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return chipContent;
};
