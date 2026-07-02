"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Small, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { ALLOWED_FILE_ACCEPT, ALLOWED_FILE_EXTENSION_LABEL } from "../../types";

type FileUploadZoneProps = Readonly<{
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}>;

export const FileUploadZone = ({
  onUpload,
  isUploading,
}: FileUploadZoneProps) => {
  const { t } = useTranslation("agentic-chat");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];

      if (file) {
        await onUpload(file);
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        await onUpload(file);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onUpload],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        isUploading && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_FILE_ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading ? (
        <>
          <Icon
            name="Loader2"
            size="lg"
            variant="primary"
            className="animate-spin"
          />
          <Muted>{t("files.uploading")}</Muted>
        </>
      ) : (
        <>
          <Icon name="Upload" size="lg" variant="default" />
          <div className="text-center">
            <Small className="text-sm">{t("files.dropzone.title")}</Small>
            <Muted className="text-xs">
              {t("files.dropzone.subtitle", {
                types: ALLOWED_FILE_EXTENSION_LABEL,
              })}
            </Muted>
          </div>
        </>
      )}
    </div>
  );
};
