"use client";

import { Icon } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import FeedbackSection from "@/components/blocks/MessageActions/components/FeedbackSection";
import { copyToClipboard } from "../../utils";

import { SharePopover } from "./SharePopover";
import { useTranslation } from "@/lib/i18n/client";

type AgenticMessageActionsProps = Readonly<{
  messageText: string;
  summaryText: string;
  projectId: string;
  onSendQuery: (query: string) => void;
  conversationId: string;
  feedbackChat?: string;
  feedbackComment?: string;
}>;

const AgenticMessageActions = ({
  messageText,
  summaryText,
  projectId,
  onSendQuery,
  conversationId,
  feedbackChat,
  feedbackComment,
}: AgenticMessageActionsProps) => {
  const { t } = useTranslation("agentic-chat");

  return (
    <div className="mt-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => copyToClipboard(messageText)}
          aria-label={t("chat.copy")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Icon name="Copy" size="xs" className="text-inherit" />
          <Small as="span" className="hidden sm:inline">
            {t("chat.copy")}
          </Small>
        </button>
        <SharePopover
          projectId={projectId}
          messageText={summaryText}
          onSlackShare={onSendQuery}
        />
      </div>

      <FeedbackSection
        conversationId={conversationId}
        feedbackChat={feedbackChat}
        feedbackComment={feedbackComment}
        positiveLabel={t("feedback.looksGood")}
        negativeLabel={t("feedback.somethingWrong")}
        hideIcons
      />
    </div>
  );
};

export default AgenticMessageActions;
