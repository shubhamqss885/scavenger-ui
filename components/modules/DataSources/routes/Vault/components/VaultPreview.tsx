"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTranslation } from "@/lib/i18n/client";
import { useVault } from "../context/VaultContext";

const GoldenQueryPreview = ({
  sql,
  resultSummary,
}: {
  sql: string | null;
  resultSummary: string | null;
}) => {
  const { t } = useTranslation("database");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyIcon = copied ? "Check" : "Copy";
  const copyLabel = copied ? t("vault.copied") : t("vault.copy");

  return (
    <div className="space-y-4">
      {sql && (
        <div className="overflow-hidden rounded-lg border bg-gray-950">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
            <span className="text-xs font-medium text-gray-400">
              {t("vault.sql")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex h-auto items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            >
              <Icon name={copyIcon} size="xs" className="text-inherit" />
              {copyLabel}
            </Button>
          </div>
          <SyntaxHighlighter
            language="sql"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "transparent",
              fontSize: "0.875rem",
            }}
          >
            {sql}
          </SyntaxHighlighter>
        </div>
      )}
      {resultSummary && (
        <p className="text-sm text-muted-foreground">{resultSummary}</p>
      )}
    </div>
  );
};

export const VaultPreview = () => {
  const { t } = useTranslation("database");
  const { selectedFile, stripMetaLines } = useVault();

  if (!selectedFile) return null;

  const isGoldenQuery = selectedFile.directory === "golden_queries";
  const displayTitle =
    selectedFile.title ||
    selectedFile.path?.split("/").pop() ||
    t("vault.untitled");

  const hasTags =
    (selectedFile.tables?.length ?? 0) > 0 ||
    (selectedFile.columns?.length ?? 0) > 0;

  const parseGoldenQuery = (content: string) => {
    const cleaned = stripMetaLines(content);
    const sql = /```sql\n([\s\S]*?)```/i.exec(cleaned)?.[1]?.trim() ?? null;
    const resultSummary =
      /\*\*Result summary:\*\*\s*(.*)/.exec(cleaned)?.[1]?.trim() ?? null;
    return { sql, resultSummary };
  };

  return (
    <div className="w-full p-6">
      <div className="mb-4">
        <h3 className="truncate text-base font-semibold">{displayTitle}</h3>
      </div>

      {hasTags && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selectedFile.tables?.map((tbl) => (
            <span
              key={tbl}
              className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-700"
            >
              {tbl}
            </span>
          ))}
          {selectedFile.columns?.map((col) => (
            <span
              key={col}
              className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-700"
            >
              {col}
            </span>
          ))}
        </div>
      )}

      {isGoldenQuery ? (
        <GoldenQueryPreview {...parseGoldenQuery(selectedFile.content)} />
      ) : (
        <div className="prose prose-sm prose-gray max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {stripMetaLines(selectedFile.content)}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
