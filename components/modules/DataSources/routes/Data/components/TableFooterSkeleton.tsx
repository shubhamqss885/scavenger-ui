"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TableFooterSkeleton() {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 bg-slate-50"
      style={{ height: 41 }}
    >
      {/* Left - Page size selector */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" /> {/* "Rows per page:" */}
        <Skeleton className="h-8 w-[70px]" /> {/* Select dropdown */}
      </div>
      {/* Center - Showing info */}
      <Skeleton className="h-4 w-36" /> {/* "Showing X-Y of Z" */}
      {/* Right - Navigation buttons */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded" /> {/* First page */}
        <Skeleton className="h-8 w-8 rounded" /> {/* Previous */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-8" /> {/* "Page" */}
          <Skeleton className="h-8 w-12 rounded" /> {/* Page input */}
          <Skeleton className="h-4 w-12" /> {/* "of X" */}
        </div>
        <Skeleton className="h-8 w-8 rounded" /> {/* Next */}
        <Skeleton className="h-8 w-8 rounded" /> {/* Last page */}
      </div>
    </div>
  );
}
