// Agentic chart helpers. Hosts the agentic-specific axis helpers plus
// generic helpers (legend config, axis props, tick math, bar props) that
// were previously shared with the legacy Text2Sql chart utilities.

import type { ChartConfig } from "@/components/ui/chart";

const formatLargeNumber = (num: number): string => {
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (absNum >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (absNum >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

// Rendered char counts driving axis-title offset and rotated-label height.
// maxXLabelLength counts truncated values as 23 (20 chars + "…").
export const getAgenticLabelLengths = (data: any[], xKey: string) => {
  const maxXLabelLength = data.reduce((max, item) => {
    const len = String(item[xKey]).length;
    return Math.max(max, len > 20 ? 23 : len);
  }, 0);

  let maxAbsY = 0;
  for (const item of data) {
    for (const [key, value] of Object.entries(item)) {
      if (key === xKey) continue;
      const num = Number(value);

      if (Number.isFinite(num) && Math.abs(num) > maxAbsY) {
        maxAbsY = Math.abs(num);
      }
    }
  }
  const maxYTickLength = formatLargeNumber(maxAbsY).length;

  return { maxXLabelLength, maxYTickLength };
};

type AgenticXAxisInput = {
  dataKey: string;
  needsRotation: boolean;
  maxLabelLength?: number;
};

// When rotated, labels go fully vertical (-90°) and height scales with
// the widest rendered label (~7px/char at 12px font).
export const getAgenticXAxisProps = ({
  dataKey,
  needsRotation,
  maxLabelLength = 16,
}: AgenticXAxisInput) => {
  const rotatedHeight = Math.min(Math.max(maxLabelLength * 7 + 15, 40), 160);
  return {
    dataKey,
    tickLine: false,
    tickMargin: 0,
    axisLine: false,
    angle: needsRotation ? -90 : 0,
    textAnchor: needsRotation ? "end" : "middle",
    height: needsRotation ? rotatedHeight : 30,
    fontSize: 12,
    minTickGap: 2,
    tickFormatter: (value: string) =>
      value.length > 20 ? `${value.slice(0, 20)}...` : value,
  };
};

// Recharts auto-expands YAxis width to fit tick labels, so long ticks
// already push the title outward. Short ticks leave a narrow zone and
// need a more negative offset to clear them. Calibrated to 2→-16, 4→-4,
// 8→0 — a halving curve: offset = −2^(6−tickLen), clamped.
export const getAgenticYAxisLabelProps = (
  labelValue: string,
  position: "left" | "right" = "left",
  maxTickLength: number = 6,
) => {
  const offsetAbs = Math.max(
    0,
    Math.min(16, Math.round(Math.pow(2, 6 - maxTickLength))),
  );
  return {
    fill: "#404040",
    angle: 270,
    value: labelValue,
    position,
    offset: -offsetAbs,
    fontWeight: 500,
  };
};

// ─────────────────────────────────────────────────────────────────────
// Generic chart helpers (formerly shared with legacy Text2Sql chartUtils).
// ─────────────────────────────────────────────────────────────────────

// For ≤ 4 labels: horizontal bottom legend
const LEGEND_CONFIG_BOTTOM = {
  layout: "horizontal" as const,
  align: "center" as const,
  verticalAlign: "bottom" as const,
  iconType: "circle" as const,
  iconSize: 10,
  wrapperStyle: {
    paddingTop: "18px",
  },
};

// For > 4 labels: vertical right legend
const LEGEND_CONFIG_RIGHT = {
  layout: "vertical" as const,
  align: "right" as const,
  verticalAlign: "middle" as const,
  iconType: "circle" as const,
  iconSize: 10,
  wrapperStyle: {
    paddingLeft: "15px",
    width: "180px",
    maxHeight: "100%",
    overflowY: "auto" as const,
  },
};

// Calculate dynamic legend width based on label lengths
export const calculateLegendWidth = (
  labels: string[],
  maxWidth: number = 200,
  minWidth: number = 80,
): number => {
  if (!labels.length) return maxWidth;
  const maxLabelLength = Math.max(
    ...labels.map((label) => Math.min(label?.length || 0, 20)),
  );
  const charWidth = 16;
  const calculatedWidth = maxLabelLength * charWidth;
  return Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
};

// Helper to get legend config based on label count
export const getLegendConfig = (
  labelCount: number,
  isPieChart: boolean = false,
  labels?: string[],
) => {
  if (isPieChart) {
    const width = labels ? calculateLegendWidth(labels) : 180;
    return {
      ...LEGEND_CONFIG_RIGHT,
      wrapperStyle: {
        ...LEGEND_CONFIG_RIGHT.wrapperStyle,
        width: `${width}px`,
      },
    };
  }

  if (labelCount <= 4) {
    return LEGEND_CONFIG_BOTTOM;
  }

  const width = labels ? calculateLegendWidth(labels) : 180;
  return {
    ...LEGEND_CONFIG_RIGHT,
    wrapperStyle: {
      ...LEGEND_CONFIG_RIGHT.wrapperStyle,
      width: `${width}px`,
    },
  };
};

// Legend label formatter with text truncation
export const truncateLegendLabel = (
  value: string,
  maxLength: number = 19,
): string => {
  if (!value) return "";
  return value.length > maxLength
    ? `${value.substring(0, maxLength)}...`
    : value;
};

// Compute human-friendly axis ticks for a numeric axis.
// Why: recharts delegates tick picking to D3, which accepts 2.5 × 10^k
// as a "nice" step — producing 1.5k / 3k / 4.5k. This helper restricts
// the step to {1, 2, 5} × 10^k so ticks always land on round numbers.
export const computeNiceTicks = (
  max: number,
  targetCount: number = 5,
): number[] => {
  if (!Number.isFinite(max) || max <= 0) return [0];
  const rough = max / targetCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const stepMultiplier = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = stepMultiplier * mag;
  const niceMax = Math.ceil(max / step) * step;
  const count = Math.round(niceMax / step) + 1;
  const precision = Math.max(0, -Math.floor(Math.log10(step)));
  return Array.from({ length: count }, (_, i) =>
    parseFloat((i * step).toFixed(precision)),
  );
};

export const getCommonChartConfig = (data: any[], xKey: string) => {
  const needsRotation = data.some((item) => {
    const label = String(item[xKey]);
    return label.length > 10 || data.length > 13;
  });
  return {
    needsRotation,
    margin: { top: 20, right: 5, left: 5, bottom: 0 },
    containerClassName: "h-full w-full",
    style: {},
  };
};

export const getCommonYAxisProps = () => ({
  tickMargin: 0,
  axisLine: false,
  tickLine: false,
  tickFormatter: (value: any) => {
    if (typeof value === "string") {
      return value.length > 13 ? `${value.slice(0, 13)}...` : value;
    }
    if (typeof value === "number") {
      return formatLargeNumber(value);
    }
    return value;
  },
});

export const getCommonXAxisLabelProps = (
  labelValue: string,
  position: "bottom" | "top" = "bottom",
) => ({
  textAnchor: "middle",
  fill: "#404040",
  value: labelValue,
  position,
  fontWeight: 500,
  offset: 0,
});

export const getBarProps = (
  key: string,
  config: ChartConfig,
  index: number,
) => ({
  dataKey: key,
  fill: config[key]?.color ?? `hsl(var(--chart-${(index % 24) + 1}))`,
  name: key,
  radius: [4, 4, 0, 0] as [number, number, number, number],
});
