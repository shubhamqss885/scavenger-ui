// TEMPORARY STUB — Milestone B: rewire token refresh to auth0-spa-js
// getTokenSilently end-to-end. This aliased copy (imported via the absolute
// "@/lib/services/axiosInstances/tokenRefresh" alias) bridges to auth0, but
// createAxiosInstance's 401-retry imports "./tokenRefresh" RELATIVELY —
// bypassing the alias — so a 401 mid-stream still calls the dead
// /api/auth/token route. Delete this file when done.
//
// Typed against the real module (type-only import) so drift is a compile error.
import { getToken } from "../auth";

type RealTokenRefreshModule =
  typeof import("@/lib/services/axiosInstances/tokenRefresh");

export const refreshOrForceLogout: RealTokenRefreshModule["refreshOrForceLogout"] =
  async () => getToken();

export const refreshAccessToken: RealTokenRefreshModule["refreshAccessToken"] =
  async () => getToken();

export const setTokenRefreshCallback: RealTokenRefreshModule["setTokenRefreshCallback"] =
  () => {};

export const setForceLogoutCallback: RealTokenRefreshModule["setForceLogoutCallback"] =
  () => {};

export const resetTokenRefreshState: RealTokenRefreshModule["resetTokenRefreshState"] =
  () => {};

export const triggerForceLogout: RealTokenRefreshModule["triggerForceLogout"] =
  () => {};

export const isTokenRefreshInProgress: RealTokenRefreshModule["isTokenRefreshInProgress"] =
  () => false;
