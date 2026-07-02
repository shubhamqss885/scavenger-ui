import { useSyncExternalStore } from "react";

// Live snapshot of which projects are currently streaming. Read by the sidebar
// indicator via `useSyncExternalStore`. INVARIANT: the only path that swaps
// this reference is `updateStreamingMembership`, which early-returns when
// membership is unchanged. Don't reassign this from anywhere else — every
// reassignment triggers re-renders of every subscriber.
let streamingIds: ReadonlySet<string> = new Set();
const streamingListeners = new Set<() => void>();

export const updateStreamingMembership = (
  projectId: string,
  shouldBeStreaming: boolean,
): void => {
  const was = streamingIds.has(projectId);

  if (shouldBeStreaming === was) return;
  const next = new Set(streamingIds);

  if (shouldBeStreaming) next.add(projectId);
  else next.delete(projectId);
  streamingIds = next;
  for (const fn of Array.from(streamingListeners)) fn();
};

// Subscribe to the streaming-projects set. Fires only when membership
// actually changes (start/end of a turn), NOT on every WS event.
export const subscribeStreamingIds = (listener: () => void): (() => void) => {
  streamingListeners.add(listener);
  return () => {
    streamingListeners.delete(listener);
  };
};

// Returns the live, referentially-stable streaming-projects set.
// Safe to pass as `getSnapshot` to `useSyncExternalStore` — the reference
// only changes when membership changes.
export const getStreamingIds = (): ReadonlySet<string> => streamingIds;

/**
 * Returns the set of project IDs that currently have an in-flight agentic
 * chat run. Re-renders only when membership changes (turn start / turn end),
 * NOT on every WS event during streaming.
 */
export const useStreamingProjectIds = (): ReadonlySet<string> =>
  useSyncExternalStore(subscribeStreamingIds, getStreamingIds, getStreamingIds);
