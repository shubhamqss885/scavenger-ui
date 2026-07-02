"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SqlBlock } from "../../types";
import { SqlDetailSheet } from "../tools/SqlDetailSheet";
import AgenticInputBar from "./AgenticInputBar";
import NotifyMeBanner from "./NotifyMeBanner";
import ToggleSidebar from "@/components/blocks/ToggleSidebar";
import ConvertToGroupButton from "./ConvertToGroupButton";
import AgenticMessageList from "../messages/AgenticMessageList";
import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "../../AgenticChatContext";
import { useScrollToBottom } from "../../hooks/useScrollToBottom";
import { useTranslation } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";
import { AnimatedBorderButton } from "@/components/ui/animated-border-button";
import { Small } from "@/components/ui/typography";

type AgenticChatLayoutProps = Readonly<{
  // Embedded in a Sheet (edit-widget flow): drop full-page chrome — the global
  // type-anywhere focus handler and the mobile sidebar toggle.
  embedded?: boolean;
  // Guidance shown when the conversation is empty (edit chats open empty).
  emptyHint?: string;
}>;

const AgenticChatLayout = ({
  embedded = false,
  emptyHint,
}: AgenticChatLayoutProps = {}) => {
  const pendingClarification = useContextSelector(
    AgenticChatContext,
    (c) => c!.pendingClarification,
  );
  const clarificationCollapsed = useContextSelector(
    AgenticChatContext,
    (c) => c!.clarificationCollapsed,
  );
  const isLoadingHistory = useContextSelector(
    AgenticChatContext,
    (c) => c!.isLoadingHistory,
  );
  const hasMessages = useContextSelector(
    AgenticChatContext,
    (c) => c!.messages.length > 0,
  );
  const isStreaming = useContextSelector(
    AgenticChatContext,
    (c) => c!.isStreaming,
  );
  const isProjectTokenLimitReached = useContextSelector(
    AgenticChatContext,
    (c) => c!.isProjectTokenLimitReached,
  );

  const sendQuery = useContextSelector(AgenticChatContext, (c) => c!.sendQuery);
  const groupId = useContextSelector(AgenticChatContext, (c) => c!.groupId);
  const isGroupChat = Boolean(groupId);
  const { t } = useTranslation("agentic-chat");

  // Local UI state — only used by this component + SqlDetailSheet
  const [selectedBlock, setSelectedBlock] = useState<SqlBlock | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"table" | "sql">("table");
  const lastScrollTop = useRef(0);
  const [barCollapsed, setBarCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { containerRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom({
      enabled: !isLoadingHistory,
      active: isStreaming,
    });

  // Stable handler so AgentMessage's React.memo isn't broken by a fresh inline
  // function on every layout re-render (setters are stable, so deps are empty).
  const handleSqlBlockClick = useCallback(
    (block: SqlBlock, tab?: "table" | "sql") => {
      setSelectedBlock(block);
      setSheetTab(tab ?? "table");
      setSheetOpen(true);
    },
    [],
  );

  // Preload the recharts chart chunk on mount so charts already present in the
  // conversation history render with no wait. recharts is code-split out of the
  // route's First Load JS (see ChartChip's dynamic AgenticChart import); this
  // downloads it in parallel with the history fetch instead of on first render.
  useEffect(() => {
    void import(
      "@/components/modules/AgenticChat/components/tools/AgenticChart"
    );
  }, []);

  // Capture typing anywhere — focus textarea and expand bar.
  // Skipped when embedded so it can't steal keystrokes from the host page.
  useEffect(() => {
    if (embedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if already focused on an input/textarea, or modifier keys
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.key.length !== 1 // skip non-printable keys (arrows, Escape, etc.)
      )
        return;

      setBarCollapsed(false);
      textareaRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [embedded]);

  // Auto-expand when a clarification arrives
  useEffect(() => {
    if (pendingClarification) setBarCollapsed(false);
  }, [pendingClarification]);

  // Collapse on scroll — but not while a clarification is active
  const handleScroll = useCallback(() => {
    const el = containerRef.current;

    if (!el) return;
    const scrollTop = el.scrollTop;
    const delta = scrollTop - lastScrollTop.current;

    if (Math.abs(delta) > 5 && !pendingClarification) setBarCollapsed(true);
    lastScrollTop.current = scrollTop;
  }, [pendingClarification, containerRef]);

  const spacerHeight = !pendingClarification
    ? "h-24"
    : clarificationCollapsed
      ? "h-32"
      : "h-80";

  return (
    <div className="relative flex h-full flex-col bg-white font-sans dark:bg-slate-950">
      {/* Mobile-only floating sidebar toggle (sits over the scroll area, never scrolls away) */}
      {!embedded && (
        <div className="absolute left-2 top-2 z-30 rounded-md bg-white/80 shadow-sm backdrop-blur-sm dark:bg-slate-950/80 sidebar-breakpoint:hidden">
          <ToggleSidebar />
        </div>
      )}

      {/* Floating collaborate button — top-right */}
      {!embedded && <ConvertToGroupButton />}

      {/* "Notify me when done" — floats over the messages on slow runs. */}
      <NotifyMeBanner />

      {/* Messages — full height, scrolls beneath input bar */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-4xl px-3 pb-4 pt-14 sidebar-breakpoint:pt-4">
          {emptyHint && !hasMessages && !isLoadingHistory && (
            <div className="flex min-h-[40vh] items-center justify-center px-4">
              <p className="max-w-md text-center text-sm text-muted-foreground">
                {emptyHint}
              </p>
            </div>
          )}
          <AgenticMessageList onSqlBlockClick={handleSqlBlockClick} />
          <div ref={endRef} className={spacerHeight} />
        </div>
      </div>

      {/* Input bar — pinned to bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        {/* Scroll-to-bottom button — sits above input bar, hidden during clarification */}
        {!isAtBottom && !(pendingClarification && !clarificationCollapsed) && (
          <div className="pointer-events-auto flex justify-center pb-2">
            <AnimatedBorderButton
              variant="outline"
              size="icon"
              animated={isStreaming}
              onClick={scrollToBottom}
              className="h-8 w-8 rounded-full shadow-md"
              aria-label={t("scrollToBottom")}
            >
              <Icon name="ArrowDown" size="xs" />
            </AnimatedBorderButton>
          </div>
        )}
        {isProjectTokenLimitReached && (
          <div className="pointer-events-auto mx-auto flex max-w-3xl justify-center px-3">
            <div className="flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
              <Icon
                name="AlertTriangle"
                size="xs"
                variant="warning"
                strokeWidth={2.25}
              />
              <Small className="text-amber-900 dark:text-amber-200">
                {t("chat.projectTokenLimitMessage")}
              </Small>
            </div>
          </div>
        )}
        <div className="pb-3 pt-6">
          <AgenticInputBar
            collapsed={barCollapsed}
            onExpand={() => setBarCollapsed(false)}
            textareaRef={textareaRef}
          />
        </div>
      </div>

      {/* SQL detail sheet */}
      <SqlDetailSheet
        block={selectedBlock}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSendCorrection={(msg) => {
          setSheetOpen(false);
          sendQuery(msg);
        }}
        hideCorrectionInput={isGroupChat}
        initialTab={sheetTab}
      />
    </div>
  );
};

export default AgenticChatLayout;
