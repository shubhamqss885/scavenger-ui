import { Skeleton } from "@/components/ui/skeleton";

const ProjectLoadingSkeleton = () => {
  return (
    <div className="relative z-40 h-screen w-full px-6">
      {/* Header with tabs and actions */}
      <div className="mb-4 flex items-center justify-between pt-3">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-[245px] rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* Chat messages area */}
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-1 justify-end">
          <div className="max-w-[85%] text-right">
            <Skeleton className="mb-2 ml-auto h-4 w-24 rounded-lg" />
            <Skeleton className="h-[52px] w-72 max-w-full rounded-[24px] rounded-br-none" />
          </div>
        </div>
        <div className="flex flex-1 justify-start">
          <div className="max-w-[90%] text-left sm:max-w-4xl">
            <Skeleton className="mb-2 mr-auto h-4 w-24 rounded-lg" />
            <Skeleton className="h-[52px] w-[45rem] max-w-full rounded-[24px] rounded-bl-none" />
          </div>
        </div>
        <div className="flex flex-1 justify-end">
          <div className="max-w-[85%] text-right">
            <Skeleton className="mb-2 ml-auto h-4 w-24 rounded-lg" />
            <Skeleton className="h-[52px] w-[30rem] max-w-full rounded-[24px] rounded-br-none" />
          </div>
        </div>
        <div className="flex flex-1 justify-start">
          <div className="max-w-[90%] text-left sm:max-w-4xl">
            <Skeleton className="mb-2 mr-auto h-4 w-24 rounded-lg" />
            <Skeleton className="h-20 w-[45rem] max-w-full rounded-[24px] rounded-bl-none" />
          </div>
        </div>
      </div>

      {/* Chat input area */}
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="absolute bottom-3 z-50 mx-6 h-20 w-[calc(100%-48px)] max-w-[1100px] pr-3">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="ml-auto h-10 w-10 rounded-lg" />
          </div>
        </Skeleton>
      </div>
    </div>
  );
};

export default ProjectLoadingSkeleton;
