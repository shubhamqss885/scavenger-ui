// @deprecated Used only by the flag-hidden Feedback view — retained for reference pending cleanup review.
import { format as formatDate } from "date-fns";
import {
  FeedbackRecord,
  TextToSqlFeedbackRecord,
} from "@/lib/services/orgDbFeedbackService";

const typeLabels: Record<string, string> = {
  chat: "CHAT",
  text_to_sql: "SQL",
  text_to_nosql: "NOSQL",
};

export function formatFeedbackForClipboard(record: FeedbackRecord): string {
  const lines: string[] = [];

  const isTextToSql =
    record.type === "text_to_sql" || record.type === "text_to_nosql";
  const isPositive = record.feedback === "+1";

  const sqlRecord = isTextToSql ? (record as TextToSqlFeedbackRecord) : null;

  // Header section
  lines.push("=== FEEDBACK DETAILS ===");
  lines.push("");

  // Basic info
  lines.push(`Type: ${typeLabels[record.type] ?? record.type}`);
  lines.push(`Feedback: ${isPositive ? "Positive (+1)" : "Negative (-1)"}`);
  lines.push(`Date: ${formatDate(new Date(record.created_at), "PPpp")}`);
  lines.push("");

  // User & Project
  lines.push("--- User & Project ---");
  lines.push(`User: ${record.user_name}`);
  lines.push(`Email: ${record.user_email}`);
  lines.push(`Project: ${record.project_name}`);
  lines.push("");

  // Prompt & Response
  lines.push("--- Prompt ---");
  lines.push(record.prompt);
  lines.push("");

  if (record.response) {
    lines.push("--- Response ---");
    lines.push(record.response);
    lines.push("");
  }

  // SQL-specific fields
  if (isTextToSql && sqlRecord) {
    if (sqlRecord.generated_sql) {
      lines.push("--- Generated SQL ---");
      lines.push(sqlRecord.generated_sql);
      lines.push("");
    }

    if (sqlRecord.sql_title) {
      lines.push(`SQL Title: ${sqlRecord.sql_title}`);
    }

    if (sqlRecord.sql_explanation) {
      lines.push("--- SQL Explanation ---");
      lines.push(sqlRecord.sql_explanation);
      lines.push("");
    }

    if (sqlRecord.analysis) {
      lines.push("--- Analysis ---");
      lines.push(sqlRecord.analysis);
      lines.push("");
    }

    if (sqlRecord.table_data) {
      try {
        const tableData = JSON.parse(sqlRecord.table_data);

        if (Array.isArray(tableData) && tableData.length > 0) {
          lines.push(`--- Query Results (${tableData.length} rows) ---`);
          lines.push(JSON.stringify(tableData, null, 2));
          lines.push("");
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    if (sqlRecord.visualization) {
      lines.push(`Visualization: ${sqlRecord.visualization}`);
    }
  }

  // User comment
  if (record.feedback_comment) {
    lines.push("--- User Comment ---");
    lines.push(record.feedback_comment);
    lines.push("");
  }

  // Session IDs
  lines.push("--- Session Info ---");
  lines.push(`Conversation ID: ${record.conversation_id}`);
  lines.push(`Session ID: ${record.session_id}`);

  return lines.join("\n");
}
