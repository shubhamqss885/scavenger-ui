import { Skeleton } from "@/components/ui/skeleton";

export default function DataSourceDiagramLoading() {
  return (
    <div className="flex flex-col h-full p-6">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Diagram area skeleton */}
      <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden p-8">
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-8">
            {/* Mock diagram skeleton with connected boxes */}
            <div className="flex items-center gap-8">
              <Skeleton className="h-32 w-48 rounded" />
              <div className="h-0.5 w-16 bg-slate-200" />
              <Skeleton className="h-32 w-48 rounded" />
            </div>
            <div className="flex items-center gap-8">
              <Skeleton className="h-32 w-48 rounded" />
              <div className="h-0.5 w-16 bg-slate-200" />
              <Skeleton className="h-32 w-48 rounded" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-32 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
