"use client";

// TEMPORARY STUB — Milestone B: wire real 401-refresh into this context. The
// token comes from web-component/auth.ts via auth0-spa-js; the refresh/force-logout
// plumbing of the real AuthContext is still missing. Delete this file when done.
//
// The real context calls /api/auth/token (doesn't exist in a standalone web component).
// We only need the CONTEXT OBJECT here — web-component/index.tsx is the real provider,
// feeding the token after login. Default is the not-yet-authenticated state.
import { createContext, type ContextType } from "react";

type RealAuthModule = typeof import("@/lib/context/AuthContext");
// Real module doesn't export its value type — lifted off the exported context
// object so drift in the real shape is a compile error.
type AxiosContextValue = ContextType<RealAuthModule["AxiosContext"]>;

export const AxiosContext = createContext<AxiosContextValue>({
  authStatus: "initializing",
  token: null,
  isLoading: true,
  refreshSession: async () => {},
});

export const AxiosProvider: RealAuthModule["AxiosProvider"] = ({
  children,
}) => <>{children}</>;
