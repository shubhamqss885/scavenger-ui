"use client";

import { Icon } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import { DatetimeColumnStats } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import { TableHeaderCell } from "./TableHeaderCell";
import { PercentageCell } from "./PercentageCell";
import { getMetricColor } from "../../utils";

type DatetimeColumnsTableProps = Readonly<{
  data: Record<string, DatetimeColumnStats>;
}>;

export const DatetimeColumnsTable = ({ data }: DatetimeColumnsTableProps) => {
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
              {t("profiler.columnAnalysis.headers.minDate")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.maxDate")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.spanDays")}
            </TableHeaderCell>
            <TableHeaderCell>
              {t("profiler.columnAnalysis.headers.missingPct")}
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
            return (
              <tr key={columnName} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Icon name="Calendar" size="xs" variant="primary" />
                    <Small className="font-medium text-foreground">
                      {columnName}
                    </Small>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground">
                    {stats.range?.min ?? "-"}
                  </Small>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground">
                    {stats.range?.max ?? "-"}
                  </Small>
                </td>
                <td className="px-4 py-3">
                  <Small className="text-foreground tabular-nums">
                    {stats.range?.min && stats.range?.max
                      ? `${Math.ceil((new Date(stats.range.max).getTime() - new Date(stats.range.min).getTime()) / (1000 * 60 * 60 * 24)).toLocaleString()} ${t("profiler.columnAnalysis.headers.days")}`
                      : "-"}
                  </Small>
                </td>
                <PercentageCell
                  value={stats.null_pct}
                  indicatorClassName={missingColors.indicator}
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
