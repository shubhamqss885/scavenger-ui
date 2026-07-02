"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useFileIndexingEvents } from "@/lib/context/EventsContext/hooks/useFileIndexingEvents";
import { INDEXING_ACTIVE_STAGES } from "@/components/modules/AgenticChat/types";

export type PendingFile = {
  filename: string;
  fileId: string;
};

export { INDEXING_ACTIVE_STAGES as ACTIVE_STAGES };

type Props = Readonly<{
  files: PendingFile[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  clearAllLabel: string;
  uploadingFilenames?: string[];
}>;

const PendingFilesBar = ({
  files,
  onRemove,
  onClearAll,
  clearAllLabel,
  uploadingFilenames = [],
}: Props) => {
  const { events: indexingEvents } = useFileIndexingEvents();

  const indexingByFileId = useMemo(
    () =>
      Object.fromEntries(indexingEvents.map((e) => [e.data.file_id, e.data])),
    [indexingEvents],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-sidebar-border px-3 py-2.5">
      {uploadingFilenames.map((filename) => (
        <FileChip
          key={`uploading-${filename}`}
          filename={filename}
          progress={0}
        />
      ))}
      {files.map(({ filename, fileId }, index) => {
        const indexing = indexingByFileId[fileId];
        const isActive = indexing && INDEXING_ACTIVE_STAGES.has(indexing.stage);
        let progress: number | null = null;
        if (isActive) progress = indexing.progress;
        else if (indexing?.stage === "done") progress = 100;
        return (
          <FileChip
            key={fileId}
            filename={filename}
            progress={progress}
            failed={indexing?.stage === "failed"}
            onRemove={() => onRemove(index)}
          />
        );
      })}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto text-xs text-slate-400 hover:text-slate-600"
      >
        {clearAllLabel}
      </button>
    </div>
  );
};

type FileChipProps = Readonly<{
  filename: string;
  progress: number | null;
  failed?: boolean;
  onRemove?: () => void;
}>;

const FileChip = ({ filename, progress, failed, onRemove }: FileChipProps) => {
  // The spinner is the loading indicator while the file uploads/indexes; a
  // failed file shows a red icon. We don't render a progress bar: the S3
  // transfer reports no byte progress and indexing % is coarse, so a bar would
  // just sit near 0 and then jump to done — more misleading than helpful.
  const isLoading = progress !== null && progress < 100;

  let iconColorClass = "text-slate-400";
  if (failed) iconColorClass = "text-destructive";
  else if (isLoading) iconColorClass = "animate-spin text-primary";

  return (
    <div className="flex max-w-48 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Icon
        name={isLoading ? "LoaderCircle" : "FileText"}
        size="xs"
        className={cn("shrink-0", iconColorClass)}
      />
      <span
        className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-200"
        title={filename}
      >
        {filename}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${filename}`}
          className="rounded shrink-0 p-0.5 text-slate-400 hover:text-slate-600"
        >
          <Icon name="X" size="xxs" className="text-current" />
        </button>
      )}
    </div>
  );
};

export default PendingFilesBar;
