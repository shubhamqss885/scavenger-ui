"use client";

// @deprecated Feedback conversation-history UI — flag-hidden, retained for reference pending cleanup review.

import { Skeleton } from "@/components/ui/skeleton";

export const ConversationHistoryPanelSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-12 w-[60%] rounded-[24px] rounded-br-none" />
      </div>
      {/* Scavenger message skeleton */}
      <div className="flex justify-start">
        <Skeleton className="h-20 w-[75%] rounded-[24px] rounded-bl-none" />
      </div>
      {/* User message skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[50%] rounded-[24px] rounded-br-none" />
      </div>
      {/* Scavenger message skeleton */}
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[70%] rounded-[24px] rounded-bl-none" />
      </div>
    </div>
  );
};
