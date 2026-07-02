"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "./TableSkeleton";
import { TableFooterSkeleton } from "./TableFooterSkeleton";

type DataLoadingSkeletonProps = Readonly<{
  rows?: number;
  columns?: number;
  pageSize?: number;
}>;

export function DataLoadingSkeleton({
  rows = 40,
  columns = 11,
  pageSize = 50,
}: DataLoadingSkeletonProps) {
  return (
    <div className="flex h-0 min-h-full flex-col">
      {/* Header with controls skeleton */}
      <div className="border-b py-[7.5px]">
        <div className="flex items-center gap-3 px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" /> {/* "Table:" label */}
            <Skeleton className="h-8 w-fit sm:w-[300px]" />{" "}
            {/* Table selector */}
          </div>
          <Skeleton className="h-8 w-24" /> {/* Filter button */}
        </div>
      </div>

      {/* Table content skeleton */}
      <div className="w-full flex-1 overflow-auto">
        <TableSkeleton rows={Math.min(pageSize, rows)} columns={columns} />
      </div>

      {/* Footer with Pagination skeleton */}
      <div className="border-t">
        <TableFooterSkeleton />
      </div>
    </div>
  );
}
