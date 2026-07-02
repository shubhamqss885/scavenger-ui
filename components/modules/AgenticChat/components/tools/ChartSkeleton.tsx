"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Sized to AgenticChart's default render height (see getAgenticChartHeight in
// AgenticChart.tsx — bar 320px, pie 340px, default 360px). A 320px floor keeps
// layout shift minimal for the rare cold-cache race before the recharts chunk
// arrives. Only shown when the chunk hasn't been preloaded yet.
const ChartSkeleton = () => (
  <div className="flex h-full w-full flex-col">
    <Skeleton className="mx-auto mb-3 h-5 w-1/3" />
    <Skeleton className="min-h-[320px] w-full flex-1 rounded-md" />
  </div>
);

export default ChartSkeleton;
