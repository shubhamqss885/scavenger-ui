"use client";

import {
  createContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { createAxiosInstance } from "@/lib/services/axiosInstances";
import {
  setTokenRefreshCallback,
  setForceLogoutCallback,
} from "@/lib/services/axiosInstances/tokenRefresh";
import { useTranslation } from "@/lib/i18n/client";
import type { LogoutReason } from "@/lib/services/axiosInstances/logoutReasonTypes";
import ForceLogoutModal from "@/components/blocks/ForceLogoutModal";

type AxiosContextProps = {
  children: React.ReactNode;
};

type AuthStatus = "initializing" | "email_unverified" | "ready";

type AxiosContextValue = {
  authStatus: AuthStatus;
  token: string | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
};

export const AxiosContext = createContext<AxiosContextValue>({
  authStatus: "initializing",
  token: null,
  isLoading: true,
  refreshSession: async () => {},
});

export const AxiosProvider = ({ children }: AxiosContextProps) => {
  const { t } = useTranslation("auth");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("initializing");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceLogoutReason, setForceLogoutReason] =
    useState<LogoutReason | null>(null);

  const initializeAxiosInstances = async () => {
    try {
      const response = await axios.get("/api/auth/token");

      if (response?.data?.logout) {
        window.location.href = "/api/auth/logout";
      } else if (response?.data?.unverified) {
        setAuthStatus("email_unverified");
      } else if (response?.data?.accessToken) {
        createAxiosInstance(response.data.accessToken);
        setToken(response.data.accessToken);

        // Registration is lazy now: UserDataContext calls registerUser() only if
        // the profile fetch reveals an unprovisioned (first-ever) user. This keeps
        // the ~1.7s register round-trip off every returning user's boot.
        setAuthStatus("ready");
      }
    } catch (error) {
      console.error("Failed to fetch access token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);

      // First call refresh-session API to update Auth0 session
      const refreshResponse = await axios.post("/api/auth/refresh-session");

      if (refreshResponse.data.email_verified) {
        // Then re-run the token check to update auth state
        await initializeAxiosInstances();
      }
    } catch (error: any) {
      console.error(
        "Error refreshing session:",
        error.response?.data?.error ?? "Failed to refresh session",
      );
      throw new Error(t("session.refreshFailed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "initializing") {
      initializeAxiosInstances();
    }
  }, []);

  // Register callbacks for token refresh module
  // The token and reason for logout gets set in the tokenRefresh.ts via callback below.
  useEffect(() => {
    setTokenRefreshCallback(setToken);
    setForceLogoutCallback((reason) => setForceLogoutReason(reason));
  }, []);

  const value = useMemo(
    () => ({
      authStatus,
      token,
      isLoading,
      refreshSession,
    }),
    [authStatus, token, isLoading, refreshSession],
  );

  return (
    <AxiosContext.Provider value={value}>
      {children}
      {!isLoading && forceLogoutReason && (
        <ForceLogoutModal reason={forceLogoutReason} />
      )}
    </AxiosContext.Provider>
  );
};
