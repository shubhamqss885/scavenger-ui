"use client";

import { Small } from "@/components/ui/typography";
import { NumericalColumnStats } from "@/lib/services/externalDataSourceService";
import { getMetricColor, formatStatValue } from "../../utils";
import { useTranslation } from "@/lib/i18n/client";
import { TableHeaderCell } from "./TableHeaderCell";
import { PercentageCell } from "./PercentageCell";

type NumericalColumnsTableProps = Readonly<{
  data: Record<string, NumericalColumnStats>;
}>;

export const NumericalColumnsTable = ({ data }: NumericalColumnsTableProps) => {
  const { t } = useTranslation("database");

  return (
    <div className="w-0 min-w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.column")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.mean")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.median")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.range")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.stdDev")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.missingPct")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.outliersPct")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.uniquePct")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.uniqueCount")}
            </TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([columnName, stats]) => {
            const missingColors = getMetricColor(stats.null_pct);
            const outlierColors = getMetricColor(stats.outlier_pct);
            return (
              <tr key={columnName} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary text-xs font-semibold">
                      #
                    </span>
                    <Small className="font-medium text-foreground">
                      {columnName}
                    </Small>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {formatStatValue(stats.mean)}
                  </Small>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {formatStatValue(stats.median)}
                  </Small>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {stats.range?.min != null && stats.range?.max != null
                      ? `${stats.range.min} → ${stats.range.max}`
                      : "-"}
                  </Small>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {formatStatValue(stats.standard_deviation)}
                  </Small>
                </td>
                <PercentageCell
                  value={stats.null_pct}
                  indicatorClassName={missingColors.indicator}
                />
                <PercentageCell
                  value={stats.outlier_pct}
                  indicatorClassName={outlierColors.indicator}
                />
                <PercentageCell value={stats.unique_pct} />
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {stats.unique_count?.toLocaleString() ?? "-"}
                  </Small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
