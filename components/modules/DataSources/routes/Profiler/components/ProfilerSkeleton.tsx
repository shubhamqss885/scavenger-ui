"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Reusable card header skeleton
function CardHeaderSkeleton({ titleWidth = "w-40" }: { titleWidth?: string }) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-2">
        <Skeleton className="rounded h-6 w-6" />
        <Skeleton className={`h-6 ${titleWidth}`} />
      </div>
    </CardHeader>
  );
}

// Reusable table skeleton
function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {new Array(columns).fill(0).map((_, i) => (
              <th key={`header-col-${i + 1}`} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-full max-w-[100px]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {new Array(rows).fill(0).map((_, i) => (
            <tr key={`row-${i + 1}`} className="border-b">
              {new Array(columns).fill(0).map((_, j) => (
                <td key={`cell-${i + 1}-${j + 1}`} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[80px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Metric skeleton for DatasetOverview
function MetricSkeleton() {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-1.5">
        <Skeleton className="rounded h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-1 h-5 w-24" />
    </div>
  );
}

// Progress metric skeleton for DataQuality/TopCorrelations
function ProgressMetricSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="rounded h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function ProfilerSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-6 pb-10">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Skeleton className="rounded h-6 w-6" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* DataQualityScore Card */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-28 rounded-full" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <Skeleton className="h-14 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DatasetOverview Card */}
            <Card>
              <CardHeaderSkeleton titleWidth="w-40" />
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <MetricSkeleton />
                  <MetricSkeleton />
                  <MetricSkeleton />
                </div>
              </CardContent>
            </Card>

            {/* DataPreview Card - Hidden for now */}
            {/* <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableSkeleton columns={6} rows={5} />
              </CardContent>
            </Card> */}

            {/* DataQuality & TopCorrelations Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* DataQuality Card */}
              <Card>
                <CardHeaderSkeleton titleWidth="w-32" />
                <CardContent>
                  <div className="space-y-4">
                    <ProgressMetricSkeleton />
                    <ProgressMetricSkeleton />
                    <ProgressMetricSkeleton />
                  </div>
                </CardContent>
              </Card>

              {/* TopCorrelations Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="rounded h-6 w-6" />
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ProgressMetricSkeleton />
                    <ProgressMetricSkeleton />
                    <ProgressMetricSkeleton />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ColumnAnalysis Card */}
            <Card>
              <CardHeaderSkeleton titleWidth="w-36" />
              <CardContent>
                {/* Tab bar */}
                <div className="mb-4 grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  <Skeleton className="h-9 rounded-md" />
                  <Skeleton className="h-9 rounded-md" />
                  <Skeleton className="h-9 rounded-md" />
                </div>
                {/* Table */}
                <TableSkeleton columns={7} rows={5} />
              </CardContent>
            </Card>

            {/* Data Quality Alerts Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="rounded h-6 w-6" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {new Array(3).fill(0).map((_, i) => (
                    <div
                      key={`alert-skeleton-${i + 1}`}
                      className="space-y-2 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="rounded h-4 w-4" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="ml-6 h-4 w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
