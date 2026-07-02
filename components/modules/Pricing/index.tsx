"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lead } from "@/components/ui/typography";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useTranslation } from "@/lib/i18n/client";
import { MAX_CALENDAR_MEETING_LINK } from "@/lib/constants";
import { plans } from "./pricingData";
import { PricingCard, type PricingCardVariant } from "./components/PricingCard";
import PageHeader from "@/components/blocks/Header";
import { toast } from "sonner";

export const Pricing = () => {
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { userProfile, createCheckoutSession } = useUserContext();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isPaywallEnabled = isFeatureEnabled(FEATURE_FLAGS.PAYWALL_ENABLED);
  const { t } = useTranslation("pricing");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isPaywallEnabled) {
      router.replace("/home");
    }
  }, [isPaywallEnabled, router]);

  // Handle canceled payment parameter
  useEffect(() => {
    if (searchParams.get("canceled") === "true" && userProfile?.locale) {
      // Small delay to ensure i18n has updated with user's language
      setTimeout(() => {
        toast.error(t("billing.paymentCanceled"), {
          duration: 5000, // 5 seconds
        });

        // Remove the canceled parameter from URL to prevent showing toast again
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("canceled");
        router.replace(newUrl.pathname + newUrl.search);
      }, 100); // 100ms delay
    }
  }, [searchParams, userProfile?.locale, router]);

  if (!isPaywallEnabled) return null;

  const discountPercentage = (
    ((Number(plans[1].price.monthly) - Number(plans[1].price.yearly)) /
      Number(plans[1].price.monthly)) *
    100
  ).toFixed(0);

  const isDemoUser = userProfile?.user_role_name === "demo-user";
  const isPrivateUser = userProfile?.user_role_name === "private-user";

  const handleSubscribe = async (planId: string) => {
    // Handle Private plan - route to billing settings if already subscribed
    if (planId === "private" && isPrivateUser) {
      router.push("/pricing?modal=settings&tab=billing");
      return;
    }

    setLoadingPlanId(planId);

    try {
      if (planId === "private") {
        const checkoutData = {
          plan_type: frequency,
          customer_email: userProfile?.email || "",
        };

        const session = await createCheckoutSession(checkoutData);

        if (session?.stripe_session_url) {
          window.location.href = session.stripe_session_url;
        } else {
          setLoadingPlanId(null);
        }
      } else if (planId === "enterprise") {
        window.open(MAX_CALENDAR_MEETING_LINK, "_blank");
        setLoadingPlanId(null);
      }
    } catch (error) {
      setLoadingPlanId(null);
      toast.error(t("billing.checkoutFailed"));
    }
  };

  const getPlanVariant = (planId: string): PricingCardVariant => {
    if (planId === "demo" && isDemoUser) return "current";
    if (planId === "private" && isPrivateUser) return "current";

    const plan = plans.find((p) => p.id === planId);

    if (plan?.popular) return "popular";

    return "default";
  };

  const isButtonDisabled = (planId: string): boolean => {
    // Loading state - disable the button being processed
    if (loadingPlanId === planId) return true;

    // Disable Demo for Private users (downgrade not allowed)
    if (planId === "demo" && isPrivateUser) return true;

    // Disable current plan buttons (except Private - it routes to billing)
    const variant = getPlanVariant(planId);

    if (variant === "current" && planId !== "private") return true;

    return false;
  };

  return (
    <div className="mx-auto flex h-full w-full flex-col">
      <div className="px-6">
        <PageHeader title={t("page.title")} />
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="flex flex-col items-center justify-center pb-6">
          <Lead className="mx-auto mb-8 mt-0 max-w-2xl text-balance text-center">
            {t("page.subheading")}
          </Lead>
          <Tabs
            defaultValue={frequency}
            onValueChange={(value) =>
              setFrequency(value as "monthly" | "yearly")
            }
          >
            <TabsList>
              <TabsTrigger value="monthly">
                {t("page.billing.monthly")}
              </TabsTrigger>
              <TabsTrigger value="yearly">
                {t("page.billing.yearly")}
                <Badge
                  variant="secondary"
                  className="ml-2 h-4 px-2 text-[10px]"
                >
                  {discountPercentage}% {t("page.billing.yearlyDiscount")}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-8 grid w-full max-w-5xl items-start gap-4 px-1 md:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                frequency={frequency}
                variant={getPlanVariant(plan.id)}
                onSubscribe={handleSubscribe}
                isLoading={loadingPlanId === plan.id}
                disabled={isButtonDisabled(plan.id)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
