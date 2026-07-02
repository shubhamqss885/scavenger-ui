"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
} from "react";
import { Virtuoso, type VirtuosoHandle, type Components } from "react-virtuoso";
import { ChatMessage, ProgressStep, SqlBlock } from "../../types";
import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "../../AgenticChatContext";
import RotatingStatus from "./RotatingStatus";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";

// Stable empty reference for non-last messages so AgentMessage's React.memo
// holds during streaming (see also P3 in the optimization changelog).
const EMPTY_STEPS: ProgressStep[] = [];

// Data passed to the (module-scope, stable) Header/Footer so Virtuoso doesn't
// remount them each render.
type VirtuosoCtx = Readonly<{
  groupTypingUser: string | null;
  isStreaming: boolean;
  spacerClass: string;
}>;

// Centers the message column (was `mx-auto max-w-4xl px-3` on the old container).
const List: Components<ChatMessage, VirtuosoCtx>["List"] = forwardRef(
  ({ style, children }, ref: ForwardedRef<HTMLDivElement>) => (
    <div ref={ref} style={style} className="mx-auto max-w-4xl px-3">
      {children}
    </div>
  ),
);
List.displayName = "AgenticVirtuosoList";

// Top padding (was `pt-14 sidebar-breakpoint:pt-4` on the old container).
const Header: Components<ChatMessage, VirtuosoCtx>["Header"] = () => (
  <div className="pt-14 sidebar-breakpoint:pt-4" />
);

// Group typing indicator + bottom spacer so the last message clears the input bar.
const Footer: Components<ChatMessage, VirtuosoCtx>["Footer"] = ({
  context,
}) => {
  if (!context) return null;
  const { groupTypingUser, isStreaming, spacerClass } = context;

  return (
    <div className="pb-4">
      {groupTypingUser && !isStreaming && (
        <div className="mb-6 ml-auto flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3">
          <RotatingStatus active />
          <span className="text-sm text-muted-foreground">
            {groupTypingUser} is asking the assistant...
          </span>
        </div>
      )}
      <div className={spacerClass} />
    </div>
  );
};

const VIRTUOSO_COMPONENTS = { List, Header, Footer } as const;

export type AgenticMessageListHandle = Readonly<{
  scrollToBottom: () => void;
}>;

type AgenticMessageListProps = Readonly<{
  onSqlBlockClick: (block: SqlBlock, tab?: "table" | "sql") => void;
  onAtBottomStateChange?: (atBottom: boolean) => void;
  onScroll?: (scrollTop: number) => void;
  /** Bottom-spacer height class (varies with the clarification panel). */
  spacerClass: string;
}>;

const AgenticMessageList = forwardRef<
  AgenticMessageListHandle,
  AgenticMessageListProps
>(({ onSqlBlockClick, onAtBottomStateChange, onScroll, spacerClass }, ref) => {
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

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () =>
        virtuosoRef.current?.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior: "auto",
        }),
    }),
    [],
  );

  // Jump to the newest message when the user sends one (matches the old
  // force-scroll-on-send behaviour). Streaming growth is handled by followOutput.
  const prevLenRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      const last = messages[messages.length - 1];

      if (last?.role === "user") {
        virtuosoRef.current?.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior: "auto",
        });
      }
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  // Loading history with nothing to show yet.
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
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      style={{ height: "100%" }}
      // Stick to the bottom as the streaming message grows — but only if the
      // user is already at the bottom, so scrolling up to read isn't yanked.
      followOutput={(atBottom) => (atBottom ? "auto" : false)}
      atBottomThreshold={100}
      atBottomStateChange={onAtBottomStateChange}
      initialTopMostItemIndex={Math.max(0, messages.length - 1)}
      increaseViewportBy={{ top: 400, bottom: 800 }}
      onScroll={(e) => onScroll?.((e.currentTarget as HTMLElement).scrollTop)}
      context={{ groupTypingUser, isStreaming, spacerClass }}
      components={VIRTUOSO_COMPONENTS}
      computeItemKey={(_index, msg) =>
        msg.role === "user" ? `${msg.id}-user` : `${msg.id}-agent`
      }
      itemContent={(index, msg) => {
        const isLast = index === messages.length - 1;

        return msg.role === "user" ? (
          <UserMessage message={msg} />
        ) : (
          <AgentMessage
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
      }}
    />
  );
});

AgenticMessageList.displayName = "AgenticMessageList";

export default AgenticMessageList;
