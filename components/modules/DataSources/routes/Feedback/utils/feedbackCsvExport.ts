import { FeedbackRecord } from "@/lib/services/orgDbFeedbackService";

const CSV_COLUMNS = [
  "type",
  "conversation_id",
  "session_id",
  "prompt",
  "response",
  "feedback",
  "feedback_comment",
  "created_at",
  "user_name",
  "user_email",
  "project_name",
  "generated_sql",
  "visualization",
  "analysis",
  "sql_title",
  "table_data",
  "orgdb_id",
  "sql_explanation",
  "is_resolved",
] as const;

const escapeCsvValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

export const downloadFeedbackAsCsv = (
  records: FeedbackRecord[],
  filename: string,
): void => {
  if (records.length === 0) return;

  const csvContent = [
    CSV_COLUMNS.join(","),
    ...records.map((record) =>
      CSV_COLUMNS.map((col) => {
        const raw = (record as Record<string, unknown>)[col];
        const val =
          typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        return escapeCsvValue(val);
      }).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
