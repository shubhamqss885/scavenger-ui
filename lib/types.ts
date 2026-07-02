export * from "@/components/modules/Project/types";

export interface FileChangeEvent {
  selectedFiles: File[];
  event: Event | React.ChangeEvent | React.DragEvent;
}

export interface FilesFilteredBySize {
  validFiles: File[];
  invalidFiles: File[];
}
