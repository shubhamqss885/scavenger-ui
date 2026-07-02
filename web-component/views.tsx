"use client";

// Shared presentational primitives for the web component's gate, boot, and chat
// states. Centralized here so AuthGate, ChatBoot, and WidgetRoot render identical
// loading/error panels instead of re-inlining the markup.

import React from "react";
import { Icon } from "@/components/ui/icon";

export const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full items-center justify-center bg-white p-6 text-center">
    {children}
  </div>
);

// Centered loading spinner — the auth probe, the workspace boot, and the chat's
// lazy-load fallback all show this. Colored with the primary token (so it tracks
// the customer's accent-color branding); `msg` is kept for screen readers.
export const LoadingView = ({ msg }: { msg: string }) => (
  <Centered>
    <Icon name="Loader2" variant="primary" size="lg" className="animate-spin" />
    <span className="sr-only">{msg}</span>
  </Centered>
);

// Centered error panel: bold title + the raw message. Used for auth errors, boot
// failures, and render errors (ChatErrorBoundary).
export const ErrorView = ({
  title = "Something went wrong",
  error,
}: {
  title?: string;
  error: string;
}) => (
  <Centered>
    <div className="max-w-md text-sm text-red-700">
      <div className="mb-1 font-semibold">{title}</div>
      <pre className="whitespace-pre-wrap text-left text-xs text-slate-500">
        {error}
      </pre>
    </div>
  </Centered>
);

export class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };

  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  render() {
    if (this.state.error) {
      return <ErrorView title="Chat render error" error={this.state.error} />;
    }
    return this.props.children;
  }
}
