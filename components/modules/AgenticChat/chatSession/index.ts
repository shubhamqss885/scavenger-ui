import { PendingClarification, getWsUrl } from "../types";
import { ChatSession, SendContext, sessions } from "./types";
import {
  beginTurn,
  cancelIdleTeardown,
  clearStreamingState,
  finalize,
  fireDoneNotification,
  getOrCreate,
  notify,
  refreshIdleTeardown,
  teardownSession,
} from "./lifecycle";
import { getStreamingIds, subscribeStreamingIds } from "./streaming";
import { getUnreadStatus, markSeen, subscribeUnread } from "./unread";
import { handleWsMessage } from "./wsHandlers";

const restorePendingClarification = (
  projectId: string,
  clarification: PendingClarification,
): PendingClarification => {
  const s = getOrCreate(projectId);
  const hasLiveSocket =
    typeof WebSocket !== "undefined" && s.socket?.readyState === WebSocket.OPEN;

  if (hasLiveSocket && s.state.pendingClarification) {
    return s.state.pendingClarification;
  }

  s.state.pendingClarification = clarification;
  notify(s);
  return clarification;
};

// --- Public API ---

export const chatSessionStore = {
  get: (projectId: string): ChatSession | undefined => sessions.get(projectId),

  getOrCreate,

  fireDoneNotification,

  getLivePendingClarification: (
    projectId: string,
  ): PendingClarification | null => {
    const s = sessions.get(projectId);

    if (!s?.state.pendingClarification) return null;
    if (typeof WebSocket === "undefined") return null;
    // OPEN-only: CLOSING cannot accept an answer, and CONNECTING cannot have
    // pendingClarification because it is only set from onmessage.
    if (s.socket?.readyState !== WebSocket.OPEN) return null;
    return s.state.pendingClarification;
  },

  clearPendingClarification: (projectId: string): void => {
    const s = sessions.get(projectId);

    if (!s?.state.pendingClarification) return;
    s.state.pendingClarification = null;
    notify(s);
  },

  restorePendingClarification,

  // Re-run the normal subscriber path when reducer-owned state changes outside
  // a WS tick (e.g. history load settles and history-gated replays can drain).
  pingDrain: (projectId: string): void => {
    const s = sessions.get(projectId);

    if (s) notify(s);
  },

  // Subscribe to mutations. Returns a detach function. The hook MUST call
  // attach BEFORE reading the snapshot to avoid missing an event that fires
  // between read and subscribe.
  attach: (
    projectId: string,
    onUpdate: () => void,
    t: SendContext["t"],
  ): (() => void) => {
    const s = getOrCreate(projectId);

    s.onUpdate = onUpdate;
    s.t = t;
    return () => {
      if (s.onUpdate === onUpdate) {
        s.onUpdate = null;
        refreshIdleTeardown(s);
      }
    };
  },

  // --- Send ---
  // Open a fresh socket and send the query. Closes any existing socket first
  // (intentional interrupt of any lingering connection from a completed run).
  send: (projectId: string, query: string, ctx: SendContext): boolean => {
    const s = getOrCreate(projectId);

    if (s.state.isStreaming && !s.state.didFinalize) {
      return false;
    }

    // Guard against discarding an un-drained finalize. The previous turn
    // finalized (e.g. ws.onclose) but the hook hasn't yet drained
    // pendingReplay.finalize into the reducer — only reachable while history
    // is still loading, which gates that drain (syncFromSnapshot returns at
    // the isLoadingHistory check before reaching finalize). The reset below
    // (`pendingReplay = {}`) would silently drop the previous turn's final
    // text. Reject the send so the queued finalize drains first; the hook
    // keeps the user's query (it bails before setInput("") on a false return),
    // so a resend after history settles succeeds. The slot is deleted right
    // after a normal drain, so this never blocks a steady-state send.
    if (s.state.pendingReplay.finalize) {
      return false;
    }

    s.t = ctx.t;
    s.currentProjectName = ctx.currentProjectName;
    // `displayedText` is the user-facing text; may be undefined (e.g.
    // clarification fallback) in which case no user bubble is synthesized
    // on remount.
    s.displayedUserMessage = ctx.displayedText;

    // Close any existing socket before opening a new one. The previous run
    // already completed (caller guards on isStreaming), so its state is clean.
    if (s.socket) {
      try {
        s.socket.close();
      } catch {
        // ignore
      }
    }

    // Reset session state for the new run.
    beginTurn(s);
    s.state.didFinalize = false;
    s.state.pendingClarification = null;
    s.state.statusMessage = null;
    s.state.pendingReplay = {};
    notify(s);

    // The constructor can throw synchronously (invalid WS_URL, mixed-content
    // block). beginTurn already set isStreaming=true above — without this
    // catch, the `isStreaming && !didFinalize` guard would block every future
    // send for this project. displayedUserMessage is already set, so the
    // drain synthesizes the user bubble + error via ENSURE_INFLIGHT_TAIL.
    let ws: WebSocket;

    try {
      ws = new WebSocket(getWsUrl());
    } catch {
      s.socket = null;
      s.state.pendingReplay.agentError = {
        error: ctx.t("errors.networkLost", { ns: "common" }),
        guardEmpty: true,
      };
      clearStreamingState(s);
      notify(s);
      return false;
    }

    s.socket = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          auth_token: ctx.token,
          project_id: projectId,
          provider: ctx.provider,
          query,
          web_search_enabled: ctx.webSearchEnabled ?? false,
          has_files: ctx.hasFiles ?? false,
        }),
      );
    };

    ws.onmessage = (event) => handleWsMessage(s, event);

    ws.onerror = () => {
      // Ignore events from a superseded socket. The previous run's WS may
      // still be closing when a new send() replaces s.socket; without this
      // guard, the stale handler would clobber the new run's state.
      if (s.socket !== ws) return;
      s.state.isStreaming = false;
      s.state.bannerArmedAt = null;
      s.state.notifyOnDone = false;
      // Intentionally leave didFinalize=false: the send() guard is
      // `isStreaming && !didFinalize`, and we just cleared isStreaming, so the
      // next send is permitted while this turn still truthfully reads as failed.
      // ??=: the slot is single-occupancy and may already hold a classified BE
      // error (wsHandlers) that hasn't drained yet — keep the specific one.
      s.state.pendingReplay.agentError ??= {
        error: ctx.t("errors.networkLost", { ns: "common" }),
        guardEmpty: true,
      };
      notify(s);
    };

    ws.onclose = () => {
      // Ignore events from a superseded socket (see onerror above).
      if (s.socket !== ws) return;
      s.socket = null;
      // BE may drop the connection mid-response without sending response_ended.
      // If there's accumulated content, finalize with empty conversationId so
      // the user still sees whatever streamed through.
      if (s.state.textAccum || s.state.streamingDelta) {
        finalize(s, "", false);
      } else if (s.state.isStreaming) {
        // ??=: a classified BE error (wsHandlers) may be queued un-drained —
        // the BE often closes right after sending it, and this close event can
        // run before the rAF drain. Don't clobber it with the generic message.
        s.state.pendingReplay.agentError ??= {
          error: ctx.t("errors.networkLost", { ns: "common" }),
          guardEmpty: true,
        };
        clearStreamingState(s);
        notify(s);
      }
      refreshIdleTeardown(s);
    };
    return true;
  },

  // Send a clarification answer on the existing socket. No-op if socket is
  // closed (session timed out while detached). Returns true if sent.
  // `displayedAnswer` is the raw text shown to the user (without the
  // "Response of Clarification..." wrapper); stored on the session so
  // remount can rehydrate the user bubble.
  sendClarificationAnswer: (
    projectId: string,
    formattedAnswer: string,
    displayedAnswer: string,
  ): boolean => {
    const s = sessions.get(projectId);

    if (!s?.socket || s.socket.readyState !== WebSocket.OPEN) return false;
    cancelIdleTeardown(s);
    s.socket.send(JSON.stringify({ answer: formattedAnswer }));
    s.displayedUserMessage = displayedAnswer;
    beginTurn(s);
    s.state.pendingClarification = null;
    notify(s);
    return true;
  },

  stop: (projectId: string, ctx: { token: string }): void => {
    const s = sessions.get(projectId);

    if (!s?.socket) return;

    if (s.socket.readyState !== WebSocket.OPEN) {
      if (s.state.isStreaming) {
        try {
          s.socket.close();
        } catch {
          // ignore
        }
      }
      return;
    }
    s.socket.send(
      JSON.stringify({
        type: "stop_agent",
        auth_token: ctx.token,
        project_id: projectId,
      }),
    );
  },

  compact: (
    projectId: string,
    preserveRecent: number,
    ctx: { token: string },
  ): void => {
    const s = sessions.get(projectId);

    if (!s?.socket || s.socket.readyState !== WebSocket.OPEN) return;
    s.socket.send(
      JSON.stringify({
        type: "compact_conversation",
        preserve_recent: preserveRecent,
        auth_token: ctx.token,
        project_id: projectId,
      }),
    );
  },

  setNotifyOnDone: (projectId: string, value: boolean): void => {
    const s = sessions.get(projectId);

    if (!s) return;
    s.state.notifyOnDone = value;
    notify(s);
  },

  teardown: (projectId: string): void => {
    teardownSession(projectId);
  },

  // Subscribe to the streaming-projects set. Fires only when membership
  // actually changes (start/end of a turn), NOT on every WS event.
  subscribeStreamingIds,

  // Returns the live, referentially-stable streaming-projects set.
  // Safe to pass as `getSnapshot` to `useSyncExternalStore` — the reference
  // only changes when membership changes.
  getStreamingIds,

  // Mark a project's chat read (called when its chat view mounts). The
  // "witnessed" rule is derived from the attached hook in lifecycle's syncUnread.
  markSeen,

  // Subscribe to / read the per-project unseen-terminal-result map.
  subscribeUnread,
  getUnreadStatus,

  teardownAll: (): void => {
    for (const projectId of Array.from(sessions.keys())) {
      chatSessionStore.teardown(projectId);
    }
  },
};

export {
  NOTIFY_BANNER_THRESHOLD_MS,
  NOTIFY_BANNER_CONFIRM_LINGER_MS,
} from "./types";

export type { PendingReplay, ChatSessionState } from "./types";

export { useStreamingProjectIds } from "./streaming";

export { useProjectUnreadStatus } from "./unread";

export type { UnreadKind } from "./unread";
