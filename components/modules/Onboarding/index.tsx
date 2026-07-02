"use client";

import React, { useEffect, useRef } from "react";
import { Welcome } from "./components/Welcome";
import { RegionNoticeDialog } from "./components/RegionNoticeDialog";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import SimpleHeader from "@/components/blocks/SimpleHeader";
import { setI18nLanguage } from "@/lib/i18n/client";
import { useUserContext } from "@/lib/context/UserDataContext";

type Props = Readonly<{
  // Set server-side from the visitor's edge geo (see app/onboarding/page.tsx).
  isNorthAmerica?: boolean;
}>;

// Simplified onboarding - only Welcome step, then redirect to /home
export default withPageAuthRequired(function OnboardingPage({
  isNorthAmerica = false,
}: Props) {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useUserContext();
  const hasDefaultedLocale = useRef(false);

  // The backend seeds new users with locale "de", so North American visitors
  // default to English instead. This runs once per onboarding session, so a
  // deliberate later switch to German (via the header switcher) is preserved.
  useEffect(() => {
    if (!isNorthAmerica || hasDefaultedLocale.current || !userProfile) return;
    hasDefaultedLocale.current = true;

    if (userProfile.locale === "en") return;

    setI18nLanguage("en");
    updateUserProfile({ locale: "en" }).catch((error) => {
      console.error("Failed to set English locale for NA user:", error);
    });
  }, [isNorthAmerica, userProfile, updateUserProfile]);

  const handleWelcomeNext = () => {
    // Always redirect to /home after accepting terms
    // Tour will start automatically on /home for new users
    router.push("/home");
  };

  return (
    <div className="modal fixed left-0 top-0 z-50 flex h-screen w-full flex-col items-center overflow-y-auto bg-background">
      <SimpleHeader />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center p-4">
        <Welcome onSubmit={handleWelcomeNext} />
      </div>
      {isNorthAmerica && <RegionNoticeDialog />}
    </div>
  );
});
