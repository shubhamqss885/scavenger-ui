"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, IconName } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import useFeedback from "../useFeedback";
import FeedbackDialog from "./FeedbackDialog";

type FeedbackSectionProps = Readonly<{
  conversationId: string;
  feedbackChat?: string;
  feedbackComment?: string;
  positiveLabel?: string;
  negativeLabel?: string;
  hideIcons?: boolean;
}>;

// Feedback reason keys - these will be sent as comments
// Using only icons available in the iconMap (see components/ui/icon.tsx)
const FEEDBACK_REASONS: readonly { key: string; icon: IconName }[] = [
  { key: "wrong_data", icon: "XCircle" },
  { key: "missing_data", icon: "AlertCircle" },
  { key: "wrong_calculations", icon: "Hash" },
  { key: "wrong_formatting", icon: "FileText" },
  { key: "wrong_aggregation", icon: "Layers" },
  { key: "wrong_sorting", icon: "ArrowUpDown" },
  { key: "incomplete", icon: "AlertTriangle" },
  { key: "too_generic", icon: "HelpCircle" },
  { key: "different_format", icon: "Layout" },
  { key: "forgot_context", icon: "Brain" },
];

// Type for pending reason (tentative selection, not yet submitted)
interface PendingReason {
  key: string;
  label: string;
  description: string;
}

