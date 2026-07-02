"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { usePolling } from "@/lib/hooks/usePolling";
import { DEMO_ORG_ID } from "@/lib/constants";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import { PaymentProcessingUI } from "./PaymentProcessingUI";
import {
  getUserOrganization,
  type UserOrganizationProfile,
} from "@/lib/services/organizationService";

export const PaymentProcessing = () => {
  const { t } = useTranslation("settings");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUserProfile } = useUserContext();
  const { refetchOrganization } = useOrgFeatures();
  // TODO(billing): /add-datasource was removed (superseded by /connectors). When billing is
  // re-enabled, wire this fallback back to the appropriate billing settings route.
  // Original fallback: "/add-datasource?modal=settings&tab=billing"
  const redirectUrl = searchParams.get("redirect") || "/home";

  const { data, error, isPolling } = usePolling({
    fn: async () => {
      const userOrg = await getUserOrganization();
      return userOrg;
    },
    interval: {
      type: "exponential",
      initial: 2000, // Start at 2s
      multiplier: 3, // 2s, 6s, 18s
      max: 18000, // Cap at 18s
    },
    maxAttempts: 20,
    autoStart: true,
    immediate: true,
    stopWhen: (data) => {
      // Stop when organization is no longer demo org
      // This means backend has completed all updates
      return data?.current_organization !== DEMO_ORG_ID;
    },
    onSuccess: (data) => {
      if (data?.current_organization !== DEMO_ORG_ID) {
        void (async () => {
          try {
            await refreshUserProfile();
            await refetchOrganization();
            toast.success(t("billing.paymentSuccessRedirecting"));
          } catch (error) {
            console.error("Failed to refresh profile:", error);
          } finally {
            router.push(redirectUrl);
          }
        })();
      }
    },
    onError: (error) => {
      console.error("Failed to check organization status:", error);
    },
  });

  // Handle timeout case
  useEffect(() => {
    if (!isPolling && error && data?.current_organization === DEMO_ORG_ID) {
      toast.error(t("billing.processingTimeout"));
    }
  }, [isPolling, data, error, t]);

  const determineStepFromOrganization = (
    data: UserOrganizationProfile | null,
    isPolling: boolean,
  ): 1 | 2 | 3 => {
    if (!data) return 1;

    // Step 1: Payment completed (always true when we're on this page)
    // Step 2: Activating subscription (polling in progress)
    // Step 3: Setting up account (org changed from demo)

    if (data.current_organization !== DEMO_ORG_ID) {
      return 3; // All done
    }

    if (isPolling) {
      return 2; // Processing
    }

    return 1; // Just started
  };

  // Determine current step based on polling state
  const step = determineStepFromOrganization(data, isPolling);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <PaymentProcessingUI
        step={step}
        isLoading={isPolling}
        error={error}
        statusMessage={t("billing.verifyingActivation")}
        stepLabels={{
          step1: t("billing.checkoutCompleted"),
          step2: t("billing.processingSubscription"),
          step3: t("billing.settingUpAccount"),
        }}
        onRetry={() => globalThis.location.reload()}
      />
    </div>
  );
};
