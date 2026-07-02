"use client";

import { useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { H4, Small, Muted } from "@/components/ui/typography";
import { InfoTooltip } from "@/components/blocks/InfoTooltip";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import { useInvestigate } from "../hooks/useInvestigate";

type TopCorrelationsProps = Readonly<{
  data: CSVProfileResponse;
  databaseId: string;
  tableName: string;
}>;

export const TopCorrelations = ({
  data,
  databaseId,
  tableName,
}: TopCorrelationsProps) => {
  const { t } = useTranslation("database");
  const { table_stats } = data;
  const { investigate, isCreating } = useInvestigate(databaseId);

  // Filter out correlations with null coefficients (happens when a column has zero variance)
  const correlations = table_stats.correlation.top_pairs?.filter(
    (corr) => corr.coefficient !== null && corr.coefficient !== undefined,
  );

  const hasCorrelations = correlations && correlations.length > 0;

  const buildPrompt = useCallback(() => {
    const correlationsList = correlations
      ?.slice(0, 5)
      .map(
        (corr) =>
          `- ${corr.column_x} ↔ ${corr.column_y} (r = ${corr.coefficient?.toFixed(2) ?? "-"})`,
      )
      .join("\n");

    return `Investigate the correlations in the table "${tableName}".

Top correlations found (${table_stats.correlation.method} method):
${correlationsList || "No significant correlations found."}

Please help me understand:
1. What do these correlations suggest about the data?
2. Are there any unexpected or concerning correlations?
3. How can I use these insights for analysis?`;
  }, [correlations, tableName, table_stats.correlation.method]);

  // Shared button props to avoid duplication
  const investigateButtonDisabled = isCreating || !hasCorrelations;

  if (!hasCorrelations) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="BarChart2" size="md" variant="primary" />
              <H4 className="text-lg">
                {t("profiler.sections.topCorrelations")}
              </H4>
              <InfoTooltip text={t("profiler.tooltips.correlations")} />
            </div>
            <Button
              size="sm"
              onClick={() => investigate(buildPrompt())}
              disabled={investigateButtonDisabled}
              className="h-7 gap-1.5 px-3"
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon
              name="TrendingUp"
              size="lg"
              variant="muted"
              className="mb-3"
            />
            <Muted>{t("profiler.correlations.noCorrelations")}</Muted>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="BarChart2" size="md" variant="primary" />
            <H4 className="text-lg">
              {t("profiler.sections.topCorrelations")}
            </H4>
            <InfoTooltip text={t("profiler.tooltips.correlations")} />
            <Badge variant="outline" className="text-xs">
              {table_stats.correlation.method}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={() => investigate(buildPrompt())}
            disabled={investigateButtonDisabled}
            className="ml-auto h-7 gap-1.5 px-3 sm:ml-0"
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
          {correlations.map((corr, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Small className="text-foreground">
                  {corr.column_x} ↔ {corr.column_y}
                </Small>
                <Badge variant="outline" className="font-mono text-xs">
                  r = {corr.coefficient?.toFixed(2) ?? "-"}
                </Badge>
              </div>
              <Progress
                value={Math.abs(corr.coefficient ?? 0) * 100}
                className="bg-muted/50"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
