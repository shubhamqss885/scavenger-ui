"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { FileStage } from "./useMultiFileIngest";

type Props = Readonly<{
  label: string;
  status: FileStage;
  statusText: string;
}>;

// One per-file row in the ingest progress list. Filename on the left, status
// text + icon on the right.
export const FileStatusRow = ({ label, status, statusText }: Props) => {
  const isDone = status === "done";
  const isFailed = status === "failed";

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
      <p
        className="min-w-0 flex-1 truncate text-xs font-medium text-foreground"
        title={label}
      >
        {label}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-[11px]",
            isFailed ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {statusText}
        </span>
        <Icon
          name={isDone ? "CircleCheck" : isFailed ? "X" : "Loader2"}
          size="xs"
          className={cn(
            "shrink-0",
            isDone && "text-emerald-500",
            isFailed && "text-destructive",
            !isDone && !isFailed && "animate-spin text-primary",
          )}
        />
      </div>
    </div>
  );
};
