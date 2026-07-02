"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { H4 } from "@/components/ui/typography";
import { useUserContext } from "@/lib/context/UserDataContext";
import HomeSkeleton from "@/components/blocks/Loading/HomeSkeleton";
import HomeInputBar from "./components/HomeInputBar";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import StoryModal from "@/components/blocks/StoryModal";
import HelpModal from "@/components/blocks/HelpModal";
import ToggleSidebar from "@/components/blocks/ToggleSidebar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

const getTimeBasedGreeting = (t: (key: string) => string): string => {
  const hour = new Date().getHours();

  if (hour >= 22 || hour < 5) return t("page.greetingNight");
  if (hour < 12) return t("page.greetingMorning");
  if (hour < 17) return t("page.greetingAfternoon");
  return t("page.greetingEvening");
};

const Dashboard = () => {
  const { userProfile, isLoading } = useUserContext();
  const { t } = useTranslation("home");
  const userId = userProfile?.id;
  const [showWave, setShowWave] = useState(false);

  const greeting = useMemo(() => {
    const timeGreeting = getTimeBasedGreeting(t);
    const firstName = userProfile?.user_name?.split(" ")[0];
    return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  }, [t, userProfile?.user_name]);
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleGreetingClick = useCallback(() => {
    if (showWave) return;
    setShowWave(true);
    setTimeout(() => setShowWave(false), 1500);
  }, [showWave]);

  const STORY_TELLING_ENABLED = isFeatureEnabled(FEATURE_FLAGS.STORY_TELLING);

  // Show the storytelling modal after loading is complete
  // but only if the user hasn't seen it before and the feature is enabled
  useEffect(() => {
    const storageKey = `hasSeenStorytellingIntro_${userId}`;
    const hasSeenStory = localStorage.getItem(storageKey) === "true";

    if (!hasSeenStory && !isLoading && STORY_TELLING_ENABLED && userId) {
      setShowStoryModal(true);
      localStorage.setItem(storageKey, "true");
    }
  }, [isLoading, STORY_TELLING_ENABLED, userId]);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <div className="relative flex h-full w-full flex-col items-center px-6">
        <ToggleSidebar className="absolute left-4 top-4" />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 gap-2"
          onClick={() => setShowHelpModal(true)}
          aria-label={t("help.button")}
        >
          <Icon name="HelpCircle" size="sm" variant="foreground" />
          {t("help.button")}
        </Button>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
          <H4
            className="w-full max-w-3xl cursor-pointer select-none text-3xl"
            onClick={handleGreetingClick}
          >
            {greeting}
            {showWave && (
              <span className="ml-2 inline-block origin-[70%_70%] animate-wave">
                👋
              </span>
            )}
          </H4>
          <div className="w-full max-w-3xl">
            <HomeInputBar />
          </div>
        </div>
      </div>
      <StoryModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
      />
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
};

export default Dashboard;
