"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/blocks/EmptyState";
import { useTranslation } from "@/lib/i18n/client";

type DataSourceErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DataSourceError({
  error,
  reset,
}: DataSourceErrorProps) {
  const { t } = useTranslation("database");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Data source error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] p-6 pt-0">
      <EmptyState
        icon={AlertTriangle}
        iconClassName="h-12 w-12 text-red-400"
        title={t("page.errors.somethingWrong")}
        subtitle={error.message || t("page.errors.unexpectedError")}
        variant="error"
      />
      <Button onClick={reset} variant="outline" className="mt-4">
        {t("page.errors.tryAgain")}
      </Button>
    </div>
  );
}
