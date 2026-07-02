"use client";

import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useTranslation } from "@/lib/i18n/client";
import { EmptyState } from "@/components/blocks/EmptyState";
import { Button } from "@/components/ui/button";
import { RulesExamplesLoadingSkeleton } from "../../components/RulesExamplesLoadingSkeleton";
import { DatabaseExamplesContent } from "./components/DatabaseExamplesContent";
import { AlertTriangle } from "lucide-react";

type Props = Readonly<{
  readOnly?: boolean;
}>;

export const DataSourceExamplesModule = ({ readOnly }: Props) => {
  const { t } = useTranslation("database");
  const { loading, error } = useOrgDbConfig();
  const { loading: contextLoading, error: contextError } =
    useDatabaseDescription();

  if (error || contextError) {
    return (
      <div className="mx-auto flex h-0 min-h-full max-w-7xl items-center justify-center">
        <div className="space-y-4">
          <EmptyState
            icon={AlertTriangle}
            title={t("queryExamples.error.title") || "Unable to load examples"}
            subtitle={
              t("queryExamples.error.description") ||
              "There was a problem loading the examples. Please try again."
            }
          />
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              {t("common.retry") || "Retry"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || contextLoading) {
    return (
      <div className="flex h-0 min-h-full w-full flex-col">
        <RulesExamplesLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-0 min-h-full w-full flex-col">
      <DatabaseExamplesContent readOnly={readOnly} />
    </div>
  );
};
