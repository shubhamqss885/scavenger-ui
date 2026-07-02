import { ReactNode } from "react";

export type ConsentState = Readonly<{
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  isLoaded: boolean;
}>;

export type AnalyticsContextType = Readonly<{
  consent: ConsentState;
  hasAnalyticsConsent: boolean;
  hasMarketingConsent: boolean;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
}>;

export type AnalyticsProviderProps = Readonly<{
  children: ReactNode;
  gaId?: string;
}>;
