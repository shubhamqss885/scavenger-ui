import { useSyncExternalStore } from "react";
import { tryParseJSON } from "../utils";

// Sidebar "unread" dot for parallel chat runs that finished while the user
// wasn't looking. Mirrors `streaming.ts` (referentially-stable snapshot via
// `useSyncExternalStore`), but backed by sessionStorage so the dot survives a
// reload and outlives an idle-torn-down session — this map, not `sessions`, is
// the source of truth.

export type UnreadKind = "complete" | "error";

const STORAGE_KEY = "agentic_unread_sessions";

const hydrate = (): ReadonlyMap<string, UnreadKind> => {
  const map = new Map<string, UnreadKind>();

  if (typeof globalThis.window === "undefined") return map;
  let parsed: Record<string, unknown> | null = null;

  try {
    const raw = globalThis.sessionStorage.getItem(STORAGE_KEY);

    parsed = raw ? tryParseJSON(raw) : null;
  } catch {
    // sessionStorage may be unavailable (private mode) — start empty.
  }
  if (parsed) {
    for (const [id, kind] of Object.entries(parsed)) {
      if (kind === "complete" || kind === "error") map.set(id, kind);
    }
  }
  return map;
};

// INVARIANT: only `commit` reassigns this, and every reassignment re-renders
// all subscribers — so callers early-return when membership is unchanged.
let unread: ReadonlyMap<string, UnreadKind> = hydrate();
const listeners = new Set<() => void>();

const persist = (): void => {
  if (typeof globalThis.window === "undefined") return;
  try {
    globalThis.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(unread)),
    );
  } catch {
    // sessionStorage unavailable (private mode/quota) — dot won't survive reload.
  }
};

const commit = (next: ReadonlyMap<string, UnreadKind>): void => {
  unread = next;
  persist();
  for (const fn of Array.from(listeners)) fn();
};

// Flag an unseen terminal result. No-op if unchanged. The "witnessed" rule
// (skip the chat you're viewing) is enforced upstream in `syncUnread`.
export const markUnread = (projectId: string, kind: UnreadKind): void => {
  if (unread.get(projectId) === kind) return;
  const next = new Map(unread);

  next.set(projectId, kind);
  commit(next);
};

// Clear a project's unread flag (the user opened/read it, or a new turn began).
export const markSeen = (projectId: string): void => {
  if (!unread.has(projectId)) return;
  const next = new Map(unread);

  next.delete(projectId);
  commit(next);
};

export const subscribeUnread = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getUnreadStatus = (): ReadonlyMap<string, UnreadKind> => unread;

// Stable empty snapshot for SSR/hydration: the client hydrates `unread` from
// sessionStorage, which the server can't see, so serving it would mismatch.
// getSnapshot picks up the real map right after hydration.
const EMPTY_STATUS: ReadonlyMap<string, UnreadKind> = new Map();
const getServerUnreadStatus = (): ReadonlyMap<string, UnreadKind> =>
  EMPTY_STATUS;

/**
 * Per-project map of unseen terminal chat results (`"complete"` | `"error"`).
 * Re-renders only when membership changes, NOT on every WS event.
 */
export const useProjectUnreadStatus = (): ReadonlyMap<string, UnreadKind> =>
  useSyncExternalStore(subscribeUnread, getUnreadStatus, getServerUnreadStatus);
