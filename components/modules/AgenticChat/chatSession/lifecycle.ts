import { isDefaultProjectName } from "@/lib/utils/projectNameGenerator";
import {
  ChatSession,
  IDLE_SESSION_TEARDOWN_MS,
  PendingReplay,
  Translator,
  fallbackT,
  initialState,
  sessions,
} from "./types";
import { updateStreamingMembership } from "./streaming";
import { markSeen, markUnread } from "./unread";

const cancelIdleTeardown = (s: ChatSession): void => {
  if (!s.idleTeardownTimer) return;
  clearTimeout(s.idleTeardownTimer);
  s.idleTeardownTimer = undefined;
};

const pendingReplaySlotIsEmpty = {
  autoName: (r) => !r.autoName,
  tokenLimitReached: (r) => !r.tokenLimitReached,
  authError: (r) => !r.authError,
  agentError: (r) => !r.agentError,
  snapshotClarification: (r) => !r.snapshotClarification,
  finalize: (r) => !r.finalize,
  vaultWritePending: (r) => !r.vaultWritePending?.length,
  vaultWriteResult: (r) => !r.vaultWriteResult?.length,
  tokenUsage: (r) => !r.tokenUsage,
  tokensDelta: (r) => !r.tokensDelta,
  compactionStarted: (r) => !r.compactionStarted,
  compactionResult: (r) => !r.compactionResult,
  newClarification: (r) => !r.newClarification,
} satisfies Record<keyof PendingReplay, (replay: PendingReplay) => boolean>;

const isReplayEmpty = (pendingReplay: PendingReplay): boolean =>
  Object.values(pendingReplaySlotIsEmpty).every((isEmpty) =>
    isEmpty(pendingReplay),
  );

const canIdleTeardown = (s: ChatSession): boolean =>
  !s.onUpdate &&
  !s.socket &&
  !s.state.isStreaming &&
  !s.state.pendingClarification &&
  !s.state.notifyOnDone &&
  s.state.bannerArmedAt == null &&
  isReplayEmpty(s.state.pendingReplay);

export const getOrCreate = (projectId: string): ChatSession => {
  let s = sessions.get(projectId);

  if (!s) {
    s = {
      projectId,
      socket: null,
      state: initialState(),
      onUpdate: null,
      t: fallbackT,
      currentProjectName: undefined,
      displayedUserMessage: undefined,
    };
    sessions.set(projectId, s);
  } else {
    cancelIdleTeardown(s);
  }
  return s;
};

export const teardownSession = (projectId: string): void => {
  const s = sessions.get(projectId);

  if (!s) return;
  cancelIdleTeardown(s);
  if (s.socket) {
    try {
      s.socket.close();
    } catch {
      // ignore
    }
  }
  // Remove from streamingIds before deleting the session so the sidebar
  // indicator clears immediately.
  updateStreamingMembership(projectId, false);
  sessions.delete(projectId);
};

export const refreshIdleTeardown = (s: ChatSession): void => {
  cancelIdleTeardown(s);
  if (!canIdleTeardown(s)) return;

  const sessionRef = s;

  s.idleTeardownTimer = setTimeout(() => {
    if (sessions.get(sessionRef.projectId) !== sessionRef) return;
    sessionRef.idleTeardownTimer = undefined;
    if (!canIdleTeardown(sessionRef)) return;
    teardownSession(sessionRef.projectId);
  }, IDLE_SESSION_TEARDOWN_MS);
};

// Single WRITE point for the "unseen terminal result" flag: every terminal path
// ends in notify(), so flagging here covers them all. Idempotent, so safe to run
// on every notify (including mid-stream).
const syncUnread = (s: ChatSession): void => {
  // Witnessed rule: a run finishing in the chat you're viewing isn't unread —
  // the open chat is the one with a mounted hook (onUpdate set). ASSUMPTION:
  // one chat hook mounts at a time, so onUpdate ⟺ this is the foreground chat.
  // If a hook ever mounts for a non-visible project (prefetch/split view), it'd
  // be treated as witnessed and never flagged — revisit then.
  if (s.onUpdate) return;
  // Still running or paused on a live clarification — not terminal yet.
  if (s.state.isStreaming || s.state.pendingClarification) return;
  // Both agentError and authError (expired/invalid token) are failures. authError
  // clears streaming without didFinalize, so it'd otherwise slip through unflagged.
  if (s.state.pendingReplay.agentError || s.state.pendingReplay.authError) {
    markUnread(s.projectId, "error");
  } else if (s.state.didFinalize) {
    markUnread(s.projectId, "complete");
  }
};

export const notify = (s: ChatSession): void => {
  s.onUpdate?.();
  updateStreamingMembership(
    s.projectId,
    s.state.isStreaming && !s.state.didFinalize,
  );
  syncUnread(s);
  refreshIdleTeardown(s);
};

export const clearStreamingState = (s: ChatSession): void => {
  s.state.isStreaming = false;
  s.state.progressSteps = [];
  s.state.pendingClarification = null;
  s.state.statusMessage = null;
  s.state.bannerArmedAt = null;
  s.state.notifyOnDone = false;
};

export const beginTurn = (s: ChatSession): void => {
  // New turn wins: drop any lingering complete/error dot for this project.
  markSeen(s.projectId);
  s.state.textAccum = "";
  s.state.streamingDelta = "";
  s.state.progressSteps = [];
  s.state.isStreaming = true;
  s.state.bannerArmedAt = Date.now();
  s.state.notifyOnDone = false;
};

export const fireDoneNotification = (t: Translator): void => {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new Notification("Scavenger", {
      body: t("chat.notificationBody"),
      icon: "/favicon.ico",
    });
  } catch {
    // OS may refuse (Do Not Disturb, etc.)
  }
};

export const finalize = (
  s: ChatSession,
  conversationId: string,
  interrupted: boolean,
): void => {
  // Flush any unflushed streaming delta into textAccum
  if (s.state.streamingDelta) {
    if (s.state.textAccum && !s.state.textAccum.endsWith("\n")) {
      s.state.textAccum += "\n\n";
    }
    s.state.textAccum += s.state.streamingDelta;
    s.state.streamingDelta = "";
  }

  const finalText = s.state.textAccum;
  // On interrupt, any "calling" step never gets its completion event; flip to cancelled
  const finalSteps = interrupted
    ? s.state.progressSteps.map((step) =>
        step.status === "calling"
          ? { ...step, status: "cancelled" as const }
          : step,
      )
    : s.state.progressSteps;

  // Capture finalize payload BEFORE clearing state so React drain has it.
  s.state.pendingReplay.finalize = {
    text: finalText,
    steps: finalSteps,
    conversationId,
    interrupted,
  };

  // Auto-name check: snapshot the project name captured at send time.
  // The hook drains this flag and calls onFirstResponseEnded with the name.
  if (s.currentProjectName && isDefaultProjectName(s.currentProjectName)) {
    s.state.pendingReplay.autoName = { expectedName: s.currentProjectName };
  }

  // Fire desktop notification if user opted in for this run. This works
  // whether or not a component is currently mounted — Notification API is
  // global and i18next `t` survives component unmount.
  if (s.state.notifyOnDone) {
    fireDoneNotification(s.t);
  }

  s.state.didFinalize = true;
  s.state.textAccum = "";
  clearStreamingState(s);
  notify(s);
};

export { cancelIdleTeardown };
