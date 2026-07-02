import { Skeleton } from "@/components/ui/skeleton";

const HomeSkeleton = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center px-6">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
        {/* Greeting */}
        <Skeleton className="h-9 w-64 rounded-md" />

        {/* Input bar area */}
        <div className="w-full max-w-3xl">
          <div className="rounded-lg border border-sidebar-border bg-white shadow-md">
            {/* Textarea + send button row */}
            <div className="flex items-center gap-2 p-2 pl-3">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            {/* Toolbar row */}
            <div className="flex min-h-[46px] items-center gap-1 border-t border-sidebar-border px-2 py-1.5">
              <Skeleton className="h-8 w-32 rounded-md" />
              <div className="flex-1" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>

          {/* Reserved space for suggested prompts */}
          <div className="mt-3 min-h-[210px]" />
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
