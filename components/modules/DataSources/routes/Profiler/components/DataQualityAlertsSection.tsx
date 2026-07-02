"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { H4, Muted } from "@/components/ui/typography";
import { InfoTooltip } from "@/components/blocks/InfoTooltip";
import { DataQualityAlert } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import { DataQualityAlerts } from "./DataQualityAlerts";

type DataQualityAlertsSectionProps = Readonly<{
  alerts: DataQualityAlert[];
}>;

export const DataQualityAlertsSection = ({
  alerts,
}: DataQualityAlertsSectionProps) => {
  const { t } = useTranslation("database");
  const hasAlerts = alerts.length > 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="AlertTriangle" size="md" variant="warning" />
            <H4 className="text-lg">{t("dataQuality.sectionTitle")}</H4>
            <InfoTooltip text={t("profiler.tooltips.dataQualityAlerts")} />
          </div>
          <Badge
            variant={hasAlerts ? "destructive" : "secondary"}
            className="rounded-full text-xs"
          >
            {hasAlerts
              ? t("dataQuality.alerts.issueCount", { count: alerts.length })
              : t("dataQuality.alerts.noIssues")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {hasAlerts ? (
          <DataQualityAlerts alerts={alerts} />
        ) : (
          <div className="flex items-center justify-center gap-2 py-4">
            <Icon name="CheckCircle2" size="sm" variant="success" />
            <Muted>{t("dataQuality.alerts.noIssuesMessage")}</Muted>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
