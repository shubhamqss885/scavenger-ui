"use client";

// Root React component for the <scavenger-chat> web component (the App.tsx role):
// resolves config, builds the provider tree, and delegates auth + boot to children.
// Registered as a custom element in index.tsx.
//
// Shadow DOM — the compiled Tailwind is adopted into the shadow root by index.tsx
// (see shadow-styles.ts), not imported here. r2wc passes the shadow root as the
// `container` prop; we publish it through PortalContainerContext so the shadcn
// primitives (dialog/sheet/popover/tooltip/dropdown/alert-dialog) portal their
// floating content INTO the styled shadow tree instead of escaping to document.body.

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  PortalContainerProvider,
  type PortalContainer,
} from "@/lib/portal/PortalContainer";
import {
  resolveConfig,
  applyWidgetPublicEnv,
  type WidgetProps,
  type WidgetConfig,
} from "./config";
import { WebComponentAuthProvider } from "./WebComponentAuthProvider";
import { AuthGate } from "./AuthGate";
import { ChatBoot } from "./ChatBoot";
import { ChatErrorBoundary, LoadingView } from "./views";

const queryClient = new QueryClient();

// Branding → CSS variables on the shadow :host. Inline style wins over the adopted
// sheet's :host defaults and is per-element, so each <scavenger-chat> can be themed
// independently. accentColor is shadcn's --primary token (HSL channels "H S% L%"),
// passed straight through; fontScale uses zoom because the chat's text is rem-based
// (tied to the document root, even in a shadow tree) and so can't be scaled by a
// :host font-size.
const applyHostBranding = (host: HTMLElement, c: WidgetConfig) => {
  if (c.fontFamily) host.style.setProperty("--font-sans", c.fontFamily);
  if (c.borderRadius) host.style.setProperty("--radius", c.borderRadius);
  if (c.accentColor) {
    host.style.setProperty("--primary", c.accentColor);
    host.style.setProperty("--ring", c.accentColor);
  }
  if (c.fontScale) host.style.setProperty("zoom", c.fontScale);
};

// r2wc injects `container` (the shadow root) alongside the declared string props.
type WidgetRootProps = WidgetProps & { container?: PortalContainer };

const WidgetRoot = (props: WidgetRootProps) => {
  const config = resolveConfig(props);
  // Feed the prop URLs into the widget's process.env BEFORE any child (auth → boot
  // → chat WS) reads them. Synchronous, in render — not an effect — so it runs
  // ahead of the first child render.
  applyWidgetPublicEnv(config);
  const portalContainer = props.container ?? null;

  React.useEffect(() => {
    if (portalContainer instanceof ShadowRoot) {
      applyHostBranding(portalContainer.host as HTMLElement, config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    portalContainer,
    config.fontFamily,
    config.accentColor,
    config.borderRadius,
    config.fontScale,
  ]);

  return (
    <PortalContainerProvider value={portalContainer}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider>
            <WebComponentAuthProvider config={config}>
              <AuthGate title={config.widgetTitle}>
                <ChatErrorBoundary>
                  <React.Suspense
                    fallback={<LoadingView msg="Loading chat…" />}
                  >
                    <ChatBoot />
                  </React.Suspense>
                </ChatErrorBoundary>
              </AuthGate>
            </WebComponentAuthProvider>
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </PortalContainerProvider>
  );
};

export default WidgetRoot;
