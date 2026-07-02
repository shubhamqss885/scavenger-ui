"use client";

// WEB-COMPONENT ADAPTER — permanent policy: the widget has no Next router. This
// tiny in-element router lets imported app-shell code (the sidebar rows, which
// render `next-view-transitions` Links) drive navigation as STATE changes rather
// than URL changes — a custom element must never hijack the host page's URL.
//
// The `next-view-transitions` shim (adapters/next-view-transitions.tsx) reads
// this context: a Link click calls `navigate(href)`, which WidgetRoot maps to
// "switch the active project".

import { createContext, useContext } from "react";

export type WidgetRouter = {
  navigate: (href: string) => void;
};

const DEFAULT: WidgetRouter = { navigate: () => {} };

export const WidgetRouterContext = createContext<WidgetRouter>(DEFAULT);

export const useWidgetRouter = (): WidgetRouter =>
  useContext(WidgetRouterContext);

// Extracts the project id from a chat link href, e.g.
// "/project/abc-123/agent" or "/project/abc-123" → "abc-123". Returns null for
// hrefs the widget doesn't handle (so navigate can no-op on them).
export const projectIdFromHref = (href: string): string | null => {
  const match = /^\/project\/([^/?#]+)/.exec(href);
  return match ? match[1] : null;
};
