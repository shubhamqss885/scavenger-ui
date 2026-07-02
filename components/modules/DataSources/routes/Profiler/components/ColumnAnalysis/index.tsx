"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H4 } from "@/components/ui/typography";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import { NumericalColumnsTable } from "./NumericalColumnsTable";
import { CategoricalColumnsTable } from "./CategoricalColumnsTable";
import { DatetimeColumnsTable } from "./DatetimeColumnsTable";
import { EmptyColumnState } from "./EmptyColumnState";
import { ColumnAnalysisExportView } from "./ColumnAnalysisExportView";

type ColumnAnalysisProps = Readonly<{
  data: CSVProfileResponse;
}>;

export const ColumnAnalysis = ({ data }: ColumnAnalysisProps) => {
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

  // Default to first tab type that has data
  const getDefaultTab = (): "numerical" | "categorical" | "datetime" => {
    if (hasNumerical) return "numerical";
    if (hasCategorical) return "categorical";
    if (hasDatetime) return "datetime";
    return "numerical";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);

  return (
    <>
      {/* Regular tabbed UI - hidden during PDF export */}
      <Card className="profiler-tabs-container">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Icon name="BarChart2" size="md" variant="primary" />
            <H4 className="text-lg">{t("profiler.sections.columnAnalysis")}</H4>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="numerical" disabled={!hasNumerical}>
                <Icon
                  name="Hash"
                  size="xs"
                  className="mr-1.5 hidden sm:inline-block"
                />
                {t("profiler.columnAnalysis.tabs.numerical")} ({numericalCount})
              </TabsTrigger>
              <TabsTrigger value="categorical" disabled={!hasCategorical}>
                <Icon
                  name="Type"
                  size="xs"
                  className="mr-1.5 hidden sm:inline-block"
                />
                {t("profiler.columnAnalysis.tabs.categorical")} (
                {categoricalCount})
              </TabsTrigger>
              <TabsTrigger value="datetime" disabled={!hasDatetime}>
                <Icon
                  name="Calendar"
                  size="xs"
                  className="mr-1.5 hidden sm:inline-block"
                />
                {t("profiler.columnAnalysis.tabs.datetime")} ({datetimeCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="numerical">
              {hasNumerical ? (
                <NumericalColumnsTable data={columns_by_type.numerical!} />
              ) : (
                <EmptyColumnState type="numerical" />
              )}
            </TabsContent>

            <TabsContent value="categorical">
              {hasCategorical ? (
                <CategoricalColumnsTable
                  data={columns_by_type.categorical!}
                  totalRows={data.meta.total_rows}
                />
              ) : (
                <EmptyColumnState type="categorical" />
              )}
            </TabsContent>

            <TabsContent value="datetime">
              {hasDatetime ? (
                <DatetimeColumnsTable data={columns_by_type.datetime!} />
              ) : (
                <EmptyColumnState type="datetime" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export view - all tables stacked vertically, shown only during PDF export */}
      <ColumnAnalysisExportView data={data} />
    </>
  );
};
