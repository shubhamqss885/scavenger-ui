"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableSkeletonProps = Readonly<{
  rows?: number;
  columns?: number;
  className?: string;
}>;

export function TableSkeleton({
  rows = 30,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("max-w-0", className)}>
      <table className="border-collapse">
        <thead className="sticky top-0 ">
          <tr className="bg-gray-100 border-b border-gray-300">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <th
                key={`header-${colIndex}`}
                className="border-r border-gray-300 last:border-r-0 px-2 py-[5px] text-left font-semibold"
                style={{
                  width: 150,
                  minWidth: 50,
                  maxWidth: 500,
                }}
              >
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className={cn(
                "border-b border-gray-200 last:border-b-0",
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50",
              )}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="border-r border-gray-200 px-2 py-1"
                  style={{
                    width: 150,
                    minWidth: 50,
                    maxWidth: 500,
                  }}
                >
                  <Skeleton
                    className="h-3 my-0.5"
                    style={{
                      width: `${Math.floor(Math.random() * 40) + 40}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
