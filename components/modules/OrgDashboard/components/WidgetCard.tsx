"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import ChartSkeleton from "@/components/modules/AgenticChat/components/tools/ChartSkeleton";
import type { AgenticChartSpec } from "@/components/modules/AgenticChat/types";
import type { DashboardWidget } from "@/lib/services/orgDashboardService";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import WidgetActions from "./WidgetActions";
import RetryInChatButton from "./RetryInChatButton";

// recharts (~120 kB) is split out of the dashboard route's First Load JS and
// loaded on demand. Prefetched on idle + preloaded on dashboard mount (see
// SingleDashboard) so widget charts render with no wait.
const AgenticChart = dynamic(
  () =>
    import(
      /* webpackPrefetch: true */ "@/components/modules/AgenticChat/components/tools/AgenticChart"
    ),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

// Lazy-load the SQL back face (pulls in react-syntax-highlighter) on first flip.
const WidgetSqlBack = dynamic(() => import("./WidgetSqlBack"), { ssr: false });

const ROW_LIMIT = 50;

type WidgetCardProps = Readonly<{
  widget: DashboardWidget;
  onRemove: (id: string) => void;
  refreshing?: boolean;
  canEdit?: boolean;
  // Opens the edit-in-chat sheet for this widget. Omitted for viewers.
  onEdit?: (widget: DashboardWidget) => void;
  // False when the widget's datasource no longer exists — Edit is disabled then.
  datasourceAvailable?: boolean;
}>;

const WidgetCard = ({
  widget,
  onRemove,
  refreshing,
  canEdit = true,
  onEdit,
  datasourceAvailable = true,
}: WidgetCardProps) => {
  const [flipped, setFlipped] = useState(false);
  // Keep the back face mounted once shown so flipping back stays animated.
  const [mountBack, setMountBack] = useState(false);
  const hideRemove = !canEdit || refreshing;
  const showEdit = !!onEdit && !refreshing;

  const handleRemove = () => onRemove(widget.widget_id);
  const showSql = () => {
    setMountBack(true);
    setFlipped(true);
  };

  return (
    <div className="group relative h-full [perspective:1200px]">
      <div
        className={cn(
          "relative h-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front face + actions kebab, so the menu turns away with the card. */}
        <div className="relative h-full [backface-visibility:hidden]">
          <div className="h-full [&>*]:h-full">
            <WidgetFront
              widget={widget}
              canEdit={canEdit}
              refreshing={refreshing}
            />
          </div>
          <WidgetActions
            onViewSql={showSql}
            onEdit={showEdit ? () => onEdit?.(widget) : undefined}
            datasourceAvailable={datasourceAvailable}
            onRemove={hideRemove ? undefined : handleRemove}
          />
        </div>

        {/* Back face: the SQL behind the widget */}
        {mountBack && (
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] [&>*]:h-full">
            <WidgetSqlBack
              title={widget.title}
              sql={widget.sql_query}
              onBack={() => setFlipped(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

type WidgetFrontProps = Readonly<{
  widget: DashboardWidget;
  canEdit: boolean;
  refreshing?: boolean;
}>;

const WidgetFront = ({ widget, canEdit, refreshing }: WidgetFrontProps) => {
  const { t } = useTranslation("dashboard");

  if (widget.refresh_error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Icon name="AlertCircle" size="sm" variant="destructive" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">
              {t("orgDashboard.widget.refreshFailed")}
            </p>
            {canEdit ? (
              <RetryInChatButton
                title={widget.title}
                sqlQuery={widget.sql_query}
                orgdbId={widget.orgdb_id}
                disabled={refreshing}
              />
            ) : (
              <Badge variant="outline" className="text-xs">
                {t("orgDashboard.widget.retryInChat")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!widget.cached_result) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("orgDashboard.widget.noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // chart_config = stable spec; cached_result = fresh data rows. Fall back to cached_result for older widgets.
  const chartConfig = widget.chart_config as Record<string, unknown> | null;
  const cachedResult = widget.cached_result as Record<string, unknown>;
  const specSource = chartConfig ?? cachedResult;
  const isValidChartSpec =
    widget.widget_type === "chart" &&
    specSource.chart_type &&
    specSource.chart_type !== "table" &&
    Array.isArray(specSource.y_keys);

  if (isValidChartSpec) {
    const data =
      (cachedResult.data as AgenticChartSpec["data"] | undefined) ?? [];
    const spec: AgenticChartSpec = {
      ...(specSource as unknown as AgenticChartSpec),
      data,
      data_points: data.length,
      title: widget.title,
      x_label: (specSource.x_label as string | null) ?? null,
      y_label: (specSource.y_label as string | null) ?? null,
      y_axis_config:
        (specSource.y_axis_config as AgenticChartSpec["y_axis_config"]) ?? null,
    };
    return (
      <Card className="flex flex-col">
        <CardContent className="flex min-h-0 flex-1 pt-4 sm:pt-4">
          <AgenticChart spec={spec} fillHeight />
        </CardContent>
      </Card>
    );
  }

  return <TableWidget widget={widget} />;
};

type TableWidgetProps = Readonly<{
  widget: DashboardWidget;
}>;

const TableWidget = ({ widget }: TableWidgetProps) => {
  const { t } = useTranslation("dashboard");
  const [showAll, setShowAll] = useState(false);

  const { columns, data, row_count } = widget.cached_result as {
    columns: string[];
    data: Record<string, any>[];
    row_count?: number;
  };

  // `row_count` is the true total the BE saw (it caps `data` at 500 on refresh).
  // Fall back to data.length for older widgets that may not have row_count.
  const total = row_count ?? data?.length ?? 0;
  const available = data?.length ?? 0;
  const visible = showAll ? data : data?.slice(0, ROW_LIMIT);
  const truncated = total > ROW_LIMIT;

  return (
    <Card>
      <CardHeader className="pt-4 sm:pb-2 sm:pt-4">
        <CardTitle className="text-center text-lg font-semibold">
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[450px] overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b">
              {columns?.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-1.5 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible?.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {columns?.map((col) => (
                  <td key={col} className="whitespace-nowrap px-3 py-1.5">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
      {truncated && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <span>
            {t("orgDashboard.widget.rowsShowing", {
              displayed: visible?.length ?? 0,
              total,
            })}
          </span>
          {available > ROW_LIMIT && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll
                ? t("orgDashboard.widget.showLess")
                : t("orgDashboard.widget.showAll")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default WidgetCard;
