import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useIsMobile } from "@/hooks/use-mobile";

const TOUR_COMPLETED_PREFIX = "scavenger_onboarding_tour_completed_";
const TOUR_STEP_PREFIX = "scavenger_onboarding_tour_step_";

export type UseOnboardingTourReturn = Readonly<{
  shouldShowTour: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completeTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
}>;

export const useOnboardingTour = (): UseOnboardingTourReturn => {
  const { userProfile } = useUserContext();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [currentStep, setCurrentStepState] = useState(0);

  // User-specific localStorage keys
  const tourCompletedKey = userProfile?.id
    ? `${TOUR_COMPLETED_PREFIX}${userProfile.id}`
    : null;
  const tourStepKey = userProfile?.id
    ? `${TOUR_STEP_PREFIX}${userProfile.id}`
    : null;

  const viewDatasourcesEnabled = isFeatureEnabled(
    FEATURE_FLAGS.VIEW_DATASOURCES,
  );

  // Check if tour should be shown on mount
  useEffect(() => {
    if (!userProfile || !tourCompletedKey) return;

    // Only show tour on /home page
    if (pathname !== "/home") {
      setShouldShowTour(false);
      return;
    }

    // Disable tour on mobile - it's not optimized for small screens and
    // causes the grey overlay to block the entire UI
    if (isMobile) {
      setShouldShowTour(false);
      return;
    }

    // Don't show tour for demo-users (they don't have datasources)
    // Tour is designed for private-users with demo databases attached
    if (userProfile.user_role_name === "demo-user") {
      setShouldShowTour(false);
      return;
    }

    // Tour targets the sidebar Data section and Add-data CTA — if the
    // datasources feature is off, those DOM nodes don't render and Joyride
    // would hang waiting for missing targets.
    if (!viewDatasourcesEnabled) {
      setShouldShowTour(false);
      return;
    }

    // Only show tour for users who just completed onboarding
    // Check localStorage to see if tour was already completed
    const tourCompleted = localStorage.getItem(tourCompletedKey);
    const savedStep = tourStepKey ? localStorage.getItem(tourStepKey) : null;

    if (tourCompleted === "true") {
      setShouldShowTour(false);
      return;
    }

    // Show tour for new users (terms just accepted, first time on /home)
    // We use terms_accepted as indicator that user completed onboarding
    if (userProfile.terms_accepted) {
      setShouldShowTour(true);

      // Resume from saved step if any (reject garbage / stale out-of-range values)
      if (savedStep) {
        const parsed = Number.parseInt(savedStep, 10);

        if (!Number.isNaN(parsed) && parsed >= 0) {
          setCurrentStepState(parsed);
        }
      }
    }
  }, [
    userProfile,
    tourCompletedKey,
    tourStepKey,
    pathname,
    viewDatasourcesEnabled,
    isMobile,
  ]);

  const setCurrentStep = useCallback(
    (step: number) => {
      setCurrentStepState(step);
      if (tourStepKey) {
        localStorage.setItem(tourStepKey, step.toString());
      }
    },
    [tourStepKey],
  );

  const completeTour = useCallback(() => {
    if (tourCompletedKey) {
      localStorage.setItem(tourCompletedKey, "true");
    }
    if (tourStepKey) {
      localStorage.removeItem(tourStepKey);
    }
    setShouldShowTour(false);
  }, [tourCompletedKey, tourStepKey]);

  const skipTour = useCallback(() => {
    // Skipping also marks as complete so it doesn't show again
    completeTour();
  }, [completeTour]);

  const resetTour = useCallback(() => {
    // For testing/debugging - allows re-showing the tour
    if (tourCompletedKey) {
      localStorage.removeItem(tourCompletedKey);
    }
    if (tourStepKey) {
      localStorage.removeItem(tourStepKey);
    }
    setCurrentStepState(0);
    setShouldShowTour(true);
  }, [tourCompletedKey, tourStepKey]);

  return {
    shouldShowTour,
    currentStep,
    setCurrentStep,
    completeTour,
    skipTour,
    resetTour,
  };
};
