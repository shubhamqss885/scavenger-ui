import { Skeleton } from "@/components/ui/skeleton";

const SECTION_COUNT = 2;
const CARDS_PER_SECTION = 8;
const PILL_COUNT = 6;

const ConnectorsSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden px-6">
      {/* Page header — matches PageHeader (toggle + title/subtitle + right-side CTA) */}
      <div className="mb-2 flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-slate-400 pb-2.5 pt-4">
        <div className="flex min-w-0 items-start gap-2">
          <Skeleton className="h-8 w-8" />
          <div className="flex flex-col gap-1.5 pt-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72 max-w-[calc(100vw-6rem)]" />
          </div>
        </div>
        <Skeleton className="h-8 w-44 self-center" />
      </div>

      {/* Filter row — pills + search */}
      <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
          {Array.from({ length: PILL_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full max-w-sm" />
      </div>

      {/* Card grid sections */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <div className="space-y-6">
          {Array.from({ length: SECTION_COUNT }).map((_, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-3 w-32 shrink-0" />
                <div className="h-px flex-1 bg-border/50" />
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: CARDS_PER_SECTION }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2.5 rounded-sm border border-border bg-card p-4"
                  >
                    <Skeleton className="rounded-xl h-11 w-11" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectorsSkeleton;
