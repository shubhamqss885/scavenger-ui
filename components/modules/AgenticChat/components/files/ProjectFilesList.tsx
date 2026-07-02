"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Small, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";
import { formatDistanceToNow } from "date-fns";
import type { ProjectFile } from "@/lib/services/agenticChatService";
import { useFileIndexingEvents } from "@/lib/context/EventsContext/hooks/useFileIndexingEvents";
import type { FileIndexingProgressData } from "@/lib/context/EventsContext/types";
import {
  INDEXING_ACTIVE_STAGES,
  INDEXING_FAILED_STAGES,
} from "@/components/modules/AgenticChat/types";

type ProjectFilesListProps = Readonly<{
  files: ProjectFile[];
  isLoading: boolean;
  onDelete: (fileId: string) => Promise<void>;
}>;

export const ProjectFilesList = ({
  files,
  isLoading,
  onDelete,
}: ProjectFilesListProps) => {
  const { t } = useTranslation("agentic-chat");
  const { events: indexingEvents } = useFileIndexingEvents();

  const indexingByFileId = useMemo(
    () =>
      Object.fromEntries(indexingEvents.map((e) => [e.data.file_id, e.data])),
    [indexingEvents],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <Skeleton className="rounded h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <Icon name="FileX" size="xl" variant="default" className="mb-2" />
        <Small className="text-sm">{t("files.empty.title")}</Small>
        <Muted className="text-xs">{t("files.empty.subtitle")}</Muted>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {t("files.count", { count: files.length })}
      </p>

      <div className="space-y-2">
        {files.map((file) => (
          <FileCard
            key={file.file_id}
            file={file}
            indexing={indexingByFileId[file.file_id]}
            onDelete={() => onDelete(file.file_id)}
          />
        ))}
      </div>
    </div>
  );
};

type FileCardProps = Readonly<{
  file: ProjectFile;
  indexing?: FileIndexingProgressData;
  onDelete: () => void;
}>;

const FileCard = ({ file, indexing, onDelete }: FileCardProps) => {
  const { t } = useTranslation("agentic-chat");

  const uploadedAgo = file.uploaded_at
    ? formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })
    : null;

  // The bar shows only while indexing is actively in progress. On completion
  // ("done") the card collapses back to its normal metadata view (rows • time);
  // a failed/dead file shows the "Failed" label.
  const isIndexing = indexing && INDEXING_ACTIVE_STAGES.has(indexing.stage);
  const isFailed = !!indexing && INDEXING_FAILED_STAGES.has(indexing.stage);
  const stageLabel = indexing ? t(`files.indexing.${indexing.stage}`) : null;

  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="rounded flex h-10 w-10 items-center justify-center bg-green-100 dark:bg-green-900/30">
        <Icon
          name="FileSpreadsheet"
          size="md"
          className="text-green-600 dark:text-green-400"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.filename}>
          {file.filename}
        </p>

        {isIndexing ? (
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stageLabel}</span>
              <span>{indexing.progress}%</span>
            </div>
            <Progress value={indexing.progress} className="h-1.5" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isFailed ? (
              <span className="text-destructive">{stageLabel}</span>
            ) : (
              <>
                {file.total_rows > 0 && (
                  <span>{t("files.rows", { count: file.total_rows })}</span>
                )}
                {(file.sheets?.length ?? 0) > 0 ? (
                  <>
                    {file.total_rows > 0 && <span>•</span>}
                    <span>
                      {t("files.sheets", { count: file.sheets?.length ?? 0 })}
                    </span>
                  </>
                ) : (
                  file.total_rows === 0 && (
                    <span className="italic">{t("files.noRowData")}</span>
                  )
                )}
                {uploadedAgo && (
                  <>
                    <span>•</span>
                    <span>{uploadedAgo}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title={t("files.delete")}
            >
              <Icon name="Trash2" size="sm" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("files.deleteConfirm.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("files.deleteConfirm.description", {
                  filename: file.filename,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("files.deleteConfirm.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("files.deleteConfirm.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
