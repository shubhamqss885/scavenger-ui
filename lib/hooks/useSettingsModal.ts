"use client";

// Tab-aware logic (validTabs, activeTab, handleTabChange) is currently a no-op
// in the UI because the SettingsModal no longer renders tabs. Kept intact —
// might be reinstated when paywall is re-enabled.

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useUserContext } from "@/lib/context/UserDataContext";

export function useSettingsModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const { userProfile } = useUserContext();

  const isSettingsEnabled = isFeatureEnabled(FEATURE_FLAGS.SETTINGS_DROPDOWN);
  const isPaywallEnabled = isFeatureEnabled(FEATURE_FLAGS.PAYWALL_ENABLED);
  const isPrivateUser = userProfile?.user_role_name === "private-user";

  // Valid tabs for the settings modal (dynamic based on feature flags)
  const validTabs = ["accounts"];

  if (isPaywallEnabled) {
    validTabs.push("billing");
  } else if (isPrivateUser) {
    validTabs.push("usage");
  }

  // Check if settings modal should be shown (only if feature is enabled)
  const showSettings =
    searchParams.get("modal") === "settings" && isSettingsEnabled;

  // Validate and set active tab, fallback to 'accounts' if invalid
  const requestedTab = searchParams.get("tab") || "accounts";
  const activeTab = validTabs.includes(requestedTab)
    ? requestedTab
    : "accounts";

  const handleClose = () => {
    // Remove query params but stay on current page
    router.push(pathname);
  };

  const handleTabChange = (tab: string) => {
    // Validate tab access before changing
    if (!validTabs.includes(tab)) {
      console.warn(`Tab "${tab}" is not available for current user`);
      return;
    }
    // Update the tab in query params, keeping current path
    router.push(`${pathname}?modal=settings&tab=${tab}`);
  };

  return {
    showSettings,
    activeTab,
    handleClose,
    handleTabChange,
  };
}
