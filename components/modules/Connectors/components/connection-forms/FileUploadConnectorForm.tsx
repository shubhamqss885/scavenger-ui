"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { Connector } from "../../config/connectorData";
import { ConnectorFormLeftPanel } from "./ConnectorFormLeftPanel";
import { FileStatusRow } from "./FileStatusRow";
import { useMultiFileIngest, type FileItem } from "./useMultiFileIngest";

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type Props = Readonly<{
  connector: Connector;
  onFileUpload: (orgdbId: string) => void;
  onDataSourceCreated?: () => void;
}>;

export const FileUploadConnectorForm = ({
  connector,
  onFileUpload,
  onDataSourceCreated,
}: Props) => {
  const { t } = useTranslation("connectors");
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  // Skip auto-fill once user has manually edited the name field.
  const userEditedNameRef = useRef(false);

  const ingest = useMultiFileIngest(files, {
    onFileUpload,
    onDataSourceCreated,
    datasetName,
  });
  const {
    uploadState,
    uploadProgress,
    error,
    orgdbId,
    items,
    showTimeoutHint,
    isProcessing,
    allTerminal,
    successCount,
    failedCount,
    isPartial,
    allFailed,
    setError,
    handleUpload,
    handleRetryFailed,
    proceed,
    reset,
  } = ingest;

  const stageText = (stage: FileItem["stage"]) => {
    switch (stage) {
      case "done":
        return t("fileUpload.rowReady");
      case "failed":
        return t("fileUpload.rowFailed");
      case "uploading":
        return t("fileUpload.rowUploading");
      case "ingesting":
        return t("fileUpload.rowIngesting");
      default:
        return t("fileUpload.rowProcessing");
    }
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext !== "csv") {
      return t("fileUpload.errors.invalidType", { allowed: "csv" });
    }
    if (f.size > MAX_SIZE_BYTES) {
      return t("fileUpload.errors.tooLarge", { maxSizeMb: MAX_SIZE_MB });
    }
    return null;
  };

  const addFiles = (incoming: File[]) => {
    const errors = incoming.map(validateFile);
    const invalidCount = errors.filter(Boolean).length;

    if (invalidCount === 0) {
      setError(null);
    } else if (invalidCount === 1) {
      setError(errors.find(Boolean) ?? null);
    } else {
      setError(t("fileUpload.errors.multipleInvalid", { count: invalidCount }));
    }

    const valid = incoming.filter((f) => !validateFile(f));

    if (!valid.length) return;

    if (!userEditedNameRef.current && !datasetName) {
      setDatasetName(valid[0].name.replace(/\.csv$/i, ""));
    }

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name))];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length) addFiles(selected);
    // reset so the same filename can be re-added after removal
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files ?? []);

    if (dropped.length) addFiles(dropped);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setError(next.map(validateFile).find(Boolean) ?? null);
  };

  const clearFiles = () => {
    setFiles([]);
    setDatasetName("");
    userEditedNameRef.current = false;
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const dragHandlers = {
    onDrop: handleDrop,
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    onDragLeave: () => setIsDragOver(false),
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <ConnectorFormLeftPanel connector={connector} previewText={null} />

          <div className="p-5">
            <div className="space-y-4">
              {uploadState === "idle" && (
                <div className="space-y-1">
                  <Label
                    htmlFor="dataset-name-input"
                    className="text-xs font-medium"
                  >
                    {t("fileUpload.datasetNameLabel")}
                  </Label>
                  <Input
                    id="dataset-name-input"
                    value={datasetName}
                    onChange={(e) => {
                      userEditedNameRef.current = true;
                      setDatasetName(e.target.value);
                    }}
                    placeholder={t("fileUpload.datasetNamePlaceholder")}
                    className="h-8 text-xs"
                    maxLength={100}
                  />
                </div>
              )}

              {/* Hidden file input — always mounted, referenced by both labels */}
              <input
                ref={inputRef}
                id="file-upload-input"
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {items.length > 0 ? (
                /* Per-file status, one row per selected file */
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <FileStatusRow
                      key={item.name}
                      label={item.name}
                      status={item.stage}
                      statusText={stageText(item.stage)}
                    />
                  ))}
                </div>
              ) : files.length === 0 ? (
                /* Drop zone */
                <label
                  htmlFor="file-upload-input"
                  {...dragHandlers}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-10 text-center transition-colors",
                    isDragOver
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <Icon name="Upload" size="lg" />
                  <p className="text-xs font-medium text-foreground">
                    {t("fileUpload.dropHint", { fileLabel: "CSV" })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("fileUpload.browseHint", { maxSizeMb: MAX_SIZE_MB })}
                  </p>
                </label>
              ) : (
                /* Selected file list */
                <div className="space-y-1.5" {...dragHandlers}>
                  {files.map((f, i) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {f.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatSize(f.size)}
                        </p>
                      </div>
                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label={t("fileUpload.removeFile")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Icon name="X" size="xs" />
                        </button>
                      )}
                    </div>
                  ))}

                  {!isProcessing && (
                    <label
                      htmlFor="file-upload-input"
                      className="flex cursor-pointer items-center gap-1 pt-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Icon name="Plus" size="xs" />
                      {t("fileUpload.addMoreFiles")}
                    </label>
                  )}
                </div>
              )}

              <div role="status" aria-live="polite" className="space-y-2">
                {isProcessing && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {t("fileUpload.processingCount", {
                          count: items.filter(
                            (it) =>
                              it.stage !== "done" && it.stage !== "failed",
                          ).length,
                        })}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {showTimeoutHint &&
                  uploadState === "waiting-etl" &&
                  orgdbId && (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <span>{t("fileUpload.timeoutHint")}</span>
                      <Link
                        href={`/data-sources/${orgdbId}`}
                        onClick={reset}
                        className="shrink-0 text-xs font-medium text-primary hover:underline"
                      >
                        {t("fileUpload.openDataSource")}
                      </Link>
                    </div>
                  )}

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <Icon
                      name="AlertCircle"
                      size="xs"
                      className="mt-0.5 shrink-0"
                    />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                {((files.length > 0 && uploadState === "idle") ||
                  uploadState === "settled") && (
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {t("fileUpload.clearAll")}
                  </button>
                )}

                {isPartial && (
                  <span className="text-[11px] text-muted-foreground">
                    {t("fileUpload.partialSummary", {
                      success: successCount,
                      total: items.length,
                    })}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {failedCount > 0 && allTerminal && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={handleRetryFailed}
                    >
                      <Icon name="RotateCw" size="xxs" />
                      {t("fileUpload.tryAgain")}
                    </Button>
                  )}

                  {uploadState === "idle" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      disabled={!files.length}
                      onClick={handleUpload}
                    >
                      <Icon name="Lock" size="xxs" />
                      {t("fileUpload.uploadAndConnect")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      disabled={isProcessing || allFailed}
                      onClick={proceed}
                    >
                      {isProcessing ? (
                        <>
                          <Icon
                            name="Loader2"
                            size="xxs"
                            className="animate-spin"
                          />
                          {t("fileUpload.processing")}
                        </>
                      ) : (
                        t("fileUpload.next")
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
