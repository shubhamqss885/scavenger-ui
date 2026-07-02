"use client";

import { useEffect, useRef, useState } from "react";

import {
  createDataSource,
  ingestDataSource,
} from "@/lib/services/externalDataSourceService";
import { useIngestionEvents } from "@/lib/context/EventsContext/hooks/useIngestionEvents";
import { useOrganizationDbActions } from "@/lib/context/OrganizationDbProvider";
import { useTranslation } from "@/lib/i18n/client";

const ETL_WAIT_HINT_MS = 60_000;
// Minimum time a row stays "ingesting" so the stage is perceptible even when
// the ingest accept call returns almost instantly.
const INGEST_MIN_MS = 900;

type UploadState =
  | "idle"
  | "uploading"
  | "ingesting"
  | "waiting-etl"
  | "settled"
  | "done"
  | "error";

// Per-file lifecycle. Files advance independently once ingest is fired:
// uploading → ingesting → processing → done | failed.
export type FileStage =
  | "uploading"
  | "ingesting"
  | "processing"
  | "done"
  | "failed";

export type FileItem = {
  name: string;
  dataSourceId?: string;
  tableName?: string | null;
  stage: FileStage;
};

type Options = Readonly<{
  onFileUpload: (orgdbId: string) => void;
  onDataSourceCreated?: () => void;
  datasetName?: string;
}>;

const isTerminalStage = (s: FileStage) => s === "done" || s === "failed";

