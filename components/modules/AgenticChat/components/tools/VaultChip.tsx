"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import type { VaultBlock } from "../../types";
import { bareToolName, getToolMeta, isToolName } from "../../toolMeta";

/** Compact summary of the input params. */
function formatInput(tool: string, input: Record<string, string>): string {
  if (isToolName(tool, "vault_grep")) {
    const pattern = input.pattern || "";
    const dir = input.directory;
    return dir ? `"${pattern}" in ${dir}/` : `"${pattern}"`;
  }
  if (isToolName(tool, "vault_glob")) return input.pattern || "";
  if (isToolName(tool, "vault_read")) return input.path || "";
  return "";
}

export const VaultChip = ({
  block,
  isLoading,
  isFirst,
  isLast,
}: Readonly<{
  block: VaultBlock;
  isLoading?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(block.tool);
  const label = t(`vault.chip.${bareToolName(block.tool)}`, {
    defaultValue: meta.label,
  });
  const inputLabel = formatInput(block.tool, block.input);
  const hasOutput = block.output.length > 0;
  const isError = block.output.startsWith("Error:");

  return (
    <div
      className={cn(
        "w-full border border-indigo-200 bg-indigo-50/50 text-left transition-colors dark:border-indigo-800 dark:bg-indigo-950/30",
        isFirst !== false && "rounded-t-lg",
        isLast !== false && "rounded-b-lg",
        !isFirst && "border-t-0",
      )}
    >
      <div className="flex items-center px-3 py-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <Icon
            name="ChevronRight"
            size="xxs"
            className={cn(
              "shrink-0 text-slate-400 transition-transform dark:text-slate-500",
              !hasOutput &&
                Object.keys(block.input).length === 0 &&
                "invisible",
              expanded && "rotate-90",
            )}
          />
          {isLoading ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <span
                className="h-2 w-2 rounded-full bg-indigo-400"
                style={{ animation: "sqlPulse 1.4s step-end infinite" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-indigo-400"
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
                isError ? "bg-red-400" : "bg-indigo-500",
              )}
            />
          )}
          <Icon
            name={meta.icon}
            size="xxs"
            className="shrink-0 text-indigo-500 dark:text-indigo-400"
          />
          <span className="shrink-0 text-indigo-600 dark:text-indigo-400">
            {label}
          </span>
          {inputLabel && (
            <span className="truncate text-slate-500 dark:text-slate-400">
              {inputLabel}
            </span>
          )}
          {block.durationMs != null && (
            <span className="ml-1 shrink-0 whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
              {block.durationMs >= 1000
                ? `${(block.durationMs / 1000).toFixed(1)} s`
                : `${block.durationMs} ms`}
            </span>
          )}
        </button>
      </div>
      {expanded && (hasOutput || Object.keys(block.input).length > 0) && (
        <div className="max-h-[400px] overflow-auto border-t border-indigo-200 dark:border-indigo-800">
          <div className="space-y-3 p-3 font-mono text-xs">
            {Object.keys(block.input).length > 0 && (
              <div>
                <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Input
                </div>
                <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {Object.entries(block.input)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")}
                </pre>
              </div>
            )}
            {hasOutput && (
              <div>
                <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Output
                </div>
                <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {block.output}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
