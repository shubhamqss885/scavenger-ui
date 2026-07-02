import { Skeleton } from "@/components/ui/skeleton";

export const VaultLoadingSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Sidebar skeleton — visible by default, hidden in narrow containers
          (drawer is closed by default). Mirrors VaultContent's flip so the
          wide-screen layout is the first paint. */}
      <div className="w-64 shrink-0 border-r @max-4xl:hidden">
        {/* Header */}
        <div className="flex items-center gap-1.5 border-b px-3 py-1.5">
          <Skeleton className="h-8 w-20" />
          <div className="flex-1" />
          <Skeleton className="rounded h-6 w-6" />
        </div>

        {/* Directory groups */}
        {[1, 2, 3].map((dir) => (
          <div key={dir}>
            {/* Directory header */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-4" />
            </div>
            {/* File items */}
            {dir === 1 &&
              [1, 2, 3].map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-2 px-3 py-1.5 pl-8"
                >
                  <Skeleton className="h-3.5 w-3.5" />
                  <Skeleton
                    className="h-3"
                    style={{ width: `${60 + file * 20}px` }}
                  />
                </div>
              ))}
            {dir === 2 &&
              [1, 2].map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-2 px-3 py-1.5 pl-8"
                >
                  <Skeleton className="h-3.5 w-3.5" />
                  <Skeleton
                    className="h-3"
                    style={{ width: `${70 + file * 15}px` }}
                  />
                </div>
              ))}
          </div>
        ))}

        {/* Audit row */}
        <div className="mt-2 border-t pt-1">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>

      {/* Content panel skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
};
