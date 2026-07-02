"use client";

import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { H4 } from "@/components/ui/typography";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import { NumericalColumnsTable } from "./NumericalColumnsTable";
import { CategoricalColumnsTable } from "./CategoricalColumnsTable";
import { DatetimeColumnsTable } from "./DatetimeColumnsTable";

type ColumnAnalysisExportViewProps = Readonly<{
  data: CSVProfileResponse;
}>;

/**
 * Export-only view of ColumnAnalysis that displays all column types
 * (numerical, categorical, datetime) stacked vertically.
 * This component is hidden by default and shown only during PDF export.
 */
export const ColumnAnalysisExportView = ({
  data,
}: ColumnAnalysisExportViewProps) => {
  const { t } = useTranslation("database");
  const { columns_by_type } = data;

  const numericalCount = Object.keys(columns_by_type.numerical || {}).length;
  const categoricalCount = Object.keys(
    columns_by_type.categorical || {},
  ).length;
  const datetimeCount = Object.keys(columns_by_type.datetime || {}).length;

  const hasNumerical = numericalCount > 0;
  const hasCategorical = categoricalCount > 0;
  const hasDatetime = datetimeCount > 0;

  return (
    <Card className="column-analysis-export-view hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Icon name="BarChart2" size="md" variant="primary" />
          <H4 className="text-lg">{t("profiler.sections.columnAnalysis")}</H4>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Numerical Columns Section */}
        {hasNumerical && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Icon name="Hash" size="sm" variant="primary" />
              <span className="font-semibold text-foreground">
                {t("profiler.columnAnalysis.tabs.numerical")} ({numericalCount})
              </span>
            </div>
            <NumericalColumnsTable data={columns_by_type.numerical!} />
          </div>
        )}

        {/* Categorical Columns Section */}
        {hasCategorical && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Icon name="Type" size="sm" variant="primary" />
              <span className="font-semibold text-foreground">
                {t("profiler.columnAnalysis.tabs.categorical")} (
                {categoricalCount})
              </span>
            </div>
            <CategoricalColumnsTable
              data={columns_by_type.categorical!}
              totalRows={data.meta.total_rows}
            />
          </div>
        )}

        {/* Datetime Columns Section */}
        {hasDatetime && (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Icon name="Calendar" size="sm" variant="primary" />
              <span className="font-semibold text-foreground">
                {t("profiler.columnAnalysis.tabs.datetime")} ({datetimeCount})
              </span>
            </div>
            <DatetimeColumnsTable data={columns_by_type.datetime!} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
