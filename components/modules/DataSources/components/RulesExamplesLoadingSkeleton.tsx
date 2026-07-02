import { Skeleton } from "@/components/ui/skeleton";

export const RulesExamplesLoadingSkeleton = () => {
  return (
    <>
      {/* Header skeleton */}
      <div className="w-full flex items-center justify-between h-12 border-b px-6">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Search Input skeleton */}
          <div className="relative w-64">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Show Only Active Toggle skeleton */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-9" />
            <Skeleton className="h-3 w-20" />
          </div>

          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border rounded-lg bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
