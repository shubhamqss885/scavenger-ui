"use client";

import { ProgressStep, SqlBlock } from "../../types";
import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "../../AgenticChatContext";
import RotatingStatus from "./RotatingStatus";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";

// Stable empty reference for non-last messages. `progressSteps` and
// `statusMessage` only matter for the message currently streaming; passing the
// live (per-token changing) values to every message would break AgentMessage's
// React.memo and re-render the whole history on each token. Non-last messages
// get these stable values instead so their memo holds.
const EMPTY_STEPS: ProgressStep[] = [];

type AgenticMessageListProps = Readonly<{
  onSqlBlockClick: (block: SqlBlock, tab?: "table" | "sql") => void;
}>;

const AgenticMessageList = ({ onSqlBlockClick }: AgenticMessageListProps) => {
  const messages = useContextSelector(AgenticChatContext, (c) => c!.messages);
  const isStreaming = useContextSelector(
    AgenticChatContext,
    (c) => c!.isStreaming,
  );
  const progressSteps = useContextSelector(
    AgenticChatContext,
    (c) => c!.progressSteps,
  );
  const isLoadingHistory = useContextSelector(
    AgenticChatContext,
    (c) => c!.isLoadingHistory,
  );
  const projectId = useContextSelector(AgenticChatContext, (c) => c!.projectId);
  const sendQuery = useContextSelector(AgenticChatContext, (c) => c!.sendQuery);
  const statusMessage = useContextSelector(
    AgenticChatContext,
    (c) => c!.statusMessage,
  );
  const groupTypingUser = useContextSelector(
    AgenticChatContext,
    (c) => c!.groupTypingUser,
  );

  // Show loading state only if we're still loading AND have no messages yet
  // Once user sends a message, we should show it immediately
  if (isLoadingHistory && messages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <RotatingStatus active statusMessage="loading" />
      </div>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      {messages.map((msg, index) => {
        const isLast = index === messages.length - 1;

        return msg.role === "user" ? (
          <UserMessage key={`${msg.id}-user`} message={msg} />
        ) : (
          <AgentMessage
            key={`${msg.id}-agent`}
            message={msg}
            isStreaming={isStreaming && isLast}
            // Live streaming props only for the last message; stable values for
            // the rest so their React.memo holds during streaming.
            progressSteps={isLast ? progressSteps : EMPTY_STEPS}
            projectId={projectId}
            onSqlBlockClick={onSqlBlockClick}
            onSendQuery={sendQuery}
            isLastAgentMessage={!isStreaming && isLast}
            statusMessage={isLast ? statusMessage : null}
          />
        );
      })}
      {/* Show typing indicator when another group member is querying */}
      {groupTypingUser && !isStreaming && (
        <div className="mb-6 ml-auto flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3">
          <RotatingStatus active />
          <span className="text-sm text-muted-foreground">
            {groupTypingUser} is asking the assistant...
          </span>
        </div>
      )}
    </>
  );
};

export default AgenticMessageList;
