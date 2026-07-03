import type posthog from "posthog-js";

// Registers Web Vitals listeners and forwards each metric to PostHog as a
// `web_vital` event. `web-vitals` is imported dynamically so it stays out of
// the main bundle and only loads once analytics consent is granted.
// Safe to no-op if it can't load. Call once (after PostHog init).
export const reportWebVitals = async (ph: typeof posthog): Promise<void> => {
  try {
    const { onCLS, onLCP, onINP, onFCP, onTTFB } = await import("web-vitals");

    const send = (metric: {
      name: string;
      value: number;
      rating: string;
      id: string;
      navigationType?: string;
    }) => {
      try {
        ph.capture("web_vital", {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          metric_id: metric.id,
          navigation_type: metric.navigationType,
        });
      } catch {
        // Never let telemetry break the app.
      }
    };

    onCLS(send);
    onLCP(send);
    onINP(send);
    onFCP(send);
    onTTFB(send);
  } catch {
    // web-vitals failed to load — silently skip (telemetry is best-effort).
  }
};
