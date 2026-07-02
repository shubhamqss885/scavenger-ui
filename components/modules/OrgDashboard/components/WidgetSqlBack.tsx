"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { SqlTabContent } from "@/components/modules/AgenticChat/components/tools/SqlDetailSheet/SqlTabContent";

type WidgetSqlBackProps = Readonly<{
  title: string;
  sql: string;
  onBack: () => void;
}>;

// Back face of a flipped WidgetCard: shows the widget's SQL read-only.
// Reuses SqlTabContent (syntax highlight + copy). Lazy-loaded by WidgetCard so
// react-syntax-highlighter stays out of the dashboard route's First Load JS.
const WidgetSqlBack = ({ title, sql, onBack }: WidgetSqlBackProps) => {
  const { t } = useTranslation("dashboard");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0 sm:pb-0">
        <CardTitle className="truncate text-sm font-medium">{title}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onBack}
          title={t("orgDashboard.widget.backToWidget")}
        >
          <Icon name="X" size="xs" />
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto">
        <SqlTabContent sql={sql} />
      </CardContent>
    </Card>
  );
};

export default WidgetSqlBack;
