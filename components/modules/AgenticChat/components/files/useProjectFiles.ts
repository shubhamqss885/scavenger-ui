import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import { ALLOWED_FILE_EXTENSION_SET, MAX_FILE_SIZE_BYTES } from "../../types";
import {
  listProjectFiles,
  uploadProjectFile,
  deleteProjectFile,
  type ProjectFile,
} from "@/lib/services/agenticChatService";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";

const BYTES_PER_MB = 1024 * 1024;

type UseProjectFilesReturn = {
  files: ProjectFile[];
  isLoading: boolean;
  isUploading: boolean;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
};

export const useProjectFiles = (projectId: string): UseProjectFilesReturn => {
  const { t } = useTranslation("agentic-chat");
  const { decreaseStorageUsage, increaseStorageUsage } = useDashboardStats();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await listProjectFiles(projectId);
      setFiles(response.files);
    } catch {
      toast.error(t("files.errors.fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!ALLOWED_FILE_EXTENSION_SET.has(ext ?? "")) {
        toast.error(t("files.errors.invalidType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t("files.errors.tooLarge"));
        return;
      }

      setIsUploading(true);
      try {
        const response = await uploadProjectFile(projectId, file);

        setFiles((prev) => [
          {
            file_id: response.file_id,
            filename: response.filename,
            project_id: response.project_id,
            sheets: [],
            total_rows: 0,
            uploaded_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        increaseStorageUsage(file.size / BYTES_PER_MB);
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };

        if (err.response?.status === 409) {
          toast.error(t("files.errors.alreadyExists", { filename: file.name }));
        } else if (err.response?.status === 413) {
          toast.error(t("files.errors.tooLarge"));
        } else if (err.response?.status === 400) {
          toast.error(t("files.errors.invalidType"));
        } else if (err.response?.status === 503) {
          toast.error(t("files.errors.unavailable"));
        } else {
          toast.error(t("files.errors.uploadFailed"));
        }
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, t, increaseStorageUsage],
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        const response = await deleteProjectFile(fileId);

        if (!response.ok) {
          toast.error(t("files.errors.deleteFailed"));
          return;
        }
        if (response.file_size_bytes > 0) {
          decreaseStorageUsage(response.file_size_bytes / BYTES_PER_MB);
        }
        toast.success(t("files.deleteSuccess"));
        await fetchFiles();
      } catch {
        toast.error(t("files.errors.deleteFailed"));
      }
    },
    [t, decreaseStorageUsage, fetchFiles],
  );

  return {
    files,
    isLoading,
    isUploading,
    uploadFile,
    deleteFile,
    refreshFiles: fetchFiles,
  };
};