const FeedbackSection: FC<FeedbackSectionProps> = ({
  conversationId,
  feedbackChat,
  feedbackComment,
  positiveLabel,
  negativeLabel,
  hideIcons = false,
}) => {
  const { t } = useTranslation("agentic-chat");
  const { sendFeedback, sendFeedbackComment, isLoading } = useFeedback();
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [clickedButton, setClickedButton] = useState<"yes" | "no" | null>(null);

  // TENTATIVE STATE: Set when user selects from dropdown, cleared on any dialog close
  // Used for dialog display only
  const [pendingReason, setPendingReason] = useState<PendingReason | null>(
    null,
  );

  // CONFIRMED STATE: Set only after successful API submission
  // Used for button display - persists until user clears negative feedback
  const [submittedReasonLabel, setSubmittedReasonLabel] = useState<
    string | null
  >(null);

  // Extract reason label from server's feedback_comment (format: "Label: details")
  const serverReasonLabel = feedbackComment?.split(":")[0]?.trim() || null;

  // Track the current feedback (local or from server)
  const currentFeedback = localFeedback || feedbackChat;

  const isYesSelected = currentFeedback === "+1";
  const isNoSelected = currentFeedback === "-1";

  // Determine which label to show on the button (confirmed local > server > default)
  const displayReasonLabel = submittedReasonLabel || serverReasonLabel;

  const handleYes = async () => {
    setClickedButton("yes");
    try {
      if (isYesSelected) {
        // Deselect - send "0" to clear feedback
        setLocalFeedback("0");
        await sendFeedback(conversationId, "0");
      } else {
        setLocalFeedback("+1");
        // Clear both pending and submitted reason when switching to positive
        setPendingReason(null);
        setSubmittedReasonLabel(null);
        await sendFeedback(conversationId, "+1");
      }
    } catch {
      // Revert optimistic update on failure (error toast shown in useFeedback hook)
      setLocalFeedback(null);
    }
  };

  // Handle dropdown open/close and deselection
  const handleDropdownOpenChange = async (open: boolean) => {
    // Prevent race conditions from rapid clicks
    if (isLoading) return;

    if (open) {
      setClickedButton("no");
    }

    try {
      if (open && isNoSelected) {
        // User clicked selected "No" button - deselect instead of opening dropdown
        setLocalFeedback("0");
        setPendingReason(null);
        setSubmittedReasonLabel(null);
        await sendFeedback(conversationId, "0");
        return; // Don't open dropdown
      }

      if (open && currentFeedback !== "-1") {
        // First time clicking No - send feedback
        setLocalFeedback("-1");
        await sendFeedback(conversationId, "-1");
      }

      setIsDropdownOpen(open);
    } catch {
      // Revert optimistic update on failure (error toast shown in useFeedback hook)
      setLocalFeedback(null);
    }
  };

  // Open dialog with reason context
  const handleReasonSelect = (reasonKey: string) => {
    setPendingReason({
      key: reasonKey,
      label: t(`feedback.reasons.${reasonKey}`),
      description: t(`feedback.reasons.${reasonKey}_desc`),
    });
    setIsDialogOpen(true);
  };

  const handleOtherSelect = () => {
    setPendingReason({
      key: "other",
      label: t("feedback.reasons.other"),
      description: t("feedback.reasons.other_desc"),
    });
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (formattedComment: string) => {
    if (!pendingReason) return;

    try {
      if (formattedComment) {
        await sendFeedbackComment(conversationId, formattedComment);
      }
      // CRITICAL: Set confirmed label BEFORE closing dialog
      // This ensures the label persists even when handleDialogClose clears pendingReason
      setSubmittedReasonLabel(pendingReason.label);
      setIsDialogOpen(false);
    } catch {
      // Error toast shown in useFeedback hook, keep dialog open for retry
    }
  };

  // Called when dialog closes for ANY reason (cancel, X, escape, click outside, or after submit)
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // Safe to clear pendingReason - if submission succeeded, submittedReasonLabel is already set
    setPendingReason(null);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Yes Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleYes}
        disabled={isLoading}
        aria-label={positiveLabel ?? t("feedback.looksGood")}
        className={cn(
          "h-7 gap-1.5 px-2 text-xs",
          isYesSelected
            ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        )}
      >
        {isLoading && clickedButton === "yes" && (
          <Icon name="Loader2" size="xxs" className="animate-spin" />
        )}
        {!(isLoading && clickedButton === "yes") && (
          <Icon
            name="ThumbsUp"
            size="xxs"
            className={cn(
              hideIcons && "sm:hidden",
              isYesSelected ? "text-green-600" : "",
            )}
            fill={isYesSelected ? "currentColor" : "none"}
          />
        )}
        <Small as="span" className={cn(hideIcons && "hidden sm:inline")}>
          {positiveLabel ?? t("feedback.looksGood")}
        </Small>
      </Button>

      {/* No Dropdown */}
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={handleDropdownOpenChange}
      >
        <DropdownMenuTrigger asChild disabled={isLoading}>
          <Button
            variant="ghost"
            size="sm"
            aria-label={
              isNoSelected && displayReasonLabel
                ? displayReasonLabel
                : (negativeLabel ?? t("feedback.somethingWrong"))
            }
            className={cn(
              "h-7 gap-0.5 px-2 text-xs",
              isNoSelected
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            )}
          >
            {isLoading && clickedButton === "no" && (
              <Icon name="Loader2" size="xxs" className="animate-spin" />
            )}
            {!(isLoading && clickedButton === "no") && (
              <Icon
                name="ThumbsDown"
                size="xxs"
                className={cn(
                  hideIcons && "sm:hidden",
                  isNoSelected ? "text-amber-600" : "",
                )}
                fill={isNoSelected ? "currentColor" : "none"}
              />
            )}
            <Small as="span" className={cn(hideIcons && "hidden sm:inline")}>
              {isNoSelected && displayReasonLabel
                ? displayReasonLabel
                : (negativeLabel ?? t("feedback.somethingWrong"))}
            </Small>
            <Icon
              name="ChevronDown"
              size="xs"
              className={cn(hideIcons && "hidden sm:inline-block")}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {FEEDBACK_REASONS.map(({ key, icon }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleReasonSelect(key)}
              className={`cursor-pointer ${
                pendingReason?.key === key ? "bg-slate-100" : ""
              }`}
            >
              <Icon name={icon} size="xs" className="mr-2" />
              {t(`feedback.reasons.${key}`)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleOtherSelect}
            className={`cursor-pointer ${
              pendingReason?.key === "other" ? "bg-slate-100" : ""
            }`}
          >
            <Icon name="MessageSquare" size="xs" className="mr-2" />
            {t("feedback.reasons.other")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feedback Dialog for reason elaboration */}
      <FeedbackDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        reasonLabel={pendingReason?.label}
        reasonDescription={pendingReason?.description}
      />
    </div>
  );
};

export default FeedbackSection;
