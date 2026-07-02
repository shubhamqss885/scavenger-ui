"use client";

// Portal container seam
//
// Radix primitives (dialog, alert-dialog, sheet, popover, tooltip, dropdown-menu)
// portal their floating content to `document.body` by default. That is correct for
// the app, but breaks an isolated embed: the <scavenger-chat> web component styles a
// shadow root, and a portal that escapes to `document.body` lands outside it, unstyled.
//
// This context lets an embedding shell redirect those portals into its own root.
// In the app NO provider is mounted, so `usePortalContainer()` returns `null` and
// Radix falls back to `document.body` — byte-for-byte the current behavior. The web
// component wraps its tree in <PortalContainerProvider value={shadowRoot}> so portals
// render inside the styled tree instead.

import { createContext, useContext } from "react";

// Matches Radix `@radix-ui/react-portal`'s `container?: Element | DocumentFragment | null`.
// A ShadowRoot is a DocumentFragment; the custom element host is an Element.
export type PortalContainer = Element | DocumentFragment | null;

const PortalContainerContext = createContext<PortalContainer>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;

export const usePortalContainer = (): PortalContainer =>
  useContext(PortalContainerContext);
