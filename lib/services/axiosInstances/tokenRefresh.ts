import type { LogoutReason } from "./logoutReasonTypes";

// Module-private state
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let forceLogoutInProgress = false;

// Callbacks registered by React (AuthContext)
let onTokenRefreshed: ((token: string) => void) | null = null;
let onForceLogout: ((reason: LogoutReason) => void) | null = null;

// Register callback to update React state when token refreshes, called by AuthContext on mount
export const setTokenRefreshCallback = (callback: (token: string) => void) => {
  onTokenRefreshed = callback;
};

// Register callback to show force logout modal, called by AuthContext on mount
export const setForceLogoutCallback = (
  callback: (reason: LogoutReason) => void,
) => {
  onForceLogout = callback;
};

// Reset all module state, called by createAxiosInstance on fresh login
// to prevent stale callbacks after Fast Refresh or re-login
export const resetTokenRefreshState = () => {
  isRefreshing = false;
  refreshPromise = null;
  forceLogoutInProgress = false;
};

// Trigger force logout via React callback, deduplicates so only one modal shows
// even if multiple 401s fire concurrently
export const triggerForceLogout = (reason: LogoutReason) => {
  if (forceLogoutInProgress) return;
  forceLogoutInProgress = true;

  if (onForceLogout) {
    onForceLogout(reason);
  } else {
    // Fallback if React hasn't registered a callback yet
    globalThis.location.href = "/api/auth/logout";
  }
};

// Refresh access token via /api/auth/token, deduplicates concurrent calls —
// multiple 401s trigger only ONE refresh. Returns fresh token or throws typed error.
export const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/token", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.logout) {
        throw new Error(
          data.reason === "refresh_expired"
            ? "REFRESH_TOKEN_EXPIRED"
            : "SESSION_EXPIRED",
        );
      }

      if (data.unverified) {
        throw new Error("EMAIL_UNVERIFIED");
      }

      if (data.retry) {
        throw new Error("NETWORK_ERROR");
      }

      if (data.accessToken) {
        if (onTokenRefreshed) {
          onTokenRefreshed(data.accessToken);
        }
        return data.accessToken;
      }

      throw new Error("NO_TOKEN_RECEIVED");
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Refresh token, trigger force logout on session-ending failure.
// Centralizes the refresh-or-logout decision so callers don't duplicate it.
export const refreshOrForceLogout = async (): Promise<string> => {
  try {
    return await refreshAccessToken();
  } catch (error: any) {
    if (error.message !== "NETWORK_ERROR") {
      triggerForceLogout(
        error.message === "REFRESH_TOKEN_EXPIRED"
          ? "session_inactive"
          : "unknown",
      );
    }
    throw error;
  }
};

export const isTokenRefreshInProgress = () => isRefreshing;
