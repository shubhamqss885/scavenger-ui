"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import LazyCodeHighlighter from "@/components/ui/lazy-code-highlighter";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { formatSql, copyToClipboard } from "../../../utils";

type SqlTabContentProps = Readonly<{
  sql: string;
}>;

export const SqlTabContent = ({ sql }: SqlTabContentProps) => {
  const { t } = useTranslation("agentic-chat");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const formattedSql = useMemo(() => formatSql(sql), [sql]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleCopy = useCallback(() => {
    copyToClipboard(sql);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [sql]);

  return (
    <div className="mt-2">
      <div className="relative rounded-lg border bg-slate-50 dark:bg-slate-900">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 absolute z-50 right-1 top-1",
            copied
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
          )}
          onClick={handleCopy}
          title={t("sql.copySql")}
        >
          <Icon name={copied ? "Check" : "Copy"} size="xs" />
        </Button>
        <LazyCodeHighlighter
          language="sql"
          styleName="coy"
          customStyle={{
            backgroundColor: "transparent",
            margin: 0,
            padding: "0.75rem",
            lineHeight: "1.625",
          }}
          codeTagProps={{
            style: {
              backgroundColor: "transparent",
              fontFamily: "monospace",
              fontSize: "13px",
            },
          }}
          wrapLines
          wrapLongLines
        >
          {formattedSql}
        </LazyCodeHighlighter>
      </div>
    </div>
  );
};
