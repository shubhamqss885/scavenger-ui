export interface FileCustom {
  name: string;
  type: string;
  size: number;
  fileUrl: string;
  fileId: string;
  preview_csv_url: string;
  is_indexed: boolean;
  allowed_quick_actions: string[];
}

export interface UploadedFileDetail {
  file_name: string;
  file_display_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  file_uuid: string;
  preview_csv_url: string;
  is_indexed: boolean;
  allowed_quick_actions: string[];
}

export interface GetUploadedFilesResponse {
  project_files_detail: {
    uploaded_files_details: UploadedFileDetail[];
  };
}

export interface GetProjectUploadedFilesResult {
  status: number;
  data: {
    files: FileCustom[];
  };
}

export interface IndexingPayload {
  file_uuids: string[];
  file_sizes: number[];
}

export interface UploadFilesResult {
  success: boolean;
  message: string;
}

export interface UploadFilePayload {
  file: File;
  project_id: string;
}

export interface QaPossibleResponse {
  status_code: number;
  message: string;
  qa_possible: string[];
}
