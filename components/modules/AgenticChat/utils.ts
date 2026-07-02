import { format } from "sql-formatter";
import type { ChartBlock, ProgressStep, SqlBlock } from "./types";

export const isJSON = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
};

export const tryParseJSON = (str: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const formatSql = (sql: string): string => {
  try {
    return format(sql, {
      language: "mysql",
      keywordCase: "upper",
      indentStyle: "standard",
      tabWidth: 2,
      expressionWidth: 300,
    });
  } catch {
    return sql;
  }
};

export const extractSqlTitle = (sql: string): string | null => {
  const singleLine = /^\s*--\s*(.+)/m.exec(sql);

  if (singleLine) return singleLine[1].trim();

  const block = /\/\*\s*(.+?)\s*\*\//.exec(sql);

  if (block) return block[1].trim();

  const fromMatch = /\bFROM\s+["'`]?(\w+)["'`]?/i.exec(sql);

  if (fromMatch) return fromMatch[1];

  return null;
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const tableToCsv = (data: Record<string, string>[]): string => {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${(row[h] || "").replaceAll(/"/g, '""')}"`).join(","),
  );
  return [headers.join(","), ...rows].join("\n");
};

// TSV: tab-separated, with tabs/newlines in cells flattened to spaces so
// Excel / Google Sheets don't split them into extra columns or rows.
const tsvCell = (v: string) => v.replace(/\t/g, " ").replace(/\r?\n/g, " ");

const tableToTsv = (data: Record<string, string>[]): string => {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => tsvCell(row[h] || "")).join("\t"),
  );
  return [headers.map(tsvCell).join("\t"), ...rows].join("\n");
};

const htmlCell = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/\r?\n/g, "<br>");

const tableToHtml = (data: Record<string, string>[]): string => {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const head = `<tr>${headers.map((h) => `<th>${htmlCell(h)}</th>`).join("")}</tr>`;
  const body = data
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${htmlCell(row[h] || "")}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table>${head}${body}</table>`;
};

// Writes both an HTML <table> and a TSV fallback so pasting into Excel,
// Google Sheets, etc. produces a properly columnized table.
export const copyTableToClipboard = async (
  data: Record<string, string>[],
): Promise<void> => {
  const tsv = tableToTsv(data);

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      const html = tableToHtml(data);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([tsv], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // fall through to plain-text TSV
    }
  }
  await navigator.clipboard.writeText(tsv);
};

export const toSqlBlock = (step: ProgressStep): SqlBlock | null => {
  const sql = step.toolInput?.sql as string | undefined;

  if (!sql) return null;

  return {
    sql,
    table_data: step.toolOutput?.tableData ?? [],
    durationMs: step.durationMs,
    is_error: step.toolOutput?.isError,
    is_cancelled: step.status === "cancelled",
    tool_call_id: step.id,
  };
};

export const toChartBlock = (step: ProgressStep): ChartBlock | null => {
  if (step.toolOutput?.chartSpec == null) return null;

  return {
    chart_id: step.id,
    chart_spec: step.toolOutput.chartSpec,
    sql: (step.toolInput?.sql as string) ?? "",
  };
};
