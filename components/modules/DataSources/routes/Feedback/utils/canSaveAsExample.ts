import { FeedbackRecord } from "@/lib/services/orgDbFeedbackService";

// Determines whether a feedback record is eligible to be saved as a query example.
// Requires: SQL type and non-empty generated SQL.
export function canSaveAsExample(record: FeedbackRecord): boolean {
  const isSqlType =
    record.type === "text_to_sql" || record.type === "text_to_nosql";

  return isSqlType && !!record.generated_sql;
}
