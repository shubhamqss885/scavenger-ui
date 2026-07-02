"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useUserContext } from "@/lib/context/UserDataContext";
import {
  AnalyticsContextType,
  AnalyticsProviderProps,
  ConsentState,
} from "./types";

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

const useAnalytics = () => {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }

  return context;
};

export function AnalyticsProvider({ children, gaId }: AnalyticsProviderProps) {
  const isPostHogInitialized = useRef(false);

  // CONSENT STATE
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
    functional: false,
    isLoaded: false,
  });

  const checkConsent = useCallback(() => {
    if (globalThis.window === undefined) return;

    // Method 1: Check CookieYes API if available
    const cookieYes = (globalThis as unknown as WindowWithCookieYes).CookieYes;

    if (cookieYes?.getCategories) {
      const categories = cookieYes.getCategories() || {};
      setConsent({
        analytics: categories.analytics === true,
        marketing: categories.marketing === true,
        functional: categories.functional === true,
        isLoaded: true,
      });

      return;
    }

    // Method 2: Parse CookieYes cookie directly
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cookieyes-consent="));

    if (cookieValue) {
      try {
        const value = decodeURIComponent(cookieValue.split("=")[1] || "");
        setConsent({
          analytics: value.includes("analytics:yes"),
          marketing: value.includes("marketing:yes"),
          functional: value.includes("functional:yes"),
          isLoaded: true,
        });
      } catch {
        // Malformed cookie - treat as no consent (GDPR safe)
        setConsent({
          analytics: false,
          marketing: false,
          functional: false,
          isLoaded: true,
        });
      }
    } else {
      // No consent given yet - default to false (GDPR compliant)
      setConsent({
        analytics: false,
        marketing: false,
        functional: false,
        isLoaded: true,
      });
    }
  }, []);

  // Listen for consent changes
  useEffect(() => {
    checkConsent();

    const handleConsentUpdate = () => {
      checkConsent();
    };

    document.addEventListener("cookieyes_consent_update", handleConsentUpdate);

    // Fallback: check periodically in case event doesn't fire
    const interval = setInterval(checkConsent, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      document.removeEventListener(
        "cookieyes_consent_update",
        handleConsentUpdate,
      );
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkConsent]);

  // POSTHOG INITIALIZATION
  useEffect(() => {
    if (globalThis.window === undefined) return;
    if (!consent.isLoaded) return;

    // Handle consent revocation
    if (!consent.analytics) {
      if (isPostHogInitialized.current) {
        try {
          posthog.reset();
          posthog.opt_out_capturing();
        } catch {
          // Ignore errors during opt-out
        }
      }

      return;
    }

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!posthogKey) {
      console.warn(
        "PostHog: API key not found. Set NEXT_PUBLIC_POSTHOG_KEY to enable.",
      );

      return;
    }

    // Prevent double initialization
    if (isPostHogInitialized.current) {
      try {
        posthog.opt_in_capturing();
      } catch {
        // Ignore
      }

      return;
    }

    try {
      posthog.init(posthogKey, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        defaults: "2025-05-24",
      });
      isPostHogInitialized.current = true;

      // Expose to window for debugging
      if (globalThis.window !== undefined) {
        (globalThis as unknown as { posthog: typeof posthog }).posthog =
          posthog;
      }
    } catch (error) {
      console.error("PostHog: Failed to initialize", error);
    }
  }, [consent.analytics, consent.isLoaded]);

  // TRACK EVENT FUNCTION

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (!consent.isLoaded || !consent.analytics) return;

      try {
        posthog.capture(eventName, properties);
      } catch (error) {
        console.error("PostHog: Failed to track event", error);
      }
    },
    [consent.analytics, consent.isLoaded],
  );

  const contextValue = useMemo(
    () => ({
      consent,
      hasAnalyticsConsent: consent.analytics,
      hasMarketingConsent: consent.marketing,
      trackEvent,
    }),
    [consent, trackEvent],
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <PHProvider client={posthog}>
        {/* Google Analytics - only render with consent */}
        {gaId && consent.isLoaded && consent.analytics && (
          <GoogleAnalytics gaId={gaId} />
        )}
        <Suspense fallback={null}>
          <AnalyticsPageView />
        </Suspense>
        {children}
      </PHProvider>
    </AnalyticsContext.Provider>
  );
}

// PAGEVIEW & USER IDENTIFICATION COMPONENT
function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { userProfile } = useUserContext();
  const { hasAnalyticsConsent, consent } = useAnalytics();

  // Track pageviews
  useEffect(() => {
    if (globalThis.window === undefined || !pathname) return;
    if (!consent.isLoaded || !hasAnalyticsConsent) return;

    try {
      let url = globalThis.window.origin + pathname;

      if (searchParams?.toString()) {
        // Sanitize URL - remove sensitive query params
        const sanitizedParams = new URLSearchParams(searchParams.toString());
        const sensitiveParams = ["token", "password", "secret", "key", "code"];
        sensitiveParams.forEach((param) => sanitizedParams.delete(param));

        if (sanitizedParams.toString()) {
          url = url + `?${sanitizedParams.toString()}`;
        }
      }

      posthog.capture("$pageview", { $current_url: url });
    } catch (error) {
      console.error("PostHog: Failed to capture pageview", error);
    }
  }, [pathname, searchParams, hasAnalyticsConsent, consent.isLoaded]);

  // Identify user (non-PII only)
  useEffect(() => {
    if (globalThis.window === undefined) return;
    if (!consent.isLoaded || !hasAnalyticsConsent) return;

    if (user?.sub && userProfile) {
      try {
        // GDPR compliant - NO PII (email, name, company removed)
        posthog.identify(user.sub, {
          user_role: userProfile.user_role_name,
          locale: userProfile.locale,
          subscription_status: userProfile.subscription?.status,
          subscription_plan: userProfile.subscription?.plan_name,
          is_active_subscriber: userProfile.subscription?.is_active,
        });
      } catch (error) {
        console.error("PostHog: Failed to identify user", error);
      }
    } else if (!user) {
      try {
        posthog.reset();
      } catch (error) {
        console.error("PostHog: Failed to reset user", error);
      }
    }
  }, [user, userProfile, hasAnalyticsConsent, consent.isLoaded]);

  return null;
}

interface CookieYesAPI {
  getCategories?: () => Record<string, boolean>;
  isConsentGiven?: (category: string) => boolean;
}

interface WindowWithCookieYes extends Window {
  CookieYes?: CookieYesAPI;
}

declare global {
  interface Window {
    CookieYes?: CookieYesAPI;
    posthog?: typeof posthog;
  }
}
