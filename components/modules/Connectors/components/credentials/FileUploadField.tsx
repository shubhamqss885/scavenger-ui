"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

export const FileUploadField = ({
  label,
  displayName,
  accept,
  uploadLabel,
  token,
  certType = "ca",
  onUpload,
  onClear,
}: Readonly<{
  label: string;
  displayName: string | null;
  accept?: string;
  uploadLabel?: string;
  token?: string;
  certType?: "ca" | "client-cert" | "client-key";
  onUpload: (fileId: string, pem: string, fileName: string) => void;
  onClear: () => void;
}>) => {
  const { t } = useTranslation("connectors");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const pem = await file.text();
      const res = await fetch("/api/connectors/upload-ssl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cert: pem,
          filename: file.name,
          cert_type: certType,
        }),
      });

      if (!res.ok) {
        setUploadError(t("security.sslFileUpload.uploadFailed"));
        return;
      }

      const data = (await res.json()) as { file_id: string };
      onUpload(data.file_id, pem, file.name);
    } catch {
      setUploadError(t("security.sslFileUpload.networkError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Label className="mb-1.5 text-xs">{label}</Label>
      {displayName ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
          <Icon
            name="FileCheck"
            size="xs"
            className="text-green-600 dark:text-green-400"
          />
          <span className="flex-1 truncate text-xs font-medium text-green-700 dark:text-green-300">
            {displayName}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
          >
            <Icon name="X" size="xs" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5",
            "text-xs text-muted-foreground transition-colors",
            "hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
            uploading && "cursor-wait opacity-60",
          )}
        >
          <Icon
            name={uploading ? "Loader2" : "Upload"}
            size="xs"
            className={uploading ? "animate-spin" : ""}
          />
          {uploading
            ? t("security.sslFileUpload.uploading")
            : (uploadLabel ?? t("security.sslFileUpload.uploadFile"))}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={
          accept ?? (certType === "client-key" ? ".pem,.key" : ".pem,.crt,.cer")
        }
        onChange={handleFileChange}
        className="hidden"
      />
      {uploadError && (
        <p className="mt-1 text-[11px] text-destructive">{uploadError}</p>
      )}
    </div>
  );
};
