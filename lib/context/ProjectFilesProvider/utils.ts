import { FileCustom, FilesFilteredBySize } from "@/lib/types";
import { IndexingUpdate } from "@/lib/services/addFileService";
import { MAX_FILE_SIZE } from "@/lib/constants";

export const getActionsFromFiles = (data: FileCustom[]): string[] => {
  return data.flatMap((file) => file.allowed_quick_actions);
};

export const getFormFillerFiles = (data: FileCustom[]): FileCustom[] => {
  return data.filter((file) =>
    file.allowed_quick_actions.includes("FORM_FILLER"),
  );
};

export const getDataQualityFiles = (data: FileCustom[]): FileCustom[] => {
  return data.filter((file) =>
    file.allowed_quick_actions.includes("QUALITY_DATASET_ANALYSIS"),
  );
};

export const organizeProjectFilesAndActions = (
  files: FileCustom[],
): {
  allowedActionsSet: Set<string>;
  formFillerFiles: FileCustom[];
  dataQualityFiles: FileCustom[];
} => {
  const filesIndexed = files.filter((file) => file.is_indexed);
  const allowedActionsSet = new Set(getActionsFromFiles(filesIndexed));
  const formFillerFiles = getFormFillerFiles(filesIndexed);
  const dataQualityFiles = getDataQualityFiles(filesIndexed);

  return { allowedActionsSet, formFillerFiles, dataQualityFiles };
};

// export const getSuccessfulUploadSize = (
//   results: PromiseSettledResult<void>[],
//   files: File[],
// ) => {
//   const successfulUploads = results
//     .filter((result) => result.status === "fulfilled")
//     .map((_, index) => files[index]);

//   return successfulUploads.reduce(
//     (acc, file) => acc + file.size / (1024 * 1024),
//     0,
//   );
// };

export const isBatchComplete = (update: IndexingUpdate): boolean => {
  return update.processing.length === 0;
};

export const getFileDataByUuid = <T extends { fileUuid: string }>(
  batch: T[],
  fileUuid: string,
): T | undefined => {
  return batch.find((item) => item.fileUuid === fileUuid);
};

export const getFileDataByUuids = <T extends { fileUuid: string }>(
  batch: T[],
  fileUuids: string[],
): T[] => {
  return fileUuids
    .map((uuid) => getFileDataByUuid(batch, uuid))
    .filter((item): item is T => item !== undefined);
};

export const calculateUploadProgress = (
  loaded: number,
  total: number | undefined,
): number => {
  const actualProgress = Math.round((loaded * 100) / (total ?? 1));
  return Math.min(Math.round(actualProgress * 0.75), 75);
};

export const filterFilesBySize = (files: File[]): FilesFilteredBySize => {
  const maxFileSize = MAX_FILE_SIZE * 1024 * 1024;

  return files.reduce<FilesFilteredBySize>(
    (acc, file) => {
      if (file.size <= maxFileSize) {
        acc.validFiles.push(file);
      } else {
        acc.invalidFiles.push(file);
      }
      return acc;
    },
    { validFiles: [], invalidFiles: [] },
  );
};
