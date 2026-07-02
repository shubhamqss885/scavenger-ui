"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { ClarificationPanel } from "./ClarificationPanel";
import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "../../AgenticChatContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SlashCommandMenu, {
  SLASH_COMMANDS,
  filterSlashCommands,
  type SlashCommand,
} from "./SlashCommandMenu";
import MentionMenu, {
  filterMembers,
  type MentionableMember,
} from "./MentionMenu";
import CopyAgenticMetadata from "@/components/blocks/CopyAgenticMetadata";
import { useTokenCount } from "../../hooks/useTokenCount";
import InputBarShell from "@/components/blocks/InputBarShell";
import LanguageToolbarButton from "@/components/blocks/InputBarShell/LanguageToolbarButton";
import WebSearchToggleButton from "@/components/blocks/InputBarShell/WebSearchToggleButton";
// Disabled: single backend now, no model switching needed
// import ModelSwitcher from "@/components/blocks/InputBarShell/ModelSwitcher";
// import AgnoToggle from "@/components/blocks/InputBarShell/AgnoToggle";
import ProjectFilesPanel from "../files/ProjectFilesPanel";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import {
  useAudioRecording,
  type RecordingErrorCode,
} from "@/lib/hooks/useAudioRecording";
import {
  DictationActiveControls,
  DictationStartButton,
} from "@/components/blocks/InputBar/components/DictationControls";
import { RecordingSurface } from "@/components/blocks/InputBar/components/RecordingSurface";
import { toast } from "sonner";

type AgenticInputBarProps = Readonly<{
  collapsed?: boolean;
  onExpand?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}>;

