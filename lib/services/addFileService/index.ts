import { AxiosProgressEvent, isAxiosError } from "axios";
import {
  getAxiosInstance,
  getIndexingLambdaAxiosInstance,
  getQaPossibleLambdaAxiosInstance,
} from "@/lib/services/axiosInstances";

import {
  FileCustom,
  GetProjectUploadedFilesResult,
  GetUploadedFilesResponse,
  IndexingPayload,
  QaPossibleResponse,
  UploadFilePayload,
} from "@/components/modules/Project/types";
import { CustomError } from "@/lib/utils";

const addFileUrls = {
  uploadFile: "/upload/upload",
  getUploadedFiles: "/project/list_project_files",
  deleteFileUpload: "/project/delete_project_files",
  createFileIndexing: "/indexing_status",
  createFileBatchIndexing: "/batch_indexing_status",
  getQApossible: "/qa_possible",
};

interface FileIndexingStatus {
  file_uuid: string;
  indexing_status: "COMPLETED" | "FAILED" | "PROCESSING" | "SKIPPED";
}

export interface IndexingUpdate {
  completed: string[]; // UUIDs of newly completed files
  failed: string[]; // UUIDs of newly failed files
  skipped: string[]; // UUIDs of newly skipped files
  processing: string[]; // UUIDs still processing
  isComplete: boolean; // true when all files are done (success or failure)
}

export const uploadFile = async (
  dataToSend: UploadFilePayload,
  onUploadProgress?: (progress: AxiosProgressEvent) => void,
) => {
  const formData = new FormData();
  formData.append("file", dataToSend.file);
  formData.append("project_id", dataToSend.project_id);

  const axiosInstance = getAxiosInstance();

  try {
    const response = await axiosInstance.post(
      addFileUrls.uploadFile,
      formData,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      },
    );
    return response;
  } catch (error: any) {
    console.error("Failed to upload file:", error);

    if (isAxiosError(error)) {
      throw new CustomError({
        message: error.response?.data.detail ?? "Unknown error",
        fileName: dataToSend.file.name,
      });
    } else {
      throw new CustomError({
        message: "An unknown error occurred during file upload.",
        fileName: dataToSend.file.name,
      });
    }
  }
};

export const getProjectUploadedFiles = async (
  projectId: string,
): Promise<GetProjectUploadedFilesResult> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<GetUploadedFilesResponse>(
    `${addFileUrls.getUploadedFiles}?project_id=${projectId}`,
  );

  const files = response.data.project_files_detail.uploaded_files_details.map(
    (file) => ({
      name: file.file_display_name || file.file_name,
      type: file.file_type,
      size: file.file_size,
      fileUrl: file.file_url,
      fileId: file.file_uuid,
      preview_csv_url: file.preview_csv_url,
      is_indexed: file.is_indexed,
      allowed_quick_actions: file.allowed_quick_actions,
    }),
  );

  return { status: response.status, data: { files } };
};

export const deleteUploadedFiles = async (
  projectId: string,
  fileId: string,
) => {
  try {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.delete(
      `${addFileUrls.deleteFileUpload}?project_id=${projectId}&file_uuid=${fileId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
};

export const createFileIndexing = async (
  data: IndexingPayload,
  onUpdate?: (update: IndexingUpdate) => Promise<void>,
): Promise<IndexingUpdate> => {
  const lambdaAxiosInstance = getIndexingLambdaAxiosInstance();
  const MAX_RETRIES = 30;
  let retryCount = 0;
  const processedFiles = new Set<string>();
  let latestIndexingUpdate: IndexingUpdate = {
    completed: [],
    failed: [],
    skipped: [],
    processing: data.file_uuids,
    isComplete: false,
  };

  try {
    const timeInterval = Math.max(Math.max(...data.file_sizes) / 2000, 3500);

    while (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, timeInterval));

      const response = await lambdaAxiosInstance.get(
        addFileUrls.createFileBatchIndexing,
        {
          params: {
            file_uuid: JSON.stringify(data.file_uuids),
          },
          paramsSerializer: (params) => {
            return `file_uuid=${encodeURIComponent(params.file_uuid)}`;
          },
        },
      );
      const currentStatus = response.data.files_status as FileIndexingStatus[];

      const update: IndexingUpdate = {
        completed: [],
        failed: [],
        skipped: [],
        processing: [],
        isComplete: false,
      };

      // Process current status
      for (const status of currentStatus) {
        const fileData = data.file_uuids.find(
          (uuid) => uuid === status.file_uuid,
        );

        if (fileData && !processedFiles.has(status.file_uuid)) {
          if (status.indexing_status === "COMPLETED") {
            update.completed.push(status.file_uuid);
            processedFiles.add(status.file_uuid);
          } else if (status.indexing_status === "FAILED") {
            update.failed.push(status.file_uuid);
            processedFiles.add(status.file_uuid);
          } else if (status.indexing_status === "SKIPPED") {
            update.skipped.push(status.file_uuid);
            processedFiles.add(status.file_uuid);
          } else {
            update.processing.push(status.file_uuid);
          }
        }
      }

      update.isComplete = update.processing.length === 0;

      // Only call onUpdate if there are changes
      if (
        update.completed.length > 0 ||
        update.failed.length > 0 ||
        update.skipped.length > 0
      ) {
        await onUpdate?.(update);
      }

      latestIndexingUpdate = {
        ...latestIndexingUpdate,
        ...update,
        processing: update.processing, // Override processing array
      };

      if (update.isComplete) break;
      retryCount++;
    }

    if (retryCount >= MAX_RETRIES) {
      // Mark remaining processing files as failed
      latestIndexingUpdate.failed.push(...latestIndexingUpdate.processing);
      latestIndexingUpdate.processing = [];
      latestIndexingUpdate.isComplete = true;
      onUpdate?.(latestIndexingUpdate);
    }

    return latestIndexingUpdate;
  } catch (error) {
    console.error("File indexing failed:", error);
    throw error;
  }
};

export const callQaPossible = async (
  data: IndexingPayload,
): Promise<QaPossibleResponse> => {
  const lambdaAxiosInstance = getQaPossibleLambdaAxiosInstance();
  try {
    const fileUuid = data.file_uuids[0];
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await lambdaAxiosInstance.get(addFileUrls.getQApossible, {
      params: { file_uuid: fileUuid },
    });
    return response.data;
  } catch (error) {
    console.error("QA possible check failed:", error);
    throw error;
  }
};

export const getFileUrlByName = async (name: string) => {
  try {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.get(
      `/upload/get_download_url?file_name=${name}`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to get a file url:", error);
  }
};

export const downloadFile = async (file: FileCustom) => {
  const axiosInstance = getAxiosInstance();
  const fileName = file.fileUrl.split("/").pop();

  if (!fileName) throw new Error("Invalid file URL");

  const response = await axiosInstance.get(
    `/upload/get_download_url?file_name=${fileName}`,
  );

  const data = response.data;

  if (!data?.download_url) throw new Error("Failed to get download URL");

  const responseBlob = await fetch(data.download_url);
  const blob = await responseBlob.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(blobUrl);
};
