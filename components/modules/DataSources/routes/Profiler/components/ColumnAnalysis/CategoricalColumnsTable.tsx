"use client";

import { Icon } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CategoricalColumnStats } from "@/lib/services/externalDataSourceService";
import {
  getMetricColor,
  DISTRIBUTION_BAR_OPACITIES,
  MAX_TOP_VALUES_DISPLAYED,
  MIN_SEGMENT_WIDTH_FOR_TEXT,
  OTHER_SEGMENT_BG,
  formatPercentage,
} from "../../utils";
import { useTranslation } from "@/lib/i18n/client";
import { TableHeaderCell } from "./TableHeaderCell";
import { PercentageCell } from "./PercentageCell";

type CategoricalColumnsTableProps = Readonly<{
  data: Record<string, CategoricalColumnStats>;
  totalRows: number;
}>;

type DistributionSegment = {
  label: string;
  count: number;
  width: number;
  color: string;
  isOther?: boolean;
};

export const CategoricalColumnsTable = ({
  data,
  totalRows,
}: CategoricalColumnsTableProps) => {
  const { t } = useTranslation("database");

  const calculateSegments = (
    stats: CategoricalColumnStats,
  ): DistributionSegment[] => {
    const segments: DistributionSegment[] = [];

    // Get top 3 values
    const top3 = (stats.top_5_values ?? []).slice(0, MAX_TOP_VALUES_DISPLAYED);
    const top3Count = top3.reduce((sum, item) => sum + item.count, 0);

    // Calculate null count and "other" count
    const nullCount = Math.round(totalRows * (stats.null_pct / 100));
    const otherCount = Math.max(0, totalRows - top3Count - nullCount);

    // Add top value segments
    top3.forEach((item, i) => {
      const width = totalRows > 0 ? (item.count / totalRows) * 100 : 0;
      segments.push({
        label: item.value,
        count: item.count,
        width,
        color: `hsla(var(--primary), ${DISTRIBUTION_BAR_OPACITIES[i]})`,
      });
    });

    // Add "Other" segment if there are remaining values
    if (otherCount > 0) {
      const width = (otherCount / totalRows) * 100;
      segments.push({
        label: t("profiler.columnAnalysis.other"),
        count: otherCount,
        width,
        color: "",
        isOther: true,
      });
    }

    return segments;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-0 min-w-full overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col />
            <col />
            <col />
            <col className="w-[50%]" />
          </colgroup>
          <thead>
            <tr className="border-b bg-muted/50">
              <TableHeaderCell>
                {t("profiler.columnAnalysis.headers.column")}
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
              <TableHeaderCell>
                {t("profiler.columnAnalysis.headers.distribution")}
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([columnName, stats]) => {
              const missingColors = getMetricColor(stats.null_pct);
              const segments = calculateSegments(stats);

              return (
                <tr key={columnName} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon
                        name="Type"
                        size="xs"
                        variant="primary"
                        className="shrink-0"
                      />
                      <Small className="font-medium text-foreground truncate">
                        {columnName}
                      </Small>
                    </div>
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
                  <td className="px-4 py-3">
                    <div className="w-full bg-muted rounded-full h-6 flex overflow-hidden">
                      {segments.map((segment, i) => {
                        const showLabel =
                          segment.width >= MIN_SEGMENT_WIDTH_FOR_TEXT;
                        const percentage = formatPercentage(segment.width);

                        return (
                          <Tooltip key={`${segment.label}-${i}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-full flex items-center justify-center overflow-hidden transition-all cursor-default ${
                                  segment.isOther ? OTHER_SEGMENT_BG : ""
                                }`}
                                style={{
                                  width: `${segment.width}%`,
                                  backgroundColor: segment.isOther
                                    ? undefined
                                    : segment.color,
                                }}
                              >
                                {showLabel && (
                                  <span
                                    className={`text-xs font-medium truncate px-1.5 ${
                                      segment.isOther
                                        ? "text-muted-foreground"
                                        : "text-primary-foreground"
                                    }`}
                                  >
                                    {segment.label}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-center">
                              <div className="font-medium">{segment.label}</div>
                              <div className="text-muted text-[10px] font-normal">
                                {segment.count.toLocaleString()} ({percentage})
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
};
