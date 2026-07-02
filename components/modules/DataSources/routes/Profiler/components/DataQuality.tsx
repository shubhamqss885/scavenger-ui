"use client";

import { useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { H4, Small } from "@/components/ui/typography";
import { InfoTooltip } from "@/components/blocks/InfoTooltip";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { cn } from "@/lib/utils";
import { getMetricColor } from "../utils";
import { useTranslation } from "@/lib/i18n/client";
import { useInvestigate } from "../hooks/useInvestigate";

type DataQualityProps = Readonly<{
  data: CSVProfileResponse;
  databaseId: string;
  tableName: string;
}>;

type QualityMetric = Readonly<{
  icon: string;
  labelKey: string;
  value: number;
  tooltipKey?: string;
}>;

export const DataQuality = ({
  data,
  databaseId,
  tableName,
}: DataQualityProps) => {
  const { t } = useTranslation("database");
  const { table_stats } = data;
  const { investigate, isCreating } = useInvestigate(databaseId);

  // Check if there's meaningful data to investigate
  // The card shows data when table_stats exists with valid metrics
  const hasDataToInvestigate =
    table_stats &&
    typeof table_stats.total_missing_pct === "number" &&
    typeof table_stats.outlier_rows_pct === "number" &&
    typeof table_stats.duplicate_rows_pct === "number";

  const buildPrompt = useCallback(() => {
    return `Analyze the data quality issues in the table "${tableName}".

Current quality metrics:
- Missing Data: ${table_stats.total_missing_pct?.toFixed(2) ?? "0"}%
- Outliers: ${table_stats.outlier_rows_pct?.toFixed(2) ?? "0"}%
- Duplicates: ${table_stats.duplicate_rows_pct?.toFixed(2) ?? "0"}%

Please help me understand:
1. What are the root causes of these issues?
2. Which columns are most affected?
3. What actions should I take to improve data quality?`;
  }, [
    tableName,
    table_stats.total_missing_pct,
    table_stats.outlier_rows_pct,
    table_stats.duplicate_rows_pct,
  ]);

  const metrics: QualityMetric[] = [
    {
      icon: "AlertTriangle",
      labelKey: "profiler.quality.missingData",
      value: table_stats.total_missing_pct,
      tooltipKey: "profiler.tooltips.missingValues",
    },
    {
      icon: "Target",
      labelKey: "profiler.quality.outliers",
      value: table_stats.outlier_rows_pct,
      tooltipKey: "profiler.tooltips.outliers",
    },
    {
      icon: "Copy",
      labelKey: "profiler.quality.duplicates",
      value: table_stats.duplicate_rows_pct,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Target" size="md" variant="primary" />
            <H4 className="text-lg">{t("profiler.sections.dataQuality")}</H4>
          </div>
          <Button
            size="sm"
            onClick={() => investigate(buildPrompt())}
            disabled={isCreating || !hasDataToInvestigate}
            className="gap-1.5 h-7 px-3"
          >
            {isCreating ? (
              <Icon
                name="Loader2"
                size="xxs"
                variant="white"
                className="animate-spin"
              />
            ) : (
              <Icon name="Search" size="xxs" variant="white" />
            )}
            {t("profiler.actions.investigate")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => {
            const colors = getMetricColor(metric.value);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="py-1 flex items-center gap-2">
                    <Icon
                      name={metric.icon as any}
                      size="xs"
                      variant="foreground"
                    />
                    <Small className="">{t(metric.labelKey)}</Small>
                    {metric.tooltipKey && (
                      <InfoTooltip text={t(metric.tooltipKey)} />
                    )}
                  </div>
                  <Small className={cn("font-semibold", colors.text)}>
                    {metric.value?.toFixed(2) ?? "-"}%
                  </Small>
                </div>
                <Progress
                  value={Math.min(metric.value, 100)}
                  className={cn("bg-muted/50", colors.indicator)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
