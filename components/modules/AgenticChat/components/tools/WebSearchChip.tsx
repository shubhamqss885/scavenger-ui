"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import type { ProgressStep } from "../../types";
import ReactMarkdown from "react-markdown";

/** Parse web search results to extract sources for citation display. */
const extractSources = (
  raw: string,
): Array<{ title: string; url: string; snippet: string }> => {
  const sources: Array<{ title: string; url: string; snippet: string }> = [];

  // Pattern: "1. **Title**\n   Source: domain.com\n   snippet..."
  const sourcePattern =
    /(\d+)\.\s+\*\*(.+?)\*\*\s*\n\s*Source:\s*(\S+)\s*\n\s*([\s\S]+?)(?=\n\d+\.|$)/g;
  let match;

  while ((match = sourcePattern.exec(raw)) !== null) {
    const title = match[2].trim();
    const domain = match[3].trim();
    const snippet = match[4].trim();

    // Try to construct a URL from domain - the backend includes just the domain
    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    sources.push({ title, url, snippet });
  }

  return sources;
};

export const WebSearchChip = ({
  step,
  isFirst,
  isLast,
}: Readonly<{
  step: ProgressStep;
  isFirst?: boolean;
  isLast?: boolean;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const [expanded, setExpanded] = useState(false);

  const { summary, sources, hasResults } = useMemo(() => {
    const raw = step.toolOutput?.raw || "";

    // Extract summary (everything before "**Sources:**")
    const summaryMatch = raw.match(
      /\*\*Summary:\*\*\s*([\s\S]+?)(?=\n\n\*\*Sources)/,
    );
    const summary = summaryMatch?.[1]?.trim() || "";

    // Extract sources
    const sources = extractSources(raw);

    // Check if we have any meaningful results (summary or sources or raw content)
    const hasResults =
      summary.length > 0 || sources.length > 0 || raw.length > 0;

    return { summary, sources, hasResults };
  }, [step.toolOutput?.raw]);

  const query = step.toolInput?.query as string | undefined;
  const isLoading = step.status === "calling";
  const isCancelled = step.status === "cancelled";
  const isError =
    step.message.toLowerCase().includes("failed") ||
    step.message.toLowerCase().includes("error");

  return (
    <div
      className={cn(
        "w-full border border-slate-200 bg-slate-50/50 text-left transition-colors dark:border-slate-700 dark:bg-slate-900/30",
        isFirst !== false && "rounded-t-lg",
        isLast !== false && "rounded-b-lg",
        !isFirst && "border-t-0",
      )}
    >
      <div className="flex items-center px-3 py-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <Icon
            name="ChevronRight"
            size="xxs"
            className={cn(
              "shrink-0 transition-transform",
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
            name="Globe"
            size="xxs"
            className="shrink-0 text-slate-500 dark:text-slate-400"
          />
          <span className="truncate text-slate-500 dark:text-slate-400">
            {isLoading
              ? t("webSearch.searching")
              : isCancelled
                ? t("webSearch.cancelled")
                : isError
                  ? step.message
                  : sources.length > 0
                    ? t("webSearch.completed", { count: sources.length })
                    : hasResults
                      ? t("webSearch.completedWithResults", "Found results")
                      : t("webSearch.noResults", "No results found")}
          </span>
          {step.durationMs != null && (
            <span className="ml-auto shrink-0 tabular-nums text-slate-400 dark:text-slate-500">
              {step.durationMs >= 1000
                ? `${(step.durationMs / 1000).toFixed(1)}s`
                : `${step.durationMs}ms`}
            </span>
          )}
        </button>
      </div>

      {expanded && (
        <div className="max-h-[400px] overflow-auto border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-3 p-3 text-xs">
            {/* Query */}
            {query && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("webSearch.query")}
                </div>
                <p className="text-slate-600 dark:text-slate-300">{query}</p>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("webSearch.summary")}
                </div>
                <p className="text-slate-600 dark:text-slate-300">{summary}</p>
              </div>
            )}

            {/* Sources */}
            {sources.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("webSearch.sources")}
                </div>
                <ul className="space-y-2">
                  {sources.map((source, idx) => (
                    <li
                      key={idx}
                      className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <Icon name="ExternalLink" size="xxs" />
                        {source.title}
                      </a>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        {source.snippet}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw output fallback if no structured data */}
            {!summary && !sources.length && step.toolOutput?.raw && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("webSearch.results")}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {step.toolOutput.raw}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
