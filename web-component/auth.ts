// Milestone A — client-side auth.
//
// Ported from the Stencil web-component: @auth0/auth0-spa-js with loginWithPopup +
// getTokenSilently, localStorage cache, refresh tokens. Replaces the app's
// server-side /api/auth/token route, which doesn't exist in a standalone web component.

import { Auth0Client } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client | null = null;

export const initAuth0 = (
  domain: string,
  clientId: string,
  audience: string,
): Auth0Client => {
  auth0Client = new Auth0Client({
    domain,
    clientId,
    authorizationParams: {
      audience,
      redirect_uri: globalThis.location.origin,
    },
    cacheLocation: "localstorage",
    useRefreshTokens: true,
    useRefreshTokensFallback: true,
  });
  return auth0Client;
};

export const getToken = (): Promise<string> => {
  if (!auth0Client) throw new Error("Auth0 not initialized");
  return auth0Client.getTokenSilently();
};

// Auth0 id-token claims for the symmetric UserDataContext adapter's `auth0User`
// (the app sources this from @auth0/nextjs-auth0's useUser; here it's spa-js).
export const getUser = (): Promise<Record<string, unknown> | undefined> => {
  if (!auth0Client) throw new Error("Auth0 not initialized");
  return auth0Client.getUser();
};

export const loginWithPopup = (): Promise<void> => {
  if (!auth0Client) throw new Error("Auth0 not initialized");
  return auth0Client.loginWithPopup();
};

export const logout = (): Promise<void> => {
  if (!auth0Client) throw new Error("Auth0 not initialized");
  return auth0Client.logout({
    logoutParams: {
      returnTo: globalThis.location.origin + globalThis.location.pathname,
    },
  });
};

// Distinguishes the origin-allowlist risk from a benign "no session yet".
// getTokenSilently throws `login_required` when the user isn't logged in (origin
// IS allowed); throws a CORS/origin error when the origin is NOT in Auth0
// "Allowed Web Origins".
export type SilentProbe =
  | { state: "authenticated"; token: string }
  | { state: "login_required" }
  | { state: "origin_blocked"; error: string }
  | { state: "error"; error: string };

export const probeSilentAuth = async (): Promise<SilentProbe> => {
  if (!auth0Client) return { state: "error", error: "Auth0 not initialized" };
  try {
    // Cap the silent iframe: a blocked origin (403 /authorize, no web_message
    // post-back) surfaces in ~8s instead of hanging on auth0's 60s default.
    const token = await auth0Client.getTokenSilently({ timeoutInSeconds: 8 });
    return { state: "authenticated", token };
  } catch (err: unknown) {
    const e = err as { error?: string; message?: string };
    const code = e?.error ?? "";
    const msg = e?.message ?? String(err);

    if (code === "login_required" || code === "consent_required") {
      return { state: "login_required" };
    }
    // auth0-spa-js surfaces origin/web-origin problems here.
    if (/origin|cors|web origin|not allowed/i.test(msg)) {
      return { state: "origin_blocked", error: msg };
    }
    return { state: "error", error: `${code ? code + ": " : ""}${msg}` };
  }
};
