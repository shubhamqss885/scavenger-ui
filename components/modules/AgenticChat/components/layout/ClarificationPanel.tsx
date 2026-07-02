"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

export const ClarificationPanel = ({
  question,
  options,
  allowMultiple,
  collapsed,
  selectedOptions,
  onOptionClick,
  onCollapse,
  onExpand,
}: Readonly<{
  question: string;
  options: string[];
  allowMultiple: boolean;
  collapsed: boolean;
  selectedOptions: Set<string>;
  onOptionClick: (option: string) => void;
  onCollapse: () => void;
  onExpand: () => void;
}>) => {
  const { t } = useTranslation("agentic-chat");

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="w-full px-3 pb-0 pt-2 text-left"
      >
        <span className="cursor-pointer text-xs text-primary hover:underline">
          {t("clarification.collapsed")}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-2 px-3 pb-1 pt-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-medium text-primary">
            {t("clarification.title")}
          </p>
          <div className="prose prose-sm max-w-none text-sm text-slate-700 dark:prose-invert prose-code:before:content-none prose-code:after:content-none dark:text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {question}
            </ReactMarkdown>
          </div>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded ml-2 shrink-0 p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label={t("clarification.dismiss")}
        >
          <Icon name="X" size="xs" />
        </button>
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const isSelected = selectedOptions.has(option);
            const hasSingleSelection =
              !allowMultiple && selectedOptions.size > 0;
            const isGreyedOut = hasSingleSelection && !isSelected;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onOptionClick(option)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-slate-900 dark:text-slate-100"
                    : isGreyedOut
                      ? "border-slate-200 bg-slate-50/50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700",
                )}
              >
                <span className="shrink-0">
                  {allowMultiple ? (
                    <span
                      className={cn(
                        "rounded inline-flex h-4 w-4 items-center justify-center border",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 dark:border-slate-600",
                      )}
                    >
                      <Icon
                        name="Check"
                        size="xxs"
                        className={cn(
                          "h-2.5 w-2.5 min-w-0",
                          !isSelected && "invisible",
                        )}
                        strokeWidth={3}
                      />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                        isSelected
                          ? "border-primary"
                          : "border-slate-300 dark:border-slate-600",
                      )}
                    >
                      {isSelected ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                  )}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
