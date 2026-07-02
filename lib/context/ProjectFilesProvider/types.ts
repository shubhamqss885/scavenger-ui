export interface QueuedFile {
  file: File;
  fileUuid: string;
  fileSize: number;
  response: {
    data: {
      file_type: string;
      file_size: number;
      file_url: string;
      preview_url: string;
    };
  };
}
