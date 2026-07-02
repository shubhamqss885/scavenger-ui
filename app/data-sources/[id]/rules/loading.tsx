import { RulesExamplesLoadingSkeleton } from "@/components/modules/DataSources/components/RulesExamplesLoadingSkeleton";

export default function DataSourceRulesLoading() {
  return (
    <div className="w-full flex flex-col h-0 min-h-full">
      <RulesExamplesLoadingSkeleton />
    </div>
  );
}
