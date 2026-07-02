"use client";

// The auth gate: reads gate state from <WebComponentAuthProvider> and decides what
// the user sees. While unauthenticated it renders the loading / login / origin-blocked
// / error panels; once authenticated it steps aside and renders its children (the
// chat subtree), so the chat only ever mounts with a live token in AxiosContext.

import { useAuthGate } from "./WebComponentAuthProvider";
import { Centered, LoadingView, ErrorView } from "./views";

type Props = Readonly<{
  // Heading on the login panel — the resolved widgetTitle, passed by WidgetRoot.
  title?: string;
  children: React.ReactNode;
}>;

export const AuthGate = ({ title, children }: Props) => {
  const { view, login } = useAuthGate();

  if (view.kind === "authenticated") return <>{children}</>;

  if (view.kind === "loading") {
    return <LoadingView msg={view.msg} />;
  }

  if (view.kind === "login") {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg font-semibold text-slate-800">
            {title || "Scavenger Chat"}
          </div>
          <button
            type="button"
            onClick={login}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Log in to start chatting
          </button>
        </div>
      </Centered>
    );
  }

  if (view.kind === "origin_blocked") {
    return (
      <Centered>
        <div className="max-w-md text-sm text-red-700">
          <div className="mb-1 font-semibold">Auth0 origin blocked</div>
          <p className="text-slate-600">
            This demo origin ({globalThis.location?.origin}) is not in the Auth0
            applications <em>Allowed Web Origins / Callback URLs</em>. Add it in
            the Auth0 dashboard, then reload.
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-left text-xs text-slate-400">
            {view.error}
          </pre>
        </div>
      </Centered>
    );
  }

  // view.kind === "error"
  return <ErrorView error={view.error} />;
};