// Owns the full create → ingest → wait-for-ETL lifecycle for an N-CSV upload.
// One data source (orgdb) with N tables. Rows are keyed by selected file from
// the very first frame; the backend returns data_sources in input-file order,
// so each row's data_source_id is associated by index and per-file ETL events
// resolve back to the right row by data_source_id.
export const useMultiFileIngest = (files: File[], options: Options) => {
  const { onFileUpload, onDataSourceCreated, datasetName } = options;
  // Ref so handleUpload always reads the latest value without stale closure risk.
  const datasetNameRef = useRef(datasetName ?? "");
  useEffect(() => {
    datasetNameRef.current = datasetName ?? "";
  }, [datasetName]);
  const { t } = useTranslation("connectors");
  const { events: ingestionEvents } = useIngestionEvents();
  const { deleteDb, beginAddingDb, endAddingDb } = useOrganizationDbActions();

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [orgdbId, setOrgdbId] = useState<string | null>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [showTimeoutHint, setShowTimeoutHint] = useState(false);

  // Guards against duplicate redirects if the WS replays etl.completed.
  const hasRedirectedRef = useRef(false);

  // Advance one file's stage. Never regresses a terminal stage unless forced
  // (forced is used by retry to reset a failed row back to processing).
  const setStage = (index: number, stage: FileStage, force = false) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        if (!force && isTerminalStage(it.stage)) return it;
        return { ...it, stage };
      }),
    );

  // Advance a row out of "ingesting" only after a minimum dwell, so the stage
  // doesn't flash by when the ingest accept call returns almost instantly.
  const holdStage = async (start: number, index: number, failed: boolean) => {
    const elapsed = Date.now() - start;

    if (elapsed < INGEST_MIN_MS) {
      await new Promise((r) => setTimeout(r, INGEST_MIN_MS - elapsed));
    }
    setStage(index, failed ? "failed" : "processing");
  };

  // Creep the % during ingest/ETL so the bar keeps moving even though the
  // server gives no progress signal: ingest 55→70, waiting-etl 75→96. The
  // final jump to 100 happens when every file reaches a terminal state.
  useEffect(() => {
    const config =
      uploadState === "ingesting"
        ? { intervalMs: 200, cap: 70 }
        : uploadState === "waiting-etl"
          ? { intervalMs: 1000, cap: 96 }
          : null;

    if (!config) return;

    const id = setInterval(() => {
      setUploadProgress((prev) => (prev < config.cap ? prev + 1 : prev));
    }, config.intervalMs);
    return () => clearInterval(id);
  }, [uploadState]);

  // Show a "taking longer" hint after 60s of waiting-etl; reset on exit.
  useEffect(() => {
    if (uploadState !== "waiting-etl") {
      setShowTimeoutHint(false);
      return;
    }
    const id = setTimeout(() => setShowTimeoutHint(true), ETL_WAIT_HINT_MS);
    return () => clearTimeout(id);
  }, [uploadState]);

  // Effect A — resolve per-file WS events into row stages.
  //
  // Multi-file: BE emits file_etl.completed / file_etl.failed per file with
  // table_name — resolve by table_name for granular per-row updates.
  // Single-file / fallback: etl.completed / ingestion.failed resolve all
  // non-terminal rows sharing the same data_source_id.
  // EventsContext accumulates file_etl.* by file_name (deduped) so no frames
  // are lost even if React batches renders between rapid WS messages.
  useEffect(() => {
    if (uploadState !== "ingesting" && uploadState !== "waiting-etl") return;
    if (!ingestionEvents.length) return;

    setItems((prev) => {
      let next = prev;
      for (const evt of ingestionEvents) {
        if (
          evt.type === "file_etl.completed" ||
          evt.type === "file_etl.failed"
        ) {
          const stage: FileStage =
            evt.type === "file_etl.completed" ? "done" : "failed";
          const tbl = evt.data.table_name;
          next = next.map((it) =>
            it.tableName === tbl && !isTerminalStage(it.stage)
              ? { ...it, stage }
              : it,
          );
        } else if (
          evt.type === "etl.completed" ||
          evt.type === "ingestion.failed"
        ) {
          // Terminal batch event — advance any rows still non-terminal
          const dsId = evt.data.data_source_id;

          if (!next.some((it) => it.dataSourceId === dsId)) continue; // stray
          const stage: FileStage =
            evt.type === "etl.completed" ? "done" : "failed";
          next = next.map((it) =>
            it.dataSourceId === dsId && !isTerminalStage(it.stage)
              ? { ...it, stage }
              : it,
          );
        }
      }
      return next;
    });
  }, [ingestionEvents, uploadState]);

  // Effect B — react to "all files terminal". Full success auto-redirects;
  // partial / all-failed settles so the footer (Next / try-again) takes over.
  useEffect(() => {
    if (uploadState !== "waiting-etl" || !orgdbId) return;
    if (!items.length || !items.every((it) => isTerminalStage(it.stage)))
      return;

    const failed = items.filter((it) => it.stage === "failed").length;

    if (failed === 0 && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      setUploadProgress(100);
      setUploadState("done");
      onFileUpload(orgdbId);
      return;
    }

    if (failed > 0) {
      setUploadProgress(100);
      setUploadState("settled");
    }
  }, [items, uploadState, orgdbId, onFileUpload]);

  const reset = () => {
    setUploadState("idle");
    setUploadProgress(0);
    setOrgdbId(null);
    setItems([]);
    setError(null);
    hasRedirectedRef.current = false;
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setError(null);

    let createdOrgdbId: string | null = null;
    let createdIds: string[] = [];

    // Lock org switching for the request lifetime (released in finally at the
    // "waiting-etl" handoff; ETL itself is background and out of scope).
    beginAddingDb();
    try {
      setUploadState("uploading");
      setUploadProgress(0);
      setItems(files.map((f) => ({ name: f.name, stage: "uploading" })));

      const dataSourceName = files[0].name.replace(/\.csv$/i, "");
      const displayName = datasetNameRef.current.trim() || dataSourceName;

      const createResponse = await createDataSource({
        files,
        dataSourceName,
        displayName,
        dataSourceType: "CSV",
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 55) / event.total));
          }
        },
      });

      const { data_sources, orgdb_id } = createResponse;

      if (!data_sources.length) throw new Error("No data sources returned");

      createdOrgdbId = orgdb_id;
      createdIds = data_sources.map((d) => d.data_source_id);

      setOrgdbId(orgdb_id);
      // All files share one data_source_id. Associate table_name per row so
      // file_etl.completed / file_etl.failed events can resolve by table_name.
      const sharedDataSourceId = data_sources[0].data_source_id;
      setItems((prev) =>
        prev.map((it, i) => ({
          ...it,
          dataSourceId: sharedDataSourceId,
          tableName: data_sources[i]?.table_name ?? null,
          stage: "ingesting",
        })),
      );

      setUploadProgress(55);
      setUploadState("ingesting");

      // Single ingest call — one data_source_id covers all files.
      const ingestStart = Date.now();
      await ingestDataSource(sharedDataSourceId)
        .then((res) =>
          Promise.all(
            data_sources.map((_, i) =>
              holdStage(ingestStart, i, res.status === "FAILED"),
            ),
          ),
        )
        .catch(() =>
          Promise.all(
            data_sources.map((_, i) => holdStage(ingestStart, i, true)),
          ),
        );

      onDataSourceCreated?.();
      setUploadProgress(75);
      setUploadState("waiting-etl");
    } catch (err: unknown) {
      // Only reached on a create-level failure (allSettled never rejects), so
      // no tables exist yet — dropping the orphan orgdb is safe here.
      if (createdOrgdbId && createdIds.length === 0) {
        deleteDb(createdOrgdbId, { silent: true }).catch(() => {});
      }

      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      const msg =
        axiosErr?.response?.data?.detail ??
        axiosErr?.response?.data?.message ??
        (err instanceof Error ? err.message : null) ??
        t("fileUpload.errors.uploadFailed");
      // Create-level failure: the whole batch was rejected before any file was
      // processed, so there are no per-file outcomes to show. Clear the seeded
      // rows (which would otherwise stay frozen on "uploading") and drop back to
      // the file list with the error banner, so "Upload & Connect" works again.
      setItems([]);
      setError(msg);
      setUploadState("idle");
    } finally {
      endAddingDb();
    }
  };

  // Retry only the failed files: re-ingest their ids, reset those rows to
  // processing, and let the capture effects pick up the fresh per-id events.
  const handleRetryFailed = async () => {
    if (!orgdbId) return;
    const failed = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.stage === "failed" && it.dataSourceId);

    if (!failed.length) return;

    setError(null);
    hasRedirectedRef.current = false;
    failed.forEach(({ i }) => setStage(i, "processing", true));
    setUploadProgress(75);
    setUploadState("ingesting");

    // All failed items share one data_source_id — ingest once.
    const dataSourceId = failed[0].it.dataSourceId as string;
    beginAddingDb();
    try {
      await ingestDataSource(dataSourceId).catch(() => {
        failed.forEach(({ i }) => setStage(i, "failed", true));
      });
      setUploadState("waiting-etl");
    } finally {
      endAddingDb();
    }
  };

  const proceed = () => {
    if (orgdbId) onFileUpload(orgdbId);
  };

  const isProcessing =
    uploadState === "uploading" ||
    uploadState === "ingesting" ||
    uploadState === "waiting-etl";
  const allTerminal =
    items.length > 0 && items.every((it) => isTerminalStage(it.stage));
  const successCount = items.filter((it) => it.stage === "done").length;
  const failedCount = items.filter((it) => it.stage === "failed").length;
  const isPartial = allTerminal && successCount > 0 && failedCount > 0;
  const allFailed = allTerminal && successCount === 0;

  return {
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
  };
};
