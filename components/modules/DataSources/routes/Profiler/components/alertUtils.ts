import { DataQualityAlert } from "@/lib/services/externalDataSourceService";

export type AlertSeverity = "critical" | "warning" | "info";

// Severity order for sorting alerts (lower = more severe)
const SEVERITY_ORDER: Record<DataQualityAlert["code"], number> = {
  HIGH_NULL_COLUMNS: 0,
  HIGH_MISSING_DATA: 1,
  MIXED_TYPE_COLUMN: 2,
  HIGH_OUTLIER_PERCENTAGE: 3,
  ZERO_VARIANCE: 4,
  CONSTANT_COLUMNS: 5,
  DUPLICATE_ROWS: 6,
  SEPARATOR_CURRENCY_DETECTED: 7,
  TRAILING_WHITESPACE: 8,
};

// Severity styles for alert card backgrounds
export const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: "bg-destructive/10 border-destructive/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  info: "bg-muted/50 border-border",
};

// Get severity level based on alert code
export const getAlertSeverity = (
  code: DataQualityAlert["code"],
): AlertSeverity => {
  if (
    code.includes("HIGH") ||
    code.includes("MIXED_TYPE") ||
    code.includes("NULL")
  )
    return "critical";
  if (code.includes("ZERO_VARIANCE") || code.includes("DUPLICATE"))
    return "warning";
  return "info";
};

// Get badge color variant based on alert code
// Aligned with getAlertSeverity: critical -> destructive, warning -> default, info -> secondary
export const getSeverityColor = (code: DataQualityAlert["code"]) => {
  if (
    code.includes("HIGH") ||
    code.includes("MIXED_TYPE") ||
    code.includes("NULL")
  ) {
    return "destructive";
  }
  if (code.includes("ZERO_VARIANCE") || code.includes("DUPLICATE")) {
    return "default";
  }
  return "secondary";
};

// Get icon name based on alert code
export const getAlertIcon = (code: DataQualityAlert["code"]) => {
  if (code.includes("NULL")) return "FileX";
  if (code.includes("MISSING")) return "AlertCircle";
  if (code.includes("MIXED")) return "AlertTriangle";
  if (code.includes("SEPARATOR") || code.includes("CURRENCY"))
    return "DollarSign";
  if (code.includes("DUPLICATE")) return "Copy";
  if (code.includes("OUTLIER")) return "Target";
  if (code.includes("ZERO_VARIANCE") || code.includes("CONSTANT"))
    return "Minimize2";
  if (code.includes("TRAILING")) return "AlignLeft";
  return "AlertTriangle";
};

// Sort alerts by severity (most severe first)
export const sortAlertsBySeverity = (
  alerts: DataQualityAlert[],
): DataQualityAlert[] => {
  return [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.code] ?? 99) - (SEVERITY_ORDER[b.code] ?? 99),
  );
};
