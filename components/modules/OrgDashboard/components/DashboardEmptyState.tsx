"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useTranslation } from "@/lib/i18n/client";

const DashboardEmptyState = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const { isFeatureEnabled, FEATURE_FLAGS, homeRoute } = useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_ORG_DASHBOARDS);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {canEdit ? (
        <div>
          <p className="text-sm font-medium text-foreground">
            {t("orgDashboard.emptyState.title")}
          </p>
          <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>1. {t("orgDashboard.emptyState.step1")}</li>
            <li>2. {t("orgDashboard.emptyState.step2")}</li>
            <li>3. {t("orgDashboard.emptyState.step3")}</li>
          </ol>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => router.push(homeRoute)}
          >
            {t("orgDashboard.emptyState.startChat")}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("orgDashboard.emptyState.viewerHint")}
        </p>
      )}
    </div>
  );
};

export default DashboardEmptyState;
