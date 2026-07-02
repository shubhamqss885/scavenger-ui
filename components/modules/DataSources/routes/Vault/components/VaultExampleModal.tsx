"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { ExampleType } from "./VaultIntro";

type Props = Readonly<{
  type: ExampleType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

type Example = Readonly<{
  question: string;
  withContext: { sql: string; result: string; status: "correct" };
  withoutContext: { sql: string; result: string; status: "wrong" };
}>;

type DocumentExample = Readonly<{
  question: string;
  withContext: string;
  withoutContext: string;
}>;

const SQL_EXAMPLES: Record<"rules" | "goldenQueries", Example> = {
  rules: {
    question: "What's our total revenue for Q1?",
    withContext: {
      sql: `SELECT SUM(price * qty) - SUM(internal_revenues) AS total_revenue
FROM orders
WHERE order_date >= '2026-01-01' AND order_date < '2026-04-01'`,
      result: "$2,450,000",
      status: "correct",
    },
    withoutContext: {
      sql: `SELECT SUM(price * qty) AS total_revenue
FROM orders
WHERE order_date >= '2026-01-01' AND order_date < '2026-04-01'`,
      result: "$3,100,000 (includes internal revenues)",
      status: "wrong",
    },
  },
  goldenQueries: {
    question: "Show me all orders from last month with product details",
    withContext: {
      sql: `SELECT o.order_date, o.customer_name, o.total_amount,
       p.sku, p.name AS product_name, p.category
FROM sales.orders AS o
JOIN sales.order_items AS oi ON o.order_id = oi.order_id
JOIN catalog.products AS p ON oi.product_id = p.product_id
WHERE o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND o.order_date < DATE_TRUNC('month', CURRENT_DATE)
  AND o.status = 'completed'
ORDER BY o.order_date DESC
LIMIT 500`,
      result: "1,247 orders returned",
      status: "correct",
    },
    withoutContext: {
      sql: `SELECT * FROM orders o
JOIN products p ON o.product_id = p.id
WHERE order_date > '2026-03-01'`,
      result: "Error: column order_date is ambiguous",
      status: "wrong",
    },
  },
};

const DOCUMENT_EXAMPLE: DocumentExample = {
  question: "Which customers should we prioritize for Q1?",
  withContext: `Based on the Q1 Marketing Strategy document, you should prioritize enterprise accounts in the DACH region. These are flagged for the new product launch campaign.

I can pull a list of enterprise accounts with their recent order activity if that helps.`,
  withoutContext: `I can show you customers by revenue or order count. What metric would you like to use for prioritization?`,
};

export const VaultExampleModal = ({ type, open, onOpenChange }: Props) => {
  const { t } = useTranslation("database");
  const [showWithContext, setShowWithContext] = useState(true);

  const typeLabel = t(`vault.tiles.${type}.title`).toLowerCase();
  const isDocument = type === "documents";
  const question = isDocument
    ? DOCUMENT_EXAMPLE.question
    : SQL_EXAMPLES[type].question;

  const renderToggle = () => (
    <div className="flex gap-2">
      <button
        onClick={() => setShowWithContext(true)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          showWithContext
            ? "bg-green-500/10 text-green-700"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        <Icon
          name="Check"
          size="xs"
          className={showWithContext ? "text-green-700" : "text-inherit"}
        />
        {t("vault.tiles.withContext", { type: typeLabel })}
      </button>
      <button
        onClick={() => setShowWithContext(false)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          !showWithContext
            ? "bg-red-500/10 text-red-700"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        <Icon
          name="X"
          size="xs"
          className={!showWithContext ? "text-red-700" : "text-inherit"}
        />
        {t("vault.tiles.withoutContext", { type: typeLabel })}
      </button>
    </div>
  );

  const renderSqlContent = () => {
    const example = SQL_EXAMPLES[type as "rules" | "goldenQueries"];
    const data = showWithContext ? example.withContext : example.withoutContext;
    const isCorrect = data.status === "correct";

    return (
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">SQL</p>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {data.sql}
          </pre>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3",
            isCorrect ? "bg-green-500/10" : "bg-red-500/10",
          )}
        >
          <Icon
            name={isCorrect ? "Check" : "X"}
            size="sm"
            className={isCorrect ? "text-green-700" : "text-red-700"}
          />
          <span
            className={cn(
              "text-sm font-medium",
              isCorrect ? "text-green-700" : "text-red-700",
            )}
          >
            {data.result}
          </span>
        </div>
      </div>
    );
  };

  const renderDocumentContent = () => {
    const text = showWithContext
      ? DOCUMENT_EXAMPLE.withContext
      : DOCUMENT_EXAMPLE.withoutContext;

    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {t("vault.tiles.response")}
        </p>
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">
          {text}
        </pre>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(`vault.tiles.${type}.title`)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t("vault.tiles.question")}
            </p>
            <p className="text-sm font-medium">{question}</p>
          </div>

          {renderToggle()}

          {isDocument ? renderDocumentContent() : renderSqlContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
