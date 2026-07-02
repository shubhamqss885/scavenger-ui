"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Joyride, Step, STATUS, ACTIONS, EventData } from "react-joyride";
import { useOnboardingTour } from "@/lib/hooks/useOnboardingTour";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n/client";
import { TourTooltip } from "./components/TourTooltip";

const OnboardingTour: React.FC = () => {
  const { t } = useTranslation("home");
  const {
    shouldShowTour,
    currentStep,
    setCurrentStep,
    completeTour,
    skipTour,
  } = useOnboardingTour();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [run, setRun] = useState(false);

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="add-datasource-button"]',
        content: t(
          "onboardingTour.steps.connectDatabase",
          "Connect your database here — any SQL database, data warehouse, or paste a connection string.",
        ),
        title: t(
          "onboardingTour.titles.connectDatabase",
          "Connect Your Database",
        ),
        placement: "right",
        skipBeacon: true,
      },
      {
        target: '[data-tour="database-selector"]',
        content: t(
          "onboardingTour.steps.selectDatabase",
          "Choose which data source to query.",
        ),
        title: t("onboardingTour.titles.selectDatabase", "Select Data Source"),
        placement: "bottom-start",
        skipBeacon: true,
      },
      {
        target: '[data-tour="home-input-bar"]',
        content: t(
          "onboardingTour.steps.askQuestions",
          "Ask questions in plain language. Scavenger analyzes your data, runs queries, and explains insights.",
        ),
        title: t("onboardingTour.titles.askQuestions", "Ask Questions"),
        placement: "top",
        skipBeacon: true,
      },
      {
        target: '[data-tour="datasources-section"]',
        content: t(
          "onboardingTour.steps.manageData",
          "Manage your data sources here. There are also some sample databases to try out.",
        ),
        title: t("onboardingTour.titles.manageData", "Manage Data & Context"),
        placement: "right",
        skipBeacon: true,
      },
    ],
    [t],
  );

  // Start tour when component mounts and shouldShowTour is true
  useEffect(() => {
    if (shouldShowTour) {
      // Ensure sidebar is open for the tour
      if (!sidebarOpen) {
        setSidebarOpen(true);
      }
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowTour, sidebarOpen, setSidebarOpen]);

  // Handle tour events
  const handleJoyrideEvent = (data: EventData) => {
    const { status, action, index, type } = data;

    // Update current step on navigation
    if (type === "step:after" && action === ACTIONS.NEXT) {
      setCurrentStep(index + 1);
    } else if (type === "step:after" && action === ACTIONS.PREV) {
      setCurrentStep(index - 1);
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED) {
      completeTour();
      setRun(false);
    } else if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      skipTour();
      setRun(false);
    }
  };

  if (!shouldShowTour) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={currentStep}
      onEvent={handleJoyrideEvent}
      continuous
      tooltipComponent={TourTooltip}
      options={{
        zIndex: 50,
        overlayColor: "rgba(0, 0, 0, 0.8)",
        spotlightRadius: 8,
        closeButtonAction: "skip",
        // Block clicks on the highlighted target so users can't accidentally
        // navigate away mid-tour (e.g. clicking the spotlighted "Add new data"
        // CTA). Forces explicit Next / Skip / Close — completion is always
        // recorded via Joyride's events and the tour never reappears.
        blockTargetInteraction: true,
      }}
      locale={{
        back: t("onboardingTour.buttons.back", "Back"),
        close: t("onboardingTour.buttons.close", "Close"),
        last: t("onboardingTour.buttons.finish", "Get Started"),
        next: t("onboardingTour.buttons.next", "Next"),
        skip: t("onboardingTour.buttons.skip", "Skip tour"),
      }}
    />
  );
};

export default OnboardingTour;
