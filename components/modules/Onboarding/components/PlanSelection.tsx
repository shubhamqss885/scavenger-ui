"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H4, P } from "@/components/ui/typography";
import { useUserContext } from "@/lib/context/UserDataContext";
import { MAX_CALENDAR_MEETING_LINK } from "@/lib/constants";
import { plans } from "@/components/modules/Pricing/pricingData";
import { PricingCard } from "@/components/modules/Pricing/components/PricingCard";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";

interface Props {
  onSubmit: () => void;
}

export const PlanSelection = ({ onSubmit }: Props) => {
  const { t } = useTranslation("onboarding");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { userProfile, createCheckoutSession } = useUserContext();

  // Billing URL constants - use environment-based URL
  const BILLING_BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://dev-app.scavenger-ai.com";

  const monthlyPrice = Number(plans[1].price.monthly);
  const yearlyPrice = Number(plans[1].price.yearly);
  const discountPercentage = (
    ((monthlyPrice - yearlyPrice) / monthlyPrice) *
    100
  ).toFixed(0);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlanId(planId);

    try {
      if (planId === "demo") {
        // User chose to continue with demo - redirect to home
        onSubmit();
      } else if (planId === "private") {
        const checkoutData = {
          plan_type: frequency,
          customer_email: userProfile?.email || "",
        };

        // Pass onboarding-specific URLs for checkout redirects
        const session = await createCheckoutSession(checkoutData, {
          // TODO(billing): /add-datasource was removed (superseded by /connectors). When billing is
          // re-enabled, wire this success_url back to the appropriate billing settings route.
          // Original: `${BILLING_BASE_URL}/payment-processing?redirect=${encodeURIComponent("/add-datasource?modal=settings&tab=billing")}&success=true`
          success_url: `${BILLING_BASE_URL}/payment-processing?redirect=${encodeURIComponent("/home")}&success=true`,
          cancel_url: `${BILLING_BASE_URL}/onboarding?step=plan-selection`,
        });

        if (session?.stripe_session_url) {
          globalThis.location.href = session.stripe_session_url;
        } else {
          setLoadingPlanId(null);
          toast.error(t("planSelection.toasts.checkoutError"));
        }
      } else if (planId === "enterprise") {
        window.open(MAX_CALENDAR_MEETING_LINK, "_blank");
        setLoadingPlanId(null);
      }
    } catch (error) {
      setLoadingPlanId(null);
      toast.error(t("planSelection.toasts.checkoutError"));
    }
  };

  const handleSkipToDemo = () => {
    // User chose to skip and continue with demo
    onSubmit();
  };

  return (
    <div className="-mt-12 flex w-full max-w-5xl flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center justify-center">
        <H4 className="mb-2">{t("planSelection.title")}</H4>
        <P className="max-w-2xl text-center text-xs font-medium text-muted-foreground">
          {t("planSelection.description")}
        </P>
      </div>

      {/* Frequency Toggle */}
      <div className="mb-8 flex justify-center">
        <Tabs
          defaultValue={frequency}
          onValueChange={(value) => setFrequency(value as "monthly" | "yearly")}
        >
          <TabsList>
            <TabsTrigger value="monthly">
              {t("planSelection.frequency.monthly")}
            </TabsTrigger>
            <TabsTrigger value="yearly">
              {t("planSelection.frequency.yearly")}
              <Badge variant="secondary" className="ml-2 h-4 px-2 text-[10px]">
                {t("planSelection.frequency.discount", {
                  percent: discountPercentage,
                })}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="mb-8 grid w-full items-start gap-4 px-1 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            frequency={frequency}
            variant={plan.popular ? "popular" : "default"}
            onSubscribe={handleSubscribe}
            isLoading={loadingPlanId === plan.id}
            disabled={loadingPlanId !== null && loadingPlanId !== plan.id}
          />
        ))}
      </div>

      {/* Skip Option */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={handleSkipToDemo}
          disabled={loadingPlanId !== null}
          className="text-muted-foreground hover:text-foreground"
        >
          {t("planSelection.buttons.continueDemo")}
        </Button>
      </div>
    </div>
  );
};
