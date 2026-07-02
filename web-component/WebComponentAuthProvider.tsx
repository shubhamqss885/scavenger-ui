"use client";

// Auth provider for the <scavenger-chat> web component — PURE state + context, no
// UI. Owns the auth0 state machine (silent probe → login popup → authenticated,
// plus origin_blocked + error) and exposes it through two contexts:
//   • the app's AxiosContext — live token + a REAL refreshSession (getTokenSilently),
//     replacing the Milestone B no-op,
//   • an internal AuthGateContext — the view kind + a login action that drives <AuthGate>.
//
// Renders children UNCONDITIONALLY; <AuthGate> is what withholds the chat subtree
// until authenticated. Mirrors the app: the provider supplies auth state, consumers
// decide what to render for it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AxiosContext } from "@/lib/context/AuthContext";
import { getToken, initAuth0, loginWithPopup, probeSilentAuth } from "./auth";
import type { WidgetConfig } from "./config";

// The gate's view state. The token lives in AxiosContext, not here — the gate only
// needs to know WHICH panel to show (or to step aside for the chat).
export type AuthView =
  | { kind: "loading"; msg: string }
  | { kind: "login" }
  | { kind: "origin_blocked"; error: string }
  | { kind: "error"; error: string }
  | { kind: "authenticated" };

type AuthGateContextValue = Readonly<{
  view: AuthView;
  login: () => void;
}>;

const AuthGateContext = createContext<AuthGateContextValue>({
  view: { kind: "loading", msg: "Starting…" },
  login: () => {},
});

export const useAuthGate = () => useContext(AuthGateContext);

type Props = Readonly<{
  config: WidgetConfig;
  children: React.ReactNode;
}>;

export const WebComponentAuthProvider = ({ config, children }: Props) => {
  const [view, setView] = useState<AuthView>({
    kind: "loading",
    msg: "Starting…",
  });
  const [token, setToken] = useState<string | null>(null);

  // Real refreshSession: getTokenSilently → update the token already in AxiosContext,
  // without touching the gate view. Consumers (e.g. the 401 interceptor) call this
  // instead of the dead /api/auth/refresh-session route.
  const refreshSession = useCallback(async () => {
    setToken(await getToken());
  }, []);

  useEffect(() => {
    if (!config.auth0Domain || !config.auth0ClientId) {
      setView({
        kind: "error",
        error:
          "Missing auth0-domain / auth0-client-id (set them as attributes on <scavenger-chat>).",
      });
      return;
    }
    initAuth0(config.auth0Domain, config.auth0ClientId, config.auth0Audience);
    // Early origin-allowlist probe — silent, no popup.
    void probeSilentAuth().then((res) => {
      if (res.state === "authenticated") {
        setToken(res.token);
        return setView({ kind: "authenticated" });
      }
      if (res.state === "login_required") return setView({ kind: "login" });
      if (res.state === "origin_blocked")
        return setView({ kind: "origin_blocked", error: res.error });
      return setView({ kind: "login" }); // unknown silent failure → let user try the popup
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    setView({ kind: "loading", msg: "Opening login…" });
    try {
      await loginWithPopup();
      setToken(await getToken());
      setView({ kind: "authenticated" });
    } catch (err) {
      const e = err as { error?: string; message?: string };
      const msg = `${e?.error ? e.error + ": " : ""}${e?.message ?? String(err)}`;

      if (/origin|cors|web origin|not allowed/i.test(msg)) {
        setView({ kind: "origin_blocked", error: msg });
      } else {
        setView({ kind: "login" });
        console.warn("[web-component] login failed:", msg);
      }
    }
  }, []);

  // Live AxiosContext value derived from the state machine. New object on token /
  // status change so consumers re-render (mirrors the real AuthProvider's useMemo).
  const axiosValue = useMemo(
    () => ({
      authStatus:
        view.kind === "authenticated"
          ? ("ready" as const)
          : ("initializing" as const),
      token,
      isLoading: view.kind === "loading",
      refreshSession,
    }),
    [view.kind, token, refreshSession],
  );

  const gateValue = useMemo(() => ({ view, login }), [view, login]);

  return (
    <AxiosContext.Provider value={axiosValue}>
      <AuthGateContext.Provider value={gateValue}>
        {children}
      </AuthGateContext.Provider>
    </AxiosContext.Provider>
  );
};
