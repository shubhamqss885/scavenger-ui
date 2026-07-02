"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { deleteUserProfile } from "@/lib/services/userService";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { useTranslation } from "@/lib/i18n/client";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useDashboardStatsState } from "@/lib/context/DashboardStatsProvider";
import { DeleteConfirmationDialog } from "@/components/blocks/AppSidebar/components/shared/DeleteConfirmationDialog";

type UsageMetricProps = Readonly<{
  label: string;
  used: number;
  limit: number;
  formatValue?: (value: number) => string;
}>;

const UsageMetric = ({ label, used, limit, formatValue }: UsageMetricProps) => {
  const isUnlimited = limit === -1;
  const percentage =
    !isUnlimited && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : 0;
  const format = formatValue ?? ((value: number) => String(value));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">
          {format(used)}/{isUnlimited ? "∞" : format(limit)}
        </span>
      </div>
      {!isUnlimited && <Progress value={percentage} className="h-2 bg-muted" />}
    </div>
  );
};

export const AccountSettingsForm = () => {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation("settings");
  const { dashboardStats } = useDashboardStatsState();
  const { auth0User, userProfile } = useUserContext();
  const isDatabaseUser =
    typeof auth0User?.sub === "string" && auth0User.sub.startsWith("auth0|");
  // Org-viewers don't have usage to show (no datasources access, no chats).
  // The dashboard_stats endpoint also 403s for them, so the metrics would be
  // empty/broken anyway.
  const showUsageSection = userProfile?.user_role_name !== "org-viewer";

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteUserProfile();
      toast.success(t("account.messages.accountDeleted"));
      window.location.href = "/api/auth/logout";
    } catch (error) {
      toast.error(t("account.messages.accountDeleteFailed"));
      console.error("Failed to delete user profile:", error);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const formatNumber = (value: number) => value.toLocaleString();

  const usageMetrics: UsageMetricProps[] = [
    {
      label: t("usage.metrics.dataSources"),
      used: dashboardStats.totalDataSources,
      limit: dashboardStats.dataSourcesLimit,
    },
    {
      label: t("usage.metrics.tokens"),
      used: dashboardStats.tokensUsed,
      limit: dashboardStats.tokenLimit,
      formatValue: formatNumber,
    },
  ].filter((metric) => metric.limit !== 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Usage Section */}
      {showUsageSection && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("usage.title")}
          </p>
          <div className="space-y-4">
            {usageMetrics.map((metric) => (
              <UsageMetric key={metric.label} {...metric} />
            ))}
          </div>
        </div>
      )}

      {/* Password Section */}
      {isDatabaseUser && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("account.password.title")}
          </p>
          <ResetPasswordButton />
        </div>
      )}

      {/* Delete Account Section */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("account.dangerZone.title")}
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeletingAccount}
        >
          {isDeletingAccount
            ? t("account.deleteAccount.deletingButton")
            : t("account.deleteAccount.button")}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("account.deleteAccount.description")}
        </p>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("account.deleteAccount.confirmTitle")}
        description={t("account.deleteAccount.confirmDescription")}
        onConfirm={handleDeleteAccount}
        confirmText={t("account.deleteAccount.confirmButton")}
        cancelText={t("account.deleteAccount.cancelButton")}
        deletingText={t("account.deleteAccount.deletingButton")}
        isLoading={isDeletingAccount}
      />
    </div>
  );
};
