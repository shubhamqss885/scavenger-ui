// Percentage thresholds for metric color coding
const METRIC_THRESHOLDS = {
  EXCELLENT: 1, // < 1% = green (excellent)
  GOOD: 5, // < 5% = primary (good)
  WARNING: 10, // < 10% = amber (warning)
  // >= 10% = red (critical)
} as const;

const METRIC_COLORS = {
  excellent: {
    bg: "bg-green-600",
    text: "text-green-600",
    indicator: "[&>div]:bg-green-600",
  },
  good: {
    bg: "bg-primary",
    text: "text-primary",
    indicator: "[&>div]:bg-primary",
  },
  warning: {
    bg: "bg-amber-500",
    text: "text-amber-600",
    indicator: "[&>div]:bg-amber-500",
  },
  critical: {
    bg: "bg-red-600",
    text: "text-red-600",
    indicator: "[&>div]:bg-red-600",
  },
} as const;

export type MetricColorLevel = keyof typeof METRIC_COLORS;

// Get color classes based on a percentage value
// Lower percentages are better (for missing data, outliers, etc.)
export const getMetricColor = (
  value: number,
): (typeof METRIC_COLORS)[MetricColorLevel] => {
  if (value < METRIC_THRESHOLDS.EXCELLENT) return METRIC_COLORS.excellent;
  if (value < METRIC_THRESHOLDS.GOOD) return METRIC_COLORS.good;
  if (value < METRIC_THRESHOLDS.WARNING) return METRIC_COLORS.warning;
  return METRIC_COLORS.critical;
};

// Opacity values for stacked distribution bars (primary color with decreasing opacity)
export const DISTRIBUTION_BAR_OPACITIES = [1, 0.7, 0.4] as const;

// Maximum number of top values to display in distribution charts
export const MAX_TOP_VALUES_DISPLAYED = 3;

// Minimum segment width (%) to show text label inside
export const MIN_SEGMENT_WIDTH_FOR_TEXT = 8;

// Background color class for "Other" segment in distribution bar
export const OTHER_SEGMENT_BG = "bg-muted-foreground/20";

// Default decimal places for percentage display
const PERCENTAGE_DECIMALS = 1;

// Default decimal places for statistical values (mean, median, std dev)
const STATS_DECIMALS = 2;

// Format a number with appropriate decimal places for statistics
export const formatStatValue = (value: number | null | undefined): string => {
  if (value == null) return "-";
  return value.toFixed(STATS_DECIMALS);
};

// Format a percentage value
export const formatPercentage = (value: number | null | undefined): string => {
  if (value == null) return "-";
  return `${value.toFixed(PERCENTAGE_DECIMALS)}%`;
};

// Standard width class for inline progress bars
const PROGRESS_BAR_WIDTH = "w-20";

// Standard height class for inline progress bars
const PROGRESS_BAR_HEIGHT = "h-1.5";

/** Combined progress bar size classes */
export const PROGRESS_BAR_SIZE = `${PROGRESS_BAR_WIDTH} ${PROGRESS_BAR_HEIGHT}`;
