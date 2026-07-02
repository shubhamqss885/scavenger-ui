"use client";

import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { RulesExamplesLoadingSkeleton } from "@/components/modules/DataSources/components/RulesExamplesLoadingSkeleton";
import { EmptyState } from "@/components/blocks/EmptyState";
import { AlertTriangle } from "lucide-react";
import { DatabaseRulesContent } from "./components/DatabaseRulesContent";

type Props = Readonly<{
  readOnly?: boolean;
}>;

export const DataSourceRulesModule = ({ readOnly }: Props) => {
  const { loading, error } = useOrgDbConfig();
  const { loading: contextLoading } = useDatabaseDescription();

  if (error) {
    return (
      <div className="mx-auto mt-4 max-w-[1400px] px-6 pb-6">
        <EmptyState
          icon={AlertTriangle}
          iconClassName="h-12 w-12 text-red-400"
          title={error}
          variant="error"
        />
      </div>
    );
  }

  if (loading || contextLoading) {
    return <RulesExamplesLoadingSkeleton />;
  }

  return (
    <div className="flex h-0 min-h-full w-full flex-col">
      <DatabaseRulesContent readOnly={readOnly} />
    </div>
  );
};
