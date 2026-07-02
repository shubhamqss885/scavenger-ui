"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Detail, Small } from "@/components/ui/typography";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useTranslation } from "@/lib/i18n/client";

export function BillingInactiveUser() {
  const { t } = useTranslation("settings");
  const { userProfile } = useUserContext();
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push("/pricing");
  };

  const isDemoUser = userProfile?.user_role_name === "demo-user";

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Icon name="Zap" className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <Detail className="text-xl font-semibold">
            {isDemoUser
              ? t("billing.inactive.unlockPower")
              : t("billing.inactive.noSubscription")}
          </Detail>
          <Small className="text-muted-foreground max-w-md">
            {isDemoUser
              ? t("billing.inactive.upgradeDescription")
              : t("billing.inactive.upgradePremium")}
          </Small>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3 max-w-sm">
        <div className="flex items-center gap-3">
          <Icon name="Check" className="h-4 w-4 text-primary shrink-0" />
          <Small>{t("billing.inactive.features.dataSources")}</Small>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="Check" className="h-4 w-4 text-primary shrink-0" />
          <Small>{t("billing.inactive.features.fileStorage")}</Small>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="Check" className="h-4 w-4 text-primary shrink-0" />
          <Small>{t("billing.inactive.features.unlimitedProjects")}</Small>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="Check" className="h-4 w-4 text-primary shrink-0" />
          <Small>{t("billing.inactive.features.security")}</Small>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3">
        <Button onClick={handleUpgradeClick} className="w-full max-w-sm">
          <Icon name="ArrowUp" className="mr-2 h-4 w-4" />
          {t("billing.inactive.upgradeButton")}
        </Button>

        <Small className="text-muted-foreground">
          {t("billing.inactive.viewPricing")}
        </Small>
      </div>

      {/* Current plan info for demo users */}
      {isDemoUser && (
        <div className="text-center">
          <Small className="text-muted-foreground">
            {t("billing.inactive.currentPlan")}
          </Small>
        </div>
      )}
    </div>
  );
}
