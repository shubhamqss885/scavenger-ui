import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import { PluggableList } from "unified";
import { cn } from "@/lib/utils";
import { formatSql } from "../../utils";

const REMARK_PLUGINS: PluggableList = [[remarkGfm, { singleTilde: false }]];

const MARKDOWN_COMPONENTS: Components = {
  p: ({ ...props }) => <p className="my-2.5 leading-normal" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
  a: ({ ...props }) => (
    <a
      className="text-primary underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  h1: ({ ...props }) => (
    <h1
      className="mb-[0.5em] mt-[1.5em] text-xl font-semibold tracking-tight"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="mb-[0.5em] mt-[1.5em] text-base font-semibold tracking-tight"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3 className="mb-[0.4em] mt-[1.25em] text-sm font-bold" {...props} />
  ),
  ul: ({ ...props }) => <ul className="my-2.5 list-disc pl-4" {...props} />,
  ol: ({ ...props }) => <ol className="my-2.5 list-decimal pl-4" {...props} />,
  li: ({ ...props }) => <li className="my-1" {...props} />,
  code: ({ className, children, ...props }) => {
    const language = /language-(\w+)/.exec(className || "")?.[1];

    if (language) {
      const raw = String(children).replace(/\n$/, "");
      const code = language === "sql" ? formatSql(raw) : raw;
      return (
        <SyntaxHighlighter
          language={language}
          style={coy}
          customStyle={{
            backgroundColor: "transparent",
            margin: 0,
            lineHeight: "1.3",
          }}
          codeTagProps={{
            style: {
              backgroundColor: "transparent",
              fontFamily: "monospace",
              fontSize: "12px",
            },
          }}
          wrapLines
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      );
    }
    // Block code (multiline) — minimal styling, pre wrapper handles the rest
    if (String(children).includes("\n")) {
      return (
        <code className="font-mono text-[12px] leading-[1.3]" {...props}>
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code
        className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[13px] leading-[1.4] dark:bg-slate-700"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <div className="my-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-50 p-4 pt-1.5 dark:bg-slate-900">
      {children}
    </div>
  ),
  table: ({ ...props }) => (
    <table
      className="my-3 w-full border-collapse text-[13px] leading-[1.4]"
      {...props}
    />
  ),
  th: ({ ...props }) => (
    <th
      className="border border-slate-300 bg-slate-100 px-3 py-1.5 text-left font-medium dark:border-slate-600 dark:bg-slate-700"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td
      className="border border-slate-200 px-3 py-1.5 dark:border-slate-700"
      {...props}
    />
  ),
  hr: ({ ...props }) => <hr className="my-4" {...props} />,
};

type MarkdownContentProps = Readonly<{
  children: string;
  className?: string;
}>;

const MarkdownContent = ({ children, className }: MarkdownContentProps) => (
  <div
    className={cn(
      "max-w-none break-words leading-normal [&>:first-child]:mt-0 [&>:last-child]:mb-0",
      className,
    )}
  >
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      components={MARKDOWN_COMPONENTS}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default React.memo(MarkdownContent);
