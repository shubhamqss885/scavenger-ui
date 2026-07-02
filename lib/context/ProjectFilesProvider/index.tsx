"use client";

import {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";

import {
  projectFilesReducer,
  initialState,
  ProjectFilesState,
  ProjectFilesAction,
} from "./reducer";

import {
  START_FILES_FETCHING,
  UPDATE_PROJECT_FILES,
  SET_PROJECT_FILES,
  SET_UPLOAD_PROGRESS,
  SET_UPLOAD_ERROR,
  REMOVE_UPLOADED_FILE,
  SET_FILES_TO_UPLOAD,
  SET_FILE_UPLOAD_COMPLETE_STATUS,
  CLEAR_CURRENT_BATCH_FILES,
} from "./actionTypes";

import {
  getProjectUploadedFiles,
  createFileIndexing,
  uploadFile as uploadFileApi,
  deleteUploadedFiles,
  callQaPossible,
} from "@/lib/services/addFileService";
import {
  FileCustom,
  UploadFilesResult,
} from "@/components/modules/Project/types";
import { CustomError } from "@/lib/utils";
import { useDashboardStats } from "../DashboardStatsProvider";
import {
  getFileDataByUuid,
  getFileDataByUuids,
  calculateUploadProgress,
  filterFilesBySize,
} from "./utils";
import { QueuedFile } from "./types";

interface ProjectFilesContextValue {
  getUploadedFiles: (projectId: string) => Promise<void>;
  uploadFiles: (files: File[], projectId: string) => Promise<UploadFilesResult>;
  removeFile: (projectId: string, fileId: string) => Promise<void>;
  resetBatchCount: () => void;
  registerOnFileDeleted: (callback: () => void) => void;
}

const ProjectFilesStateContext = createContext<ProjectFilesState | undefined>(
  undefined,
);
const ProjectFilesDispatchContext = createContext<
  React.Dispatch<ProjectFilesAction> | undefined
>(undefined);
const ProjectFilesContext = createContext<ProjectFilesContextValue | undefined>(
  undefined,
);

const ProjectFilesProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation("project");
  const [state, dispatch] = useReducer(projectFilesReducer, initialState);
  const { increaseStorageUsage, decreaseStorageUsage } = useDashboardStats();
  const INDEXING_BATCH_SIZE = 5;
  const onFileDeletedRef = useRef<(() => void) | null>(null);

  const getUploadedFiles = useCallback(async (projectId: string) => {
    dispatch({ type: START_FILES_FETCHING });

    try {
      const response = await getProjectUploadedFiles(projectId);

      if (response.status === 200) {
        const uploadedFilesIndexed = response.data.files.filter(
          (file) => file.is_indexed,
        );

        dispatch({ type: SET_PROJECT_FILES, payload: uploadedFilesIndexed });
      }
    } catch (error) {
      console.error("Error fetching uploaded files: ", error);
    }
  }, []);

  const uploadFile = async (
    file: File,
    projectId: string,
  ): Promise<QueuedFile> => {
    try {
      const response = await uploadFileApi(
        { file, project_id: projectId },
        (progressEvent) => {
          const { loaded, total } = progressEvent;
          const progress = calculateUploadProgress(loaded, total);

          dispatch({
            type: SET_UPLOAD_PROGRESS,
            payload: { name: file.name, progress },
          });
        },
      );

      return {
        file,
        fileUuid: response.data.file_uuid,
        fileSize: response.data.file_size,
        response,
      };
    } catch (error) {
      handleUploadError(error, file.name);
      throw error;
    }
  };

  const processQaPossible = async (
    fileData: QueuedFile,
  ): Promise<FileCustom> => {
    // Make the API call
    const qaResponse = await callQaPossible({
      file_uuids: [fileData.fileUuid],
      file_sizes: [fileData.fileSize],
    });

    // Return the FileCustom object with QA data
    const processedFile: FileCustom = {
      name: fileData.file.name,
      type: fileData.response.data.file_type,
      size: fileData.response.data.file_size,
      fileId: fileData.fileUuid,
      fileUrl: fileData.response.data.file_url,
      preview_csv_url: fileData.response.data.preview_url,
      is_indexed: true,
      allowed_quick_actions: qaResponse.qa_possible || [],
    };

    dispatch({
      type: SET_UPLOAD_PROGRESS,
      payload: { name: fileData.file.name, progress: 100 },
    });

    dispatch({
      type: UPDATE_PROJECT_FILES,
      payload: processedFile,
    });

    return processedFile;
  };

  const uploadFiles = useCallback(
    async (files: File[], project_id: string): Promise<UploadFilesResult> => {
      if (!files || files.length === 0) {
        return { success: false, message: t("files.noFiles") };
      }

      const { validFiles, invalidFiles } = filterFilesBySize(files);

      dispatch({ type: SET_FILE_UPLOAD_COMPLETE_STATUS, payload: false });
      dispatch({ type: SET_FILES_TO_UPLOAD, payload: files });

      let successCount = 0;
      let failureCount = 0;

      invalidFiles.forEach((file) => {
        dispatch({
          type: SET_UPLOAD_ERROR,
          payload: {
            name: file.name,
            error: t("files.sizeExceeded"),
          },
        });
        failureCount++;
      });

      // Queue to hold successfully uploaded files waiting for indexing
      let uploadedFilesQueue: QueuedFile[] = [];
      const successfullyProcessedFiles: QueuedFile[] = []; // Track successful files
      const batchPromises: Promise<void>[] = [];

      const uploadPromises = validFiles.map(async (file: File) => {
        try {
          const uploadedFile = await uploadFile(file, project_id);
          uploadedFilesQueue.push(uploadedFile);

          // If we have enough files for a batch, process them
          if (uploadedFilesQueue.length >= INDEXING_BATCH_SIZE) {
            const batch = uploadedFilesQueue.splice(0, INDEXING_BATCH_SIZE);
            const p = processIndexingBatch(batch);
            batchPromises.push(p);
          }
        } catch (error) {
          handleUploadError(error, file.name);
          failureCount++;
        }
      });

      // Process a batch of files for indexing
      const processIndexingBatch = async (batch: QueuedFile[]) => {
        const indexingData = {
          file_uuids: batch.map((item) => item.fileUuid),
          file_sizes: batch.map((item) => item.fileSize),
        };

        // Track which files (fileUuids) have been processed for QA
        const qaProcessedFiles = new Set<string>();

        try {
          await createFileIndexing(indexingData, async (update) => {
            // Process newly completed files for QA immediately
            const newlyCompleted = update.completed.filter(
              (fileUuid) => !qaProcessedFiles.has(fileUuid),
            );

            if (newlyCompleted.length > 0) {
              const completedBatchItems = getFileDataByUuids(
                batch,
                newlyCompleted,
              );

              // Process QA for newly completed files
              await Promise.all(
                completedBatchItems.map(async (fileData) => {
                  try {
                    await processQaPossible(fileData);
                    successCount++;
                    successfullyProcessedFiles.push(fileData);
                  } catch (error) {
                    handleQaError(fileData, error);
                    failureCount++;
                  } finally {
                    qaProcessedFiles.add(fileData.fileUuid);
                  }
                }),
              );
            }

            // Handle newly skipped files
            update.skipped.forEach((fileUuid) => {
              if (!qaProcessedFiles.has(fileUuid)) {
                qaProcessedFiles.add(fileUuid);
                const skippedFile = getFileDataByUuid(batch, fileUuid);

                if (skippedFile) {
                  handleIndexingSkipped(skippedFile);
                  failureCount++;
                }
              }
            });

            // Handle newly failed files
            update.failed.forEach((fileUuid) => {
              if (!qaProcessedFiles.has(fileUuid)) {
                qaProcessedFiles.add(fileUuid);
                const failedFile = getFileDataByUuid(batch, fileUuid);

                if (failedFile) {
                  handleIndexingFailure(failedFile);
                  failureCount++;
                }
              }
            });
          });
        } catch (error) {
          console.error("Batch indexing failed:", error);
          handleBatchError(batch);
          batch.forEach(() => failureCount++);
        }
      };

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Process any remaining files in the queue
      if (uploadedFilesQueue.length > 0) {
        const p = processIndexingBatch(uploadedFilesQueue);
        batchPromises.push(p);
        uploadedFilesQueue = [];
      }

      // Wait for all indexing batches to complete
      await Promise.all(batchPromises);

      // If total processed files equals total files, we're done
      if (successCount + failureCount === files.length) {
        dispatch({
          type: SET_FILE_UPLOAD_COMPLETE_STATUS,
          payload: true,
        });
      }

      // Update storage usage only for fully processed files
      const successfulUploadSize = successfullyProcessedFiles.reduce(
        (acc, file) => acc + file.fileSize / (1024 * 1024),
        0,
      );

      if (successfulUploadSize > 0) {
        increaseStorageUsage(successfulUploadSize);
      }

      return {
        success: successCount > 0,
        message:
          failureCount === 0
            ? t("files.allSuccess")
            : t("files.partialSuccess", { successCount, failureCount }),
      };
    },
    [increaseStorageUsage],
  );

  const handleUploadError = (error: unknown, fileName: string) => {
    console.error(`Failed to upload file ${fileName}:`, error);
    dispatch({
      type: SET_UPLOAD_ERROR,
      payload: {
        name: fileName,
        error:
          error instanceof CustomError
            ? error.message
            : t("files.uploadFailed"),
      },
    });
  };

  const handleQaError = (fileData: QueuedFile, error: unknown) => {
    console.error("QA possible failed for file:", fileData.file.name, error);
    dispatch({
      type: SET_UPLOAD_ERROR,
      payload: {
        name: fileData.file.name,
        error: t("files.qaFailed"),
      },
    });
  };

  const handleIndexingFailure = (fileData: QueuedFile) => {
    dispatch({
      type: SET_UPLOAD_ERROR,
      payload: {
        name: fileData.file.name,
        error: t("files.indexFailed"),
      },
    });
  };

  const handleBatchError = (batch: QueuedFile[]) => {
    batch.forEach((item) => {
      dispatch({
        type: SET_UPLOAD_ERROR,
        payload: {
          name: item.file.name,
          error: t("files.indexFailed"),
        },
      });
    });
  };

  const handleIndexingSkipped = (fileData: QueuedFile) => {
    dispatch({
      type: SET_UPLOAD_ERROR,
      payload: {
        name: fileData.file.name,
        error: t("files.tokenLimitExceeded"),
      },
    });
    // No direct failureCount increment here, it's handled in processIndexingBatch
  };

  const removeFile = useCallback(async (projectId: string, fileId: string) => {
    const fileToDelete = state.projectFiles.find(
      (file) => file.fileId === fileId,
    );

    const response = await deleteUploadedFiles(projectId, fileId);

    if (response.status_code === 200) {
      if (fileToDelete) {
        const sizeInMB = fileToDelete.size / (1024 * 1024);
        decreaseStorageUsage(sizeInMB);
      }
      dispatch({
        type: REMOVE_UPLOADED_FILE,
        payload: fileId,
      });
      toast.success(
        String(t(`serverMessages.${response.message}`, response.message)),
      );
      // Trigger callback to refresh suggested prompts
      onFileDeletedRef.current?.();
    }
  }, []);

  const resetBatchCount = useCallback(() => {
    dispatch({ type: CLEAR_CURRENT_BATCH_FILES });
  }, []);

  const registerOnFileDeleted = useCallback((callback: () => void) => {
    onFileDeletedRef.current = callback;
  }, []);

  const projectFilesContextValue: ProjectFilesContextValue = useMemo(
    () => ({
      getUploadedFiles,
      uploadFiles,
      removeFile,
      resetBatchCount,
      registerOnFileDeleted,
    }),
    [
      getUploadedFiles,
      uploadFiles,
      removeFile,
      resetBatchCount,
      registerOnFileDeleted,
    ],
  );

  return (
    <ProjectFilesStateContext.Provider value={state}>
      <ProjectFilesDispatchContext.Provider value={dispatch}>
        <ProjectFilesContext.Provider value={projectFilesContextValue}>
          {children}
        </ProjectFilesContext.Provider>
      </ProjectFilesDispatchContext.Provider>
    </ProjectFilesStateContext.Provider>
  );
};

export const useProjectFilesState = (): ProjectFilesState => {
  const context = useContext(ProjectFilesStateContext);

  if (context === undefined) {
    throw new Error(
      "useProjectFilesState must be used within a ProjectFilesProvider",
    );
  }
  return context;
};

export const useProjectFilesDispatch =
  (): React.Dispatch<ProjectFilesAction> => {
    const context = useContext(ProjectFilesDispatchContext);

    if (context === undefined) {
      throw new Error(
        "useProjectFilesDispatch must be used within a ProjectFilesProvider",
      );
    }

    return context;
  };

export const useProjectFiles = (): ProjectFilesContextValue => {
  const context = useContext(ProjectFilesContext);

  if (!context) {
    throw new Error(
      "useProjectFiles must be used within a ProjectFilesProvider",
    );
  }

  return context;
};

export default ProjectFilesProvider;
