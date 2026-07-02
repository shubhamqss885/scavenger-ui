"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import {
  useDashboardStats,
  useDashboardStatsState,
} from "@/lib/context/DashboardStatsProvider";
import { toast } from "sonner";
import { uploadProjectFile } from "@/lib/services/agenticChatService";
import {
  ALLOWED_FILE_ACCEPT,
  ALLOWED_FILE_EXTENSION_SET,
  MAX_FILE_SIZE_BYTES,
} from "@/components/modules/AgenticChat/types";

const BYTES_PER_MB = 1024 * 1024;

type ProjectFilesButtonProps = Readonly<{
  projectId?: string;
  fileCount?: number;
  onProjectNeeded?: () => Promise<string | null>;
  onUploadStart?: (filename: string) => void;
  onUploadComplete?: (
    projectId: string,
    filename: string,
    fileId: string,
  ) => void;
  onUploadError?: () => void;
  onUploadFile?: (file: File) => Promise<void>;
  disabled?: boolean;
  className?: string;
}>;

export const ProjectFilesButton = ({
  projectId,
  fileCount = 0,
  onProjectNeeded,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  onUploadFile,
  disabled = false,
  className,
}: ProjectFilesButtonProps) => {
  const { t } = useTranslation("agentic-chat");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { increaseStorageUsage } = useDashboardStats();
  const {
    isStorageLimitReached,
    dashboardStats: { storageUsage, totalStorage },
  } = useDashboardStatsState();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (!files || files.length === 0) return;

      // Copy files array BEFORE resetting input (resetting clears the FileList)
      const fileArray = Array.from(files);

      // Reset input so same file can be selected again
      e.target.value = "";

      // Validate all files first
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (!ALLOWED_FILE_EXTENSION_SET.has(ext ?? "")) {
          toast.error(
            t("files.errors.invalidTypeFile", { filename: file.name }),
          );
          continue;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(t("files.errors.tooLargeFile", { filename: file.name }));
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      if (isStorageLimitReached) {
        toast.error(t("files.storageLimitReached"));
        return;
      }

      if (totalStorage > 0) {
        const incomingMb =
          validFiles.reduce((sum, f) => sum + f.size, 0) / BYTES_PER_MB;

        if (storageUsage + incomingMb > totalStorage) {
          toast.error(t("files.storageLimitExceeded"));
          return;
        }
      }

      setIsUploading(true);

      // If custom upload handler provided (e.g., from context), use it
      if (onUploadFile) {
        try {
          for (const file of validFiles) {
            await onUploadFile(file);
          }
        } finally {
          setIsUploading(false);
        }
        return;
      }

      // Otherwise use built-in upload logic (for home page where project needs to be created)
      onUploadStart?.(validFiles[0].name);

      try {
        let targetProjectId: string | undefined = projectId;

        // If no projectId, we need to create one first
        if (!targetProjectId && onProjectNeeded) {
          const newProjectId = await onProjectNeeded();

          if (!newProjectId) {
            setIsUploading(false);
            onUploadError?.();
            return;
          }

          targetProjectId = newProjectId;
        }

        if (!targetProjectId) {
          toast.error(t("files.errors.uploadFailed"));
          setIsUploading(false);
          onUploadError?.();
          return;
        }

        // Upload all valid files in parallel
        await Promise.all(
          validFiles.map(async (file) => {
            try {
              const response = await uploadProjectFile(targetProjectId!, file);

              increaseStorageUsage(file.size / BYTES_PER_MB);
              onUploadComplete?.(
                targetProjectId!,
                response.filename,
                response.file_id,
              );
            } catch (error: unknown) {
              const err = error as { response?: { status?: number } };

              if (err.response?.status === 409) {
                toast.error(
                  t("files.errors.alreadyExists", { filename: file.name }),
                );
              } else if (err.response?.status === 413) {
                toast.error(t("files.errors.tooLarge"));
              } else if (err.response?.status === 400) {
                toast.error(t("files.errors.invalidType"));
              } else if (err.response?.status === 503) {
                toast.error(t("files.errors.unavailable"));
              } else {
                toast.error(t("files.errors.uploadFailed"));
                onUploadError?.();
              }
            }
          }),
        );
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };

        if (err.response?.status === 413) {
          toast.error(t("files.errors.tooLarge"));
        } else if (err.response?.status === 400) {
          toast.error(t("files.errors.invalidType"));
        } else if (err.response?.status === 503) {
          toast.error(t("files.errors.unavailable"));
        } else {
          toast.error(t("files.errors.uploadFailed"));
        }
        onUploadError?.();
      } finally {
        setIsUploading(false);
      }
    },
    [
      projectId,
      onProjectNeeded,
      onUploadStart,
      onUploadComplete,
      onUploadError,
      onUploadFile,
      isStorageLimitReached,
      storageUsage,
      totalStorage,
      increaseStorageUsage,
      t,
    ],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_ACCEPT}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClick}
              disabled={disabled || isUploading}
              className={className}
            >
              {isUploading ? (
                <Icon name="LoaderCircle" size="xs" className="animate-spin" />
              ) : (
                <span className="relative">
                  <Icon name="Paperclip" size="xs" />
                  {fileCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {fileCount}
                    </span>
                  )}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {fileCount > 0
              ? t("files.uploadButtonWithCount", { count: fileCount })
              : t("files.uploadButton")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};
