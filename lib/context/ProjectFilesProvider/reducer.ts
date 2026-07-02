import { FileCustom } from "@/components/modules/Project/types";
import {
  START_FILES_FETCHING,
  UPDATE_PROJECT_FILES,
  SET_PROJECT_FILES,
  SET_FILES_TO_UPLOAD,
  SET_UPLOAD_PROGRESS,
  SET_UPLOAD_ERROR,
  REMOVE_UPLOADED_FILE,
  SET_DEFAULT_STATE,
  SET_FILE_UPLOAD_COMPLETE_STATUS,
  CLEAR_CURRENT_BATCH_FILES,
} from "./actionTypes";
import { organizeProjectFilesAndActions } from "./utils";

export interface ProjectFilesState {
  isProjectFilesLoading: boolean;
  isUploadComplete: boolean;
  isFileUploadingInProgress: boolean;
  uploadProgress: Record<string, number>;
  uploadErrors: Record<string, string>;
  iterationUploadErrors: Record<string, string>;
  projectFiles: FileCustom[];
  filesToUpload: File[];
  allowedActionsSet: Set<string>;
  formFillerFiles: FileCustom[];
  dataQualityFiles: FileCustom[];
  currentBatchFiles: File[];
}

export const initialState: ProjectFilesState = {
  isProjectFilesLoading: false,
  isUploadComplete: false,
  isFileUploadingInProgress: false,
  uploadProgress: {},
  uploadErrors: {},
  iterationUploadErrors: {},
  projectFiles: [],
  filesToUpload: [],
  allowedActionsSet: new Set(),
  formFillerFiles: [],
  dataQualityFiles: [],
  currentBatchFiles: [],
};

export type ProjectFilesAction =
  | { type: typeof START_FILES_FETCHING }
  | { type: typeof UPDATE_PROJECT_FILES; payload: FileCustom }
  | { type: typeof SET_PROJECT_FILES; payload: FileCustom[] }
  | { type: typeof SET_FILES_TO_UPLOAD; payload: File[] }
  | {
      type: typeof SET_UPLOAD_PROGRESS;
      payload: { name: string; progress: number };
    }
  | {
      type: typeof SET_UPLOAD_ERROR;
      payload: { name: string; error: string };
    }
  | { type: typeof REMOVE_UPLOADED_FILE; payload: string }
  | { type: typeof SET_DEFAULT_STATE }
  | { type: typeof SET_FILE_UPLOAD_COMPLETE_STATUS; payload: boolean }
  | { type: typeof CLEAR_CURRENT_BATCH_FILES };

export const projectFilesReducer = (
  state: ProjectFilesState,
  action: ProjectFilesAction,
): ProjectFilesState => {
  switch (action.type) {
    case START_FILES_FETCHING:
      return {
        ...state,
        isProjectFilesLoading: true,
      };
    case SET_FILE_UPLOAD_COMPLETE_STATUS:
      return {
        ...state,
        isUploadComplete: action.payload,
        isFileUploadingInProgress: !action.payload,
      };
    case UPDATE_PROJECT_FILES: {
      const projectFiles = [...state.projectFiles, action.payload];

      return {
        ...state,
        projectFiles: [...state.projectFiles, action.payload],
        filesToUpload: state.filesToUpload.filter(
          (f: any) => f.name !== action.payload.name,
        ),
        ...organizeProjectFilesAndActions(projectFiles),
      };
    }
    case SET_PROJECT_FILES:
      return {
        ...state,
        projectFiles: action.payload,
        isProjectFilesLoading: false,
        ...organizeProjectFilesAndActions(action.payload),
      };
    case SET_FILES_TO_UPLOAD:
      return {
        ...state,
        filesToUpload: [...state.filesToUpload, ...action.payload],
        currentBatchFiles: [...action.payload],
        iterationUploadErrors: {},
      };
    case SET_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.name]: action.payload.progress,
        },
      };
    case SET_UPLOAD_ERROR:
      return {
        ...state,
        // isFileUploadingInProgress: false,
        uploadErrors: {
          ...state.uploadErrors,
          [action.payload.name]: action.payload.error,
        },
        iterationUploadErrors: {
          ...state.iterationUploadErrors,
          [action.payload.name]: action.payload.error,
        },
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.name]: -1,
        },
      };
    case REMOVE_UPLOADED_FILE: {
      const projectFiles = state.projectFiles.filter(
        (f: FileCustom) => f.fileId !== action.payload,
      );

      return {
        ...state,
        projectFiles,
        ...organizeProjectFilesAndActions(projectFiles),
      };
    }
    case SET_DEFAULT_STATE: {
      return initialState;
    }

    case CLEAR_CURRENT_BATCH_FILES:
      return {
        ...state,
        currentBatchFiles: [],
      };

    default:
      return state;
  }
};
