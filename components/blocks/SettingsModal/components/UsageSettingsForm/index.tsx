"use client";

// Kept for re-use: this form is currently unmounted because the SettingsModal
// no longer renders tabs. Might be reinstated when paywall is re-enabled.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { H3, Muted, Small } from "@/components/ui/typography";
import { useDashboardStatsState } from "@/lib/context/DashboardStatsProvider";
import { useTranslation } from "@/lib/i18n/client";
import { MAX_CALENDAR_MEETING_LINK } from "@/lib/constants";

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
        <Small className="font-medium">{label}</Small>
        <Small className="text-muted-foreground">
          {format(used)}/{isUnlimited ? "∞" : format(limit)}
        </Small>
      </div>
      {!isUnlimited && <Progress value={percentage} className="h-2 bg-muted" />}
    </div>
  );
};

export const UsageSettingsForm = () => {
  const { t } = useTranslation("settings");
  const { dashboardStats } = useDashboardStatsState();

  const usageMB = +dashboardStats.storageUsage.toFixed(0);
  const totalMB = +dashboardStats.totalStorage.toFixed(0);
  const formatStorage = (value: number) => `${value}MB`;
  const formatNumber = (value: number) => value.toLocaleString();

  const metrics: UsageMetricProps[] = [
    {
      label: t("usage.metrics.dataSources"),
      used: dashboardStats.totalDataSources,
      limit: dashboardStats.dataSourcesLimit,
    },
    {
      label: t("usage.metrics.storage"),
      used: usageMB,
      limit: totalMB,
      formatValue: formatStorage,
    },
    {
      label: t("usage.metrics.projects"),
      used: dashboardStats.totalProjects,
      limit: dashboardStats.projectLimit,
    },
    {
      label: t("usage.metrics.messages"),
      used: dashboardStats.totalMessage,
      limit: dashboardStats.messageLimit,
    },
    {
      label: t("usage.metrics.tokens"),
      used: dashboardStats.tokensUsed,
      limit: dashboardStats.tokenLimit,
      formatValue: formatNumber,
    },
  ].filter((metric) => metric.limit !== 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <H3>{t("usage.title")}</H3>
        <Muted>{t("usage.description")}</Muted>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <UsageMetric key={metric.label} {...metric} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-1">
        <Small>{t("usage.needMoreSpace")}</Small>
        <Button
          asChild
          size="sm"
          variant="link"
          className="h-6 px-1 leading-none"
        >
          <Link
            href={MAX_CALENDAR_MEETING_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("usage.upgradeToEnterprise")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
