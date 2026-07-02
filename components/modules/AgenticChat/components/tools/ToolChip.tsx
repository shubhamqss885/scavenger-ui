"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import type { ProgressStep } from "../../types";
import { isToolName, isToolCategory, type ToolMeta } from "../../toolMeta";

const EXACT_LABELS: Record<string, string> = {
  "queried knowledge graph": "toolChip.messages.queriedKnowledgeGraph",
  "retrieved schema structure": "toolChip.messages.retrievedSchemaStructure",
  "retrieved table relationships":
    "toolChip.messages.retrievedTableRelationships",
  "found join path": "toolChip.messages.foundJoinPath",
  "retrieved business rules": "toolChip.messages.retrievedBusinessRules",
  "retrieved sql examples": "toolChip.messages.retrievedSqlExamples",
  "updated table description": "toolChip.messages.updatedTableDescription",
  "updated column description": "toolChip.messages.updatedColumnDescription",
  "updated relationship description":
    "toolChip.messages.updatedRelationshipDescription",
  "listed tables": "toolChip.messages.listedTables",
  "sampled table": "toolChip.messages.sampledTable",
  "counted rows": "toolChip.messages.countedRowsFallback",
  "searched metadata": "toolChip.messages.searchedMetadata",
  "saved golden query": "toolChip.messages.savedGoldenQuery",
  "sent to slack": "toolChip.messages.sentToSlack",
  "sent to teams": "toolChip.messages.sentToTeams",
  "parsed connection": "toolChip.messages.parsedConnection",
  "requested credentials": "toolChip.messages.requestedCredentials",
  "tested connection": "toolChip.messages.testedConnection",
  "saved connection script": "toolChip.messages.savedConnectionScript",
};

/** Clean up backend progress messages for display. */
const formatMessage = (
  msg: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  // "ad_fact: 60335 rows" → "Counted 60,335 rows in ad_fact"
  const rowCount = /^(\S+):\s*([\d,]+)\s*rows$/i.exec(msg);

  if (rowCount) {
    return t("toolChip.messages.countedRows", {
      count: rowCount[2],
      table: rowCount[1],
    });
  }
  // "Found 1 tables" → "Found 1 table"
  const tables = /^Found (\d+) tables?$/i.exec(msg);

  if (tables?.[1] === "1") {
    return t("toolChip.messages.foundOneTable");
  }
  // "Returned 1 rows" → "Returned 1 row"
  const returned = /^Returned (\d+) rows$/i.exec(msg);

  if (returned?.[1] === "1") {
    return t("toolChip.messages.returnedOneRow");
  }
  // "Sampled 1 rows from X" → "Sampled 1 row from X"
  const sampled = /^Sampled 1 rows from (.+)$/i.exec(msg);

  if (sampled) {
    return t("toolChip.messages.sampledOneRow", { table: sampled[1] });
  }
  // "Schema loaded" / "Retrieved schema" (history label) → "Database schema loaded"
  if (/^schema loaded$/i.test(msg) || /^retrieved schema$/i.test(msg)) {
    return t("toolChip.messages.schemaLoaded");
  }
  // Remaining generic tool labels from history (meta.label fallback)
  const key = EXACT_LABELS[msg.toLowerCase()];

  if (key) return t(key);
  return msg;
};

/** Format tool input params as compact key=value pairs. */
const formatInput = (input?: Record<string, unknown>): string => {
  if (!input || Object.keys(input).length === 0) return "";
  return Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => {
      const str = typeof v === "string" ? v : JSON.stringify(v);
      const display = str.length > 60 ? str.slice(0, 57) + "..." : str;
      return `${k}: ${display}`;
    })
    .join("\n");
};

export const ToolChip = ({
  step,
  meta,
  isFirst,
  isLast,
}: Readonly<{
  step: ProgressStep;
  meta: ToolMeta;
  isFirst?: boolean;
  isLast?: boolean;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const [expanded, setExpanded] = useState(false);
  const serializedOutput = useMemo(() => {
    if (step.toolOutput?.tableData) {
      return JSON.stringify(step.toolOutput.tableData, null, 2);
    }
    if (step.toolOutput?.raw) {
      return step.toolOutput.raw;
    }
    return "";
  }, [step.toolOutput?.tableData, step.toolOutput?.raw]);
  const icon = meta.icon || "Wrench";
  const isLoading = step.status === "calling";
  const isCancelled = step.status === "cancelled";
  const isError =
    step.message.toLowerCase().includes("failed") ||
    step.message.toLowerCase().includes("error");
  const isFileTool = isToolCategory(step.tool, "file");
  const isExpandableTool =
    isToolName(step.tool, "execute_sql") ||
    isToolName(step.tool, "search_metadata") ||
    isToolName(step.tool, "inspect_database") ||
    isFileTool;
  const hasExpandable =
    isExpandableTool &&
    !!(step.toolInput || step.toolOutput?.tableData || step.toolOutput?.raw);

  return (
    <div
      className={cn(
        "w-full border border-slate-200 bg-white text-left transition-colors dark:border-slate-700 dark:bg-slate-900",
        isFirst !== false && "rounded-t-lg",
        isLast !== false && "rounded-b-lg",
        !isFirst && "border-t-0",
      )}
    >
      <div className="flex items-center px-3 py-1.5">
        <button
          type="button"
          onClick={hasExpandable ? () => setExpanded((v) => !v) : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300",
            hasExpandable
              ? "cursor-pointer hover:text-slate-800 dark:hover:text-slate-100"
              : "cursor-default",
          )}
        >
          <Icon
            name="ChevronRight"
            size="xxs"
            className={cn(
              "shrink-0 text-slate-400 transition-transform dark:text-slate-500",
              !hasExpandable && "invisible",
              expanded && "rotate-90",
            )}
          />
          {isLoading ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <span
                className="h-2 w-2 rounded-full bg-amber-400"
                style={{ animation: "sqlPulse 1.4s step-end infinite" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-amber-400"
                style={{
                  opacity: 0.15,
                  animation: "sqlPulse 1.4s step-end infinite 0.7s",
                }}
              />
            </span>
          ) : (
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                isCancelled
                  ? "bg-slate-300 dark:bg-slate-600"
                  : isError
                    ? "bg-red-400"
                    : "bg-green-500",
              )}
            />
          )}
          <Icon
            name={icon as "Database"}
            size="xxs"
            className="shrink-0 text-slate-500 dark:text-slate-400"
          />
          <span className="truncate text-slate-500 dark:text-slate-400">
            {meta.label &&
            (step.message.toLowerCase().startsWith("working") ||
              step.message === "Done" ||
              step.message === "")
              ? meta.label
              : formatMessage(step.message, t)}
          </span>
          {step.durationMs != null && (
            <span className="ml-1 shrink-0 whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
              {step.durationMs >= 1000
                ? `${(step.durationMs / 1000).toFixed(1)} s`
                : `${step.durationMs} ms`}
            </span>
          )}
        </button>
      </div>
      {expanded && hasExpandable && (
        <div className="max-h-[300px] overflow-auto border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2 p-3 font-mono text-xs">
            <div>
              <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("toolChip.input")}
              </div>
              <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                {step.toolInput && Object.keys(step.toolInput).length > 0
                  ? formatInput(step.toolInput)
                  : "(no parameters)"}
              </pre>
            </div>
            {serializedOutput && (
              <div>
                <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("toolChip.output")}
                </div>
                <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {serializedOutput}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
