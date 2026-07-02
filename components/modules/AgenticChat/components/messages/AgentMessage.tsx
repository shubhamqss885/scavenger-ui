import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";
import RotatingStatus from "./RotatingStatus";
import { ChatMessage, ProgressStep, SqlBlock } from "../../types";
import { getToolMeta, type ToolCategory } from "../../toolMeta";
import { MessageBubble } from "./MessageBubble";
import AgenticMessageActions from "../actions/AgenticMessageActions";
import MessageStepRenderer from "./MessageStepRenderer";
import MarkdownContent from "./MarkdownContent";

const CHIP_CATEGORIES = new Set<ToolCategory>([
  "sql",
  "chart",
  "vault-read",
  "vault-write",
  "file",
  "generic",
  "web-search",
]);

const isChipStep = (step: ProgressStep): boolean =>
  CHIP_CATEGORIES.has(getToolMeta(step.tool).category);

type AgentMessageProps = Readonly<{
  message: ChatMessage;
  isStreaming: boolean;
  progressSteps: ProgressStep[];
  projectId: string;
  onSqlBlockClick: (block: SqlBlock, tab?: "table" | "sql") => void;
  onSendQuery: (query: string) => void;
  isLastAgentMessage?: boolean;
  statusMessage?: string | null;
}>;

const AgentMessage = ({
  message,
  isStreaming,
  progressSteps,
  projectId,
  onSqlBlockClick,
  onSendQuery,
  isLastAgentMessage,
  statusMessage,
}: AgentMessageProps) => {
  const { t } = useTranslation("agentic-chat");
  // Merge consecutive _text steps into a single step so they render as one
  // bubble. This guards against edge cases where separate _text steps end up
  // adjacent (e.g. text_complete creating a "done" step before new deltas).
  const steps = useMemo(() => {
    const rawSteps = isStreaming ? progressSteps : (message.steps ?? []);
    const result: ProgressStep[] = [];

    for (const step of rawSteps) {
      const last = result.at(-1);

      if (step.tool === "_text" && last?.tool === "_text") {
        result[result.length - 1] = {
          ...last,
          status: step.status,
          toolOutput: {
            raw: [last.toolOutput?.raw, step.toolOutput?.raw]
              .filter(Boolean)
              .join("\n\n"),
          },
        };
      } else {
        result.push(step);
      }
    }
    return result;
  }, [isStreaming, progressSteps, message.steps]);

  const hasTextSteps = steps.some((s) => s.tool === "_text");
  const bubbleVariant = message.isClarification ? "clarification" : "agent";
  const lastStep = steps.at(-1);
  // Precompute once per step so the merge loop below doesn't recompute
  // getToolMeta for each step's neighbours (was ~3x per step).
  const chipFlags = steps.map(isChipStep);
  // Show the status loader whenever the agent is working and not currently
  // streaming text — covers pre-first-step, mid-tool-call ("calling"), and
  // between tools ("done"). Hidden only while a _text step is streaming.
  const showSpinner =
    isStreaming && lastStep?.status !== "streaming" && !message.text;
  const summaryText =
    [...steps].reverse().find((s) => s.tool === "_text")?.toolOutput?.raw ??
    message.text;

  return (
    <div className="mb-6 mr-auto w-full">
      <MessageBubble variant={bubbleVariant}>
        {/* Steps timeline */}
        {steps.length > 0 && (
          <div
            className={cn(
              "flex flex-col",
              message.text && !hasTextSteps ? "mb-2" : "",
            )}
          >
            {steps.map((step, idx) => {
              const isChip = chipFlags[idx];
              const prevIsChip = idx > 0 && chipFlags[idx - 1];
              const nextIsChip = idx < steps.length - 1 && chipFlags[idx + 1];
              const isFirst = isChip && !prevIsChip;
              const isLast = isChip && !nextIsChip;
              const needsGap = idx > 0 && (!isChip || !prevIsChip);

              return (
                <div key={step.id} className={cn(needsGap && "mt-2")}>
                  <MessageStepRenderer
                    step={step}
                    onSqlBlockClick={onSqlBlockClick}
                    isLastAgentMessage={isLastAgentMessage}
                    onSendQuery={onSendQuery}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                </div>
              );
            })}
          </div>
        )}

        {showSpinner && <RotatingStatus active statusMessage={statusMessage} />}

        {/* Text content — only when no text steps exist */}
        {message.text && !hasTextSteps && (
          <MarkdownContent>{message.text}</MarkdownContent>
        )}

        {/* Interrupted indicator */}
        {message.interrupted && (
          <div className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <Icon
              name="Pause"
              size="xxs"
              className="fill-amber-700 text-amber-700 dark:fill-amber-400 dark:text-amber-400"
            />
            {t("chat.interrupted")}
            {isLastAgentMessage && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => onSendQuery("continue")}
                  className="underline hover:text-amber-900 dark:hover:text-amber-200"
                >
                  {t("chat.clickToResume")}
                </button>
              </>
            )}
          </div>
        )}
      </MessageBubble>

      {message.text && (
        <AgenticMessageActions
          messageText={message.text}
          summaryText={summaryText}
          projectId={projectId}
          onSendQuery={onSendQuery}
          conversationId={message.conversationId ?? message.id}
          feedbackChat={message.feedbackChat}
          feedbackComment={message.feedbackComment}
        />
      )}
    </div>
  );
};

export default React.memo(AgentMessage);
