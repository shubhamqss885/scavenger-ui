import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import {
  ChatMessage,
  CompactionResult,
  PendingClarification,
  ProgressStep,
  TokenUsage,
  VaultWritePending,
  VaultWriteResult,
} from "../types";
import { type ModelProvider } from "@/components/blocks/InputBarShell/ModelSwitcher";
import { AgenticChatAction } from "../agenticChatReducer";
import {
  chatSessionStore,
  ChatSessionState,
  NOTIFY_BANNER_CONFIRM_LINGER_MS,
  NOTIFY_BANNER_THRESHOLD_MS,
  PendingReplay,
} from "../chatSession";

type UseAgenticWebSocketParams = Readonly<{
  dispatch: Dispatch<AgenticChatAction>;
  setProgressSteps: Dispatch<SetStateAction<ProgressStep[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  setPendingClarification: Dispatch<
    SetStateAction<PendingClarification | null>
  >;
  setSelectedOptions: Dispatch<SetStateAction<Set<string>>>;
  setClarificationCollapsed: Dispatch<SetStateAction<boolean>>;
  setInput: Dispatch<SetStateAction<string>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  token: string;
  projectId: string;
  provider: ModelProvider;
  isAgnoEnabled: boolean;
  isStreaming: boolean;
  // Reducer-side history-load flag. Gates the finalize/agentError drains
  // because their dispatch must come AFTER LOAD_HISTORY_SUCCESS — otherwise
  // the synthesized in-flight bubble (ENSURE_INFLIGHT_TAIL) is clobbered by
  // the history payload.
  isLoadingHistory: boolean;
  onVaultWritePending?: (data: VaultWritePending) => void;
  onVaultWriteResult?: (data: VaultWriteResult) => void;
  onTokenUsage?: (data: TokenUsage) => void;
  onTokensDelta?: (delta: number) => void;
  onCompactionStarted?: () => void;
  onCompactionResult?: (result: CompactionResult) => void;
  onAuthError?: () => void;
  onTokenLimitReached?: () => void;
  // Auto-name flow — both must be set to enable. The hook drains the
  // pendingReplay.autoName flag set by the store at finalize time.
  currentProjectName?: string;
  onFirstResponseEnded?: (expectedName: string) => void;
  webSearchEnabled?: boolean;
  hasFiles?: boolean;
  // Group chat: current user info for message attribution
  currentUserSub?: string;
  currentUserName?: string;
}>;

type UseAgenticWebSocketReturn = Readonly<{
  sendWsMessage: (query: string, opts?: { skipUserMessage?: boolean }) => void;
  sendCompactMessage: (preserveRecent?: number) => void;
  stopAgent: () => void;
  sendClarificationAnswer: (
    formattedAnswer: string,
    displayedAnswer: string,
  ) => boolean;
  notifyOnDone: boolean;
  showNotifyBanner: boolean;
  requestNotifyOnDone: () => Promise<void>;
}>;

type NotifyBannerTimerKind = "threshold" | "linger";
type NotifyBannerTimer = Readonly<{
  kind: NotifyBannerTimerKind;
  id: ReturnType<typeof setTimeout>;
}>;

export const useAgenticWebSocket = ({
  dispatch,
  setProgressSteps,
  setIsStreaming,
  setPendingClarification,
  setSelectedOptions,
  setClarificationCollapsed,
  setInput,
  setStatusMessage,
  token,
  projectId,
  provider,
  isAgnoEnabled,
  isStreaming,
  isLoadingHistory,
  onVaultWritePending,
  onVaultWriteResult,
  onTokenUsage,
  onTokensDelta,
  onCompactionStarted,
  onCompactionResult,
  onAuthError,
  onTokenLimitReached,
  currentProjectName,
  onFirstResponseEnded,
  webSearchEnabled,
  hasFiles,
  currentUserSub,
  currentUserName,
}: UseAgenticWebSocketParams): UseAgenticWebSocketReturn => {
  const { t } = useTranslation("agentic-chat");

  // Banner UI state. Lives in the hook (per-component) because the linger
  // timer after opt-in is purely a visual affordance.
  const [notifyOnDone, setNotifyOnDone] = useState(false);
  const [showNotifyBanner, setShowNotifyBanner] = useState(false);
  const notifyBannerTimerRef = useRef<NotifyBannerTimer | null>(null);

  const rafRef = useRef<number | null>(null);

  // Callbacks change identity on every parent render. Refs let syncFromSnapshot
  // stay stable so we don't re-attach the subscriber on every render.
  const cbRef = useRef({
    dispatch,
    setProgressSteps,
    setIsStreaming,
    setPendingClarification,
    setSelectedOptions,
    setClarificationCollapsed,
    setStatusMessage,
    onVaultWritePending,
    onVaultWriteResult,
    onTokenUsage,
    onTokensDelta,
    onCompactionStarted,
    onCompactionResult,
    onAuthError,
    onTokenLimitReached,
    onFirstResponseEnded,
    currentProjectName,
    isLoadingHistory,
    t,
  });

  useLayoutEffect(() => {
    cbRef.current = {
      dispatch,
      setProgressSteps,
      setIsStreaming,
      setPendingClarification,
      setSelectedOptions,
      setClarificationCollapsed,
      setStatusMessage,
      onVaultWritePending,
      onVaultWriteResult,
      onTokenUsage,
      onTokensDelta,
      onCompactionStarted,
      onCompactionResult,
      onAuthError,
      onTokenLimitReached,
      onFirstResponseEnded,
      currentProjectName,
      isLoadingHistory,
      t,
    };
  });

  const clearNotifyBannerTimer = useCallback((kind?: NotifyBannerTimerKind) => {
    const timer = notifyBannerTimerRef.current;

    if (!timer || (kind && timer.kind !== kind)) return;
    clearTimeout(timer.id);
    notifyBannerTimerRef.current = null;
  }, []);

  // Banner threshold timer reflects the session's bannerArmedAt. Re-runs on
  // every sync so remount during a slow run picks up the remaining time.
  const updateBannerTimer = useCallback(
    (state: ChatSessionState) => {
      if (state.notifyOnDone) {
        if (notifyBannerTimerRef.current?.kind !== "linger") {
          clearNotifyBannerTimer();
          setShowNotifyBanner(false);
        }
        return;
      }

      clearNotifyBannerTimer("threshold");

      if (!state.isStreaming || state.bannerArmedAt == null) {
        setShowNotifyBanner(false);
        return;
      }

      const elapsed = Date.now() - state.bannerArmedAt;

      if (elapsed >= NOTIFY_BANNER_THRESHOLD_MS) {
        setShowNotifyBanner(true);
        return;
      }
      const id = setTimeout(() => {
        notifyBannerTimerRef.current = null;
        setShowNotifyBanner(true);
      }, NOTIFY_BANNER_THRESHOLD_MS - elapsed);

      notifyBannerTimerRef.current = { kind: "threshold", id };
    },
    [clearNotifyBannerTimer],
  );

  const startNotifyBannerLingerTimer = useCallback(() => {
    clearNotifyBannerTimer();
    const id = setTimeout(() => {
      notifyBannerTimerRef.current = null;
      setShowNotifyBanner(false);
    }, NOTIFY_BANNER_CONFIRM_LINGER_MS);

    notifyBannerTimerRef.current = { kind: "linger", id };
  }, [clearNotifyBannerTimer]);

  const clearAllNotifyBannerTimers = useCallback(() => {
    if (notifyBannerTimerRef.current) {
      clearTimeout(notifyBannerTimerRef.current.id);
      notifyBannerTimerRef.current = null;
    }
  }, []);

  // Read the latest session snapshot and mirror it into React state, then
  // drain all deferred side-effects in pendingReplay so they fire against
  // the currently-live callbacks. Runs per WS event via rAF (see attach
  // effect below) — that's the load-bearing per-tick cadence that lets
  // mid-stream events (e.g. vaultWritePending) drain promptly.
  const syncFromSnapshot = useCallback(() => {
    const session = chatSessionStore.get(projectId);

    if (!session) return;
    const cb = cbRef.current;
    const state = session.state;
    const r = state.pendingReplay;

    // Mirror live store state into React.
    cb.setProgressSteps(state.progressSteps);
    cb.setIsStreaming(state.isStreaming);
    cb.setPendingClarification(state.pendingClarification);
    cb.setStatusMessage(state.statusMessage);
    setNotifyOnDone(state.notifyOnDone);
    updateBannerTimer(state);

    // Helper: drain one replay slot if present, then clear it. Keeps the
    // if/call/delete pattern in one place so a future replay kind can't
    // silently no-op by forgetting the boilerplate.
    const drain = <K extends keyof PendingReplay>(
      key: K,
      fn: (v: NonNullable<PendingReplay[K]>) => void,
    ) => {
      const v = r[key];

      if (v == null) return;
      fn(v as NonNullable<PendingReplay[K]>);
      delete r[key];
    };

    // Always-safe drains — no precondition on reducer state.
    drain("tokenUsage", (v) => cb.onTokenUsage?.(v));
    drain("tokensDelta", (v) => cb.onTokensDelta?.(v));
    drain("compactionStarted", () => cb.onCompactionStarted?.());
    drain("compactionResult", (v) => cb.onCompactionResult?.(v));
    drain("vaultWritePending", (arr) => {
      for (const event of arr) cb.onVaultWritePending?.(event);
    });
    drain("vaultWriteResult", (arr) => {
      for (const event of arr) cb.onVaultWriteResult?.(event);
    });
    drain("tokenLimitReached", () => cb.onTokenLimitReached?.());
    drain("newClarification", () => {
      cb.setSelectedOptions(new Set());
      cb.setClarificationCollapsed(false);
    });
    drain("autoName", (v) => cb.onFirstResponseEnded?.(v.expectedName));

    // History-gated drains. finalize / agentError / snapshotClarification
    // all dispatch into the reducer and need a trailing agent bubble
    // (ENSURE_INFLIGHT_TAIL synthesizes one). Skip until history finishes
    // loading — LOAD_HISTORY_SUCCESS would otherwise clobber the
    // synthesized bubble. History load completion calls
    // chatSessionStore.pingDrain(projectId), so the same rAF subscriber path
    // re-runs this sync once the reducer can accept the replay.
    //
    // snapshotClarification is bundled here even though `isStreaming` is
    // false during a clarification pause — without the tail synthesis the
    // SNAPSHOT_CLARIFICATION reducer would silently no-op (its
    // precondition is `last.role === "agent"`) and the snapshot would be
    // lost on detached → remount.
    //
    // authError lives here too because its callback dispatches SET_AGENT_ERROR,
    // which has the same trailing-agent precondition as agentError.
    if (cb.isLoadingHistory) return;

    if (
      r.finalize ||
      r.agentError ||
      r.authError ||
      r.snapshotClarification ||
      (state.isStreaming && !state.didFinalize)
    ) {
      cb.dispatch({
        type: "ENSURE_INFLIGHT_TAIL",
        payload: {
          fallbackUserQuery: session.displayedUserMessage,
          conversationId: r.finalize?.conversationId,
        },
      });
    }
    drain("finalize", (v) =>
      cb.dispatch({ type: "FINALIZE_AGENT_MESSAGE", payload: v }),
    );
    drain("agentError", (v) =>
      cb.dispatch({ type: "SET_AGENT_ERROR", payload: v }),
    );
    drain("authError", () => cb.onAuthError?.());
    drain("snapshotClarification", (v) =>
      cb.dispatch({ type: "SNAPSHOT_CLARIFICATION", payload: v }),
    );
  }, [projectId, updateBannerTimer]);

  // Attach to the store. Subscribe BEFORE reading the snapshot to avoid
  // missing an event that fires between read and subscribe.
  useEffect(() => {
    const onUpdate = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        syncFromSnapshot();
      });
    };

    const detach = chatSessionStore.attach(projectId, onUpdate, t);

    // Opening this chat reads it — clear its unread dot. While open, the attached
    // hook (onUpdate) marks it "witnessed" so a run finishing here isn't flagged.
    chatSessionStore.markSeen(projectId);

    syncFromSnapshot();

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      detach();
    };
    // Intentionally omit `t` from the deps — re-attach would re-fire all
    // drains. syncFromSnapshot reads the latest `t` via cbRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, syncFromSnapshot]);

  const sendWsMessage = useCallback(
    (query: string, opts?: { skipUserMessage?: boolean }) => {
      if (isStreaming) return;

      // `displayedText` is the user-facing text for the synthesized user
      // bubble (used only on remount when REST hasn't caught up yet).
      // When skipUserMessage is set, no user bubble is shown for this
      // send — typically the clarification-fallback case where the answer
      // renders inline on the prior agent's clarification card. Passing
      // undefined here ensures no bogus bubble is synthesized later from
      // the BE wire payload (`query` may be a wrapper string like
      // "Response of Clarification Question: ... IS Answer: ...").
      const sent = chatSessionStore.send(projectId, query, {
        token,
        provider,
        isAgnoEnabled,
        t,
        currentProjectName,
        webSearchEnabled,
        hasFiles,
        displayedText: opts?.skipUserMessage ? undefined : query,
      });

      if (!sent) return;

      const newMessages: ChatMessage[] = [];

      if (!opts?.skipUserMessage) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: "user",
          text: query,
          inflight: true,
          userSub: currentUserSub,
          userName: currentUserName,
        });
      }
      newMessages.push({
        id: crypto.randomUUID(),
        role: "agent",
        text: "",
        inflight: true,
      });
      dispatch({ type: "ADD_MESSAGES", payload: { newMessages } });

      setInput("");
    },
    [
      isStreaming,
      dispatch,
      setInput,
      projectId,
      token,
      provider,
      isAgnoEnabled,
      t,
      currentProjectName,
      webSearchEnabled,
      hasFiles,
      currentUserSub,
      currentUserName,
    ],
  );

  const sendCompactMessage = useCallback(
    (preserveRecent: number = 5) => {
      chatSessionStore.compact(projectId, preserveRecent, { token });
    },
    [projectId, token],
  );

  const stopAgent = useCallback(() => {
    chatSessionStore.stop(projectId, { token });
  }, [projectId, token]);

  const sendClarificationAnswer = useCallback(
    (formattedAnswer: string, displayedAnswer: string): boolean =>
      chatSessionStore.sendClarificationAnswer(
        projectId,
        formattedAnswer,
        displayedAnswer,
      ),
    [projectId],
  );

  // Banner click — a user gesture, required by browsers for
  // Notification.requestPermission(). Linger before hiding.
  const requestNotifyOnDone = useCallback(async () => {
    if (!("Notification" in globalThis)) {
      setShowNotifyBanner(false);
      return;
    }
    if (Notification.permission === "denied") {
      setShowNotifyBanner(false);
      toast.error(t("chat.notifyPermissionDenied"));
      return;
    }
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();

      if (result !== "granted") {
        setShowNotifyBanner(false);
        if (result === "denied") {
          toast.error(t("chat.notifyPermissionDenied"));
        }
        return;
      }
    }

    chatSessionStore.setNotifyOnDone(projectId, true);
    setNotifyOnDone(true);

    // If the run ended while the permission prompt was open, fire ourselves
    // so the user still gets a notification.
    const session = chatSessionStore.get(projectId);

    if (session && !session.state.isStreaming) {
      chatSessionStore.fireDoneNotification(t);
    }

    startNotifyBannerLingerTimer();
  }, [projectId, startNotifyBannerLingerTimer, t]);

  // Clean up banner timers on unmount. NOTE: we deliberately do NOT close
  // the socket or send `stop_agent` here. The store keeps the session alive
  // across navigation, which is the point of this whole refactor.
  useEffect(() => {
    return () => {
      clearAllNotifyBannerTimers();
    };
  }, [clearAllNotifyBannerTimers]);

  return {
    sendWsMessage,
    sendCompactMessage,
    stopAgent,
    sendClarificationAnswer,
    notifyOnDone,
    showNotifyBanner,
    requestNotifyOnDone,
  };
};