const AgenticInputBar = ({
  collapsed = false,
  onExpand,
  textareaRef,
}: AgenticInputBarProps) => {
  const { t, i18n } = useTranslation("agentic-chat");
  const input = useContextSelector(AgenticChatContext, (c) => c!.input);
  const setInput = useContextSelector(AgenticChatContext, (c) => c!.setInput);
  const isStreaming = useContextSelector(
    AgenticChatContext,
    (c) => c!.isStreaming,
  );
  const isLoadingHistory = useContextSelector(
    AgenticChatContext,
    (c) => c!.isLoadingHistory,
  );
  const pendingClarification = useContextSelector(
    AgenticChatContext,
    (c) => c!.pendingClarification,
  );
  const clarificationCollapsed = useContextSelector(
    AgenticChatContext,
    (c) => c!.clarificationCollapsed,
  );
  const setClarificationCollapsed = useContextSelector(
    AgenticChatContext,
    (c) => c!.setClarificationCollapsed,
  );
  const selectedOptions = useContextSelector(
    AgenticChatContext,
    (c) => c!.selectedOptions,
  );
  const handleOptionClick = useContextSelector(
    AgenticChatContext,
    (c) => c!.handleOptionClick,
  );
  const submitClarification = useContextSelector(
    AgenticChatContext,
    (c) => c!.submitClarification,
  );
  const sendQuery = useContextSelector(AgenticChatContext, (c) => c!.sendQuery);
  const stopAgent = useContextSelector(AgenticChatContext, (c) => c!.stopAgent);
  const dbName = useContextSelector(AgenticChatContext, (c) => c!.dbName);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const projectId = useContextSelector(AgenticChatContext, (c) => c!.projectId);
  const messages = useContextSelector(AgenticChatContext, (c) => c!.messages);
  const tokenUsage = useContextSelector(
    AgenticChatContext,
    (c) => c!.tokenUsage,
  );
  const isProjectTokenLimitReached = useContextSelector(
    AgenticChatContext,
    (c) => c!.isProjectTokenLimitReached,
  );
  const projectFiles = useContextSelector(
    AgenticChatContext,
    (c) => c!.projectFiles,
  );
  const isFileIndexingActive = useContextSelector(
    AgenticChatContext,
    (c) => c!.isFileIndexingActive,
  );
  const setFilesPanelOpen = useContextSelector(
    AgenticChatContext,
    (c) => c!.setFilesPanelOpen,
  );
  const pendingVaultWriteCount = useContextSelector(
    AgenticChatContext,
    (c) => c!.pendingVaultWriteCount,
  );
  const openPendingVaultWrites = useContextSelector(
    AgenticChatContext,
    (c) => c!.openPendingVaultWrites,
  );
  const webSearchEnabled = useContextSelector(
    AgenticChatContext,
    (c) => c!.webSearchEnabled,
  );
  const setWebSearchEnabled = useContextSelector(
    AgenticChatContext,
    (c) => c!.setWebSearchEnabled,
  );
  // Disabled: single backend now, no model switching needed
  // const provider = useContextSelector(AgenticChatContext, (c) => c!.provider);
  // const setProvider = useContextSelector(
  //   AgenticChatContext,
  //   (c) => c!.setProvider,
  // );
  // const isAgnoEnabled = useContextSelector(
  //   AgenticChatContext,
  //   (c) => c!.isAgnoEnabled,
  // );
  // const setAgnoEnabled = useContextSelector(
  //   AgenticChatContext,
  //   (c) => c!.setAgnoEnabled,
  // );
  const groupId = useContextSelector(AgenticChatContext, (c) => c!.groupId);
  const groupMembers = useContextSelector(
    AgenticChatContext,
    (c) => c!.groupMembers,
  );
  const groupTypingUser = useContextSelector(
    AgenticChatContext,
    (c) => c!.groupTypingUser,
  );
  const isGroupChat = Boolean(groupId);

  // Use backend token usage if available, otherwise fall back to client-side estimation
  const { usage: clientUsage } = useTokenCount(messages);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const usage = tokenUsage ? tokenUsage.usagePercent / 100 : clientUsage;

  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionFilter, setMentionFilter] = useState("");
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isAudioRecordingEnabled = isFeatureEnabled(
    FEATURE_FLAGS.AUDIO_RECORDING,
  );

  const handleTranscriptionComplete = (transcribedText: string) => {
    if (!transcribedText) return;
    const sep = input && !input.endsWith(" ") ? " " : "";
    const next = `${input}${sep}${transcribedText}`;
    setInput(next);
    requestAnimationFrame(() => {
      const node = textareaRef?.current;

      if (node) {
        node.focus();
        node.setSelectionRange(next.length, next.length);
      }
    });
  };

  const {
    recordingState,
    startRecording,
    cancelRecording,
    stopRecording,
    errorEvent,
    stream: recordingStream,
  } = useAudioRecording(handleTranscriptionComplete, i18n.language);

  useEffect(() => {
    if (!errorEvent) return;
    const keyMap: Record<RecordingErrorCode, string> = {
      PERMISSION_DENIED: "chat.dictation.error.permissionDenied",
      NO_MIC: "chat.dictation.error.noMic",
      MIC_IN_USE: "chat.dictation.error.micInUse",
      UNSUPPORTED: "chat.dictation.error.unsupported",
      ENCODER_FAILED: "chat.dictation.error.encoderFailed",
      TRANSCRIPTION_FAILED: "chat.dictation.error.transcriptionFailed",
      GENERIC: "chat.dictation.error.generic",
    };
    toast.error(t(keyMap[errorEvent.code]), { duration: 6000 });
  }, [errorEvent, t]);

  const isRecordingMode =
    recordingState === "recording" || recordingState === "processing";

  // Show slash menu when input starts with /
  // Commented out till Backend is ready
  // useEffect(() => {
  //   const shouldShow = input.startsWith("/") && !input.includes(" ");
  //   setSlashMenuOpen(shouldShow);
  //   if (shouldShow) setSlashSelectedIndex(0);
  // }, [input]);

  // Show mention menu when typing @ in group chats
  useEffect(() => {
    if (!isGroupChat || !groupMembers.length) {
      setMentionMenuOpen(false);
      return;
    }
    // Find the last @ that could be a mention trigger
    const lastAtIndex = input.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setMentionMenuOpen(false);
      return;
    }
    // Check if there's a space after the @ (mention already completed)
    const textAfterAt = input.slice(lastAtIndex + 1);
    // If textAfterAt contains a space before any email-like content, the mention is done
    const spaceIndex = textAfterAt.indexOf(" ");

    if (spaceIndex !== -1 && !textAfterAt.slice(0, spaceIndex).includes("@")) {
      // There's a space and no @ in between - mention typing done or cancelled
      setMentionMenuOpen(false);
      return;
    }
    // Show menu and filter based on text after @
    const filter = textAfterAt.split(" ")[0] || "";
    setMentionFilter(filter);
    const hasMatches =
      filterMembers(
        groupMembers.map((m) => ({
          id: m.id,
          name: m.user_name,
          email: m.user_email,
          sub: m.user_sub,
        })),
        filter,
      ).length > 0;
    setMentionMenuOpen(hasMatches);
    if (hasMatches) setMentionSelectedIndex(0);
  }, [input, isGroupChat, groupMembers]);

  // Convert GroupMember to MentionableMember format
  const mentionableMembers: MentionableMember[] = groupMembers.map((m) => ({
    id: m.id,
    name: m.user_name,
    email: m.user_email,
    sub: m.user_sub,
  }));

  const handleMentionSelect = useCallback(
    (member: MentionableMember) => {
      setMentionMenuOpen(false);
      // Replace the partial @mention with the full email
      const lastAtIndex = input.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const beforeAt = input.slice(0, lastAtIndex);
        const email = member.email || member.sub;
        setInput(`${beforeAt}@${email} `);
      }
    },
    [input, setInput],
  );

  const getMentionFilteredCount = () =>
    filterMembers(mentionableMembers, mentionFilter).length;

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setSlashMenuOpen(false);
      setInput("");
      sendQuery(cmd.command);
    },
    [sendQuery, setInput],
  );

  const getFilteredCount = () =>
    filterSlashCommands(SLASH_COMMANDS, input, t).length;

  const isBusyWithoutClarification = isStreaming && !pendingClarification;
  const hasSubmittableContent =
    input.trim() || (pendingClarification && selectedOptions.size > 0);
  // In group chats, also disable when another user's agent is responding
  const isGroupAgentBusy = isGroupChat && !!groupTypingUser;

  const isSubmitDisabled =
    isLoadingHistory ||
    isBusyWithoutClarification ||
    isProjectTokenLimitReached ||
    isFileIndexingActive ||
    isGroupAgentBusy ||
    !hasSubmittableContent;

  const handleSubmit = () => {
    if (pendingClarification) {
      submitClarification();
      return;
    }
    if (!input.trim()) return;
    sendQuery(input);
  };

  const handleSlashMenuKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ): boolean => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashSelectedIndex((prev) =>
        prev < getFilteredCount() - 1 ? prev + 1 : 0,
      );
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : getFilteredCount() - 1,
      );
      return true;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const filtered = filterSlashCommands(SLASH_COMMANDS, input, t);

      if (filtered[slashSelectedIndex]) {
        handleSlashSelect(filtered[slashSelectedIndex]);
      }
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setSlashMenuOpen(false);
      return true;
    }
    return false;
  };

  const handleMentionMenuKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ): boolean => {
    const count = getMentionFilteredCount();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionSelectedIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionSelectedIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const filtered = filterMembers(mentionableMembers, mentionFilter);

      if (filtered[mentionSelectedIndex]) {
        handleMentionSelect(filtered[mentionSelectedIndex]);
      }
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setMentionMenuOpen(false);
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMenuOpen && handleMentionMenuKeyDown(e)) return;
    if (slashMenuOpen && handleSlashMenuKeyDown(e)) return;

    if (e.key === "Escape" && pendingClarification && !clarificationCollapsed) {
      e.preventDefault();
      setClarificationCollapsed(true);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (pendingClarification) {
        submitClarification();
      } else {
        if (!input.trim()) return;
        sendQuery(input);
      }
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (collapsed) onExpand?.();
  };

  const handleFocus = () => {
    if (pendingClarification && clarificationCollapsed)
      setClarificationCollapsed(false);
    if (collapsed) onExpand?.();
  };

  return (
    <InputBarShell
      viewTransitionName="input-bar"
      input={input}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      placeholder={
        isProjectTokenLimitReached
          ? t("chat.projectTokenLimitPlaceholder")
          : pendingClarification
            ? t("chat.otherPlaceholder")
            : t("chat.placeholder")
      }
      disabled={
        isBusyWithoutClarification ||
        isProjectTokenLimitReached ||
        isGroupAgentBusy
      }
      submitDisabled={isSubmitDisabled}
      isLoading={isBusyWithoutClarification}
      onStop={stopAgent}
      textareaRef={textareaRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onFormClick={() => {
        if (collapsed) onExpand?.();
      }}
      maxHeight={collapsed ? 32 : 200}
      inputOverride={
        isRecordingMode ? (
          <RecordingSurface
            recordingState={recordingState}
            stream={recordingStream}
          />
        ) : undefined
      }
      className={cn(
        "px-3 pb-3 transition-all duration-300 ease-in-out",
        collapsed ? "max-w-xl" : "max-w-3xl",
      )}
      formClassName={cn(
        "pointer-events-auto",
        pendingClarification
          ? "border-slate-200 dark:border-slate-700"
          : undefined,
      )}
      textareaRowClassName={cn(
        "transition-all duration-300 ease-in-out",
        collapsed ? "p-1.5 pl-2.5" : undefined,
      )}
      textareaClassName={collapsed ? "py-1.5" : undefined}
      toolbarClassName={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        collapsed
          ? "min-h-0 max-h-0 border-t-transparent py-0 opacity-0"
          : "max-h-12 opacity-100",
      )}
      topContent={
        !collapsed && (isFileIndexingActive || pendingClarification) ? (
          <>
            {isFileIndexingActive && (
              <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2.5 text-sm text-slate-600">
                <Icon
                  name="LoaderCircle"
                  size="sm"
                  className="animate-spin text-primary"
                />
                <span>{t("files.indexingInProgress")}</span>
              </div>
            )}
            {pendingClarification && (
              <ClarificationPanel
                question={pendingClarification.question}
                options={pendingClarification.options ?? []}
                allowMultiple={!!pendingClarification.allowMultiple}
                collapsed={clarificationCollapsed}
                selectedOptions={selectedOptions}
                onOptionClick={handleOptionClick}
                onCollapse={() => setClarificationCollapsed(true)}
                onExpand={() => setClarificationCollapsed(false)}
              />
            )}
          </>
        ) : null
      }
      aboveTextarea={
        mentionMenuOpen ? (
          <MentionMenu
            members={mentionableMembers}
            filter={mentionFilter}
            selectedIndex={mentionSelectedIndex}
            onSelect={handleMentionSelect}
          />
        ) : slashMenuOpen ? (
          <SlashCommandMenu
            filter={input}
            selectedIndex={slashSelectedIndex}
            onSelect={handleSlashSelect}
          />
        ) : null
      }
      toolbarLeft={
        <TooltipProvider delayDuration={300}>
          {/* DB name chip */}
          {dbName && (
            <div className="inline-flex h-7 items-center gap-1.5 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:px-2.5">
              <Icon name="Database" size="xxs" className="text-current" />
              <span className="hidden max-w-[200px] truncate sm:inline">
                {dbName}
              </span>
            </div>
          )}

          {/* Personality (coming soon) */}
          {isFeatureEnabled(FEATURE_FLAGS.PERSONALITY_BUTTON) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled
                  className="inline-flex h-7 cursor-not-allowed items-center justify-center rounded-md px-2 opacity-40"
                >
                  <Icon name="Brain" size="xs" className="text-slate-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("chat.personality")}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Agno toggle for non-super-admins (Claude vs Bedrock) — locked on in group chat */}
          {/* Disabled: single backend now, no toggle needed */}
          {/* {!isFeatureEnabled(FEATURE_FLAGS.MODEL_SWITCHER) && (
            <AgnoToggle
              checked={isAgnoEnabled}
              onCheckedChange={setAgnoEnabled}
              disabled={isRecordingMode || isGroupChat}
            />
          )} */}

          {/* Full model switcher (super-admin only, shown everywhere including group chat) */}
          {/* Disabled: single backend now, no model switching needed */}
          {/* {isFeatureEnabled(FEATURE_FLAGS.MODEL_SWITCHER) && (
            <ModelSwitcher
              provider={provider}
              onProviderChange={setProvider}
              agno={isAgnoEnabled}
              onAgnoChange={setAgnoEnabled}
              disabled={isRecordingMode}
            />
          )} */}

          <WebSearchToggleButton
            enabled={webSearchEnabled}
            onToggle={() => setWebSearchEnabled((prev) => !prev)}
            disabled={isRecordingMode}
          />

          {/* Language */}
          {isFeatureEnabled(FEATURE_FLAGS.INPUT_LANGUAGE_SELECTOR) && (
            <LanguageToolbarButton disabled={isRecordingMode} />
          )}

          {/* Project Files */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setFilesPanelOpen(true)}
                disabled={isRecordingMode}
                className="relative inline-flex h-7 items-center justify-center rounded-md px-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800"
              >
                <Icon name="Paperclip" size="xs" className="text-slate-500" />
                {projectFiles.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {projectFiles.length}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("files.panelTitle")}</TooltipContent>
          </Tooltip>

          {/* Debug info */}
          {isFeatureEnabled(FEATURE_FLAGS.DEBUG_INFO) && (
            <CopyAgenticMetadata iconOnly />
          )}

          {/* Pending vault writes indicator */}
          {pendingVaultWriteCount > 0 && (
            <button
              type="button"
              onClick={openPendingVaultWrites}
              disabled={isRecordingMode}
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/70"
            >
              {t("vault.indicator.pendingBadge")} ({pendingVaultWriteCount})
            </button>
          )}
        </TooltipProvider>
      }
      toolbarRight={
        <>
          {isAudioRecordingEnabled ? (
            isRecordingMode ? (
              <DictationActiveControls
                isProcessing={recordingState === "processing"}
                onAccept={stopRecording}
                onCancel={cancelRecording}
              />
            ) : (
              <DictationStartButton
                onStart={startRecording}
                isRequesting={recordingState === "requesting"}
                disabled={
                  isBusyWithoutClarification || isProjectTokenLimitReached
                }
              />
            )
          ) : null}
        </>
        /* Context usage bar . Temporirily disable token usage bar*/
        // <TooltipProvider delayDuration={200}>
        //   <Tooltip>
        //     <TooltipTrigger asChild>
        //       <div className="inline-flex h-7 w-16 items-center px-2.5">
        //         <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        //           <div
        //             className={cn("h-full transition-all duration-500", {
        //               "bg-red-500": usage >= 1,
        //               "bg-amber-400":
        //                 usage < 1 &&
        //                 ((tokenUsage?.shouldWarn ?? false) || usage >= 0.7),
        //               "bg-emerald-500": !tokenUsage?.shouldWarn && usage < 0.7,
        //             })}
        //             style={{ width: `${Math.min(usage * 100, 100)}%` }}
        //           />
        //         </div>
        //       </div>
        //     </TooltipTrigger>
        //     <TooltipContent side="top" className="max-w-[280px]">
        //       <div className="space-y-1 text-xs">
        //         <p className="font-medium">
        //           {t("tokenUsage.contextUsage", {
        //             percent: (usage * 100).toFixed(1),
        //           })}
        //         </p>
        //         {tokenUsage && (
        //           <p className="opacity-70">
        //             {t("tokenUsage.tokenDetails", {
        //               used:
        //                 tokenUsage.estimatedTokens >= 1000
        //                   ? `${(tokenUsage.estimatedTokens / 1000).toFixed(1)}k`
        //                   : tokenUsage.estimatedTokens,
        //               total:
        //                 tokenUsage.contextWindow >= 1000
        //                   ? `${(tokenUsage.contextWindow / 1000).toFixed(1)}k`
        //                   : tokenUsage.contextWindow,
        //             })}
        //           </p>
        //         )}
        //         {usage >= 0.6 && (
        //           <p className="text-amber-400">
        //             {t("tokenUsage.compactHint")}
        //           </p>
        //         )}
        //       </div>
        //     </TooltipContent>
        //   </Tooltip>
        // </TooltipProvider>
      }
      belowShell={<ProjectFilesPanel />}
    />
  );
};

export default AgenticInputBar;
