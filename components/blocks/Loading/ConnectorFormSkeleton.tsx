import { Skeleton } from "@/components/ui/skeleton";

const FIELD_COUNT = 5;

const ConnectorFormSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden px-6">
      {/* Page header — matches PageHeader (back arrow + title + help-link CTA) */}
      <div className="mb-6 flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-slate-400 pb-2.5 pt-4">
        <div className="flex min-w-0 items-start gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32 self-center" />
        </div>
        <Skeleton className="h-8 w-44 self-center" />
      </div>

      {/* Form card */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
            {/* Left identity panel */}
            <div className="border-b border-border bg-muted/50 p-5 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>

              {/* Info items — desktop only */}
              <div className="mt-5 hidden space-y-3.5 lg:block">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="mt-px h-3.5 w-3.5 shrink-0" />
                    <div className="flex flex-1 flex-col gap-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2.5 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel: tabs + form fields */}
            <div className="space-y-4 p-5">
              {/* Form/Connection-String tab strip */}
              <div className="flex gap-1">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: FIELD_COUNT }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>

              {/* Test connection row */}
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-8 w-16" />
              </div>

              {/* Submit button */}
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectorFormSkeleton;
