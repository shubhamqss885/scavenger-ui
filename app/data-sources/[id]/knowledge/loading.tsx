import { Skeleton } from "@/components/ui/skeleton";

const SUB_TAB_COUNT = 5;

export default function DataSourceKnowledgeLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Sub-tab strip — matches Knowledge module's tab bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex gap-1">
          {Array.from({ length: SUB_TAB_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="hidden h-3 w-44 sm:block" />
      </div>

      {/* Graph view placeholder — matches the default "graph" sub-tab */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-64 w-64 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
