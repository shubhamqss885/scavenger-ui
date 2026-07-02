"use client";

// Kept for re-use: this form is currently unmounted because the SettingsModal
// no longer renders tabs. Might be reinstated when paywall is re-enabled.

import { useUserContext } from "@/lib/context/UserDataContext";
import { BillingActiveUser } from "./components/BillingActiveUser";
import { BillingInactiveUser } from "./components/BillingInactiveUser";

export function BillingForm() {
  const { userProfile } = useUserContext();

  // Determine which component to render based on subscription status
  const hasActiveSubscription = userProfile?.subscription?.status === "active";

  // Simple routing: show active or inactive user billing form
  return hasActiveSubscription ? (
    <BillingActiveUser />
  ) : (
    <BillingInactiveUser />
  );
}
