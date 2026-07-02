"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

import { Icon } from "@/components/ui/icon";
import { ingestDataSource } from "@/lib/services/externalDataSourceService";
import { uploadGoogleSheet } from "@/lib/services/googleSheetsService";
import { useOrganizationDbActions } from "@/lib/context/OrganizationDbProvider";
import { useTranslation } from "@/lib/i18n/client";
import type { Connector } from "../../config/connectorData";
import { GcpOAuthButton } from "../credentials/GcpOAuthButton";
import { ConnectorFormLeftPanel } from "./ConnectorFormLeftPanel";

const CSV_MIME_TYPE = "text/csv";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

type FlowState =
  | "idle"
  | "picking"
  | "connecting"
  | "ingesting"
  | "done"
  | "error";

type Props = {
  connector: Connector;
  onFileUpload: (orgdbId: string) => void;
};

// Rejects with a sentinel code; the caller maps it to an i18n key.
const loadGapi = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (globalThis.window?.gapi) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gapi_load_failed"));
    document.head.appendChild(script);
  });

export const OAuthOnlyConnectorForm = ({
  connector,
  onFileUpload,
}: Readonly<Props>) => {
  const { t } = useTranslation("connectors");
  const [credentials, setCredentials] = useState<{
    refreshToken: string;
    accessToken: string;
  } | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);

  const { beginAddingDb, endAddingDb } = useOrganizationDbActions();

  const isLoading =
    flowState === "picking" ||
    flowState === "connecting" ||
    flowState === "ingesting";

  const handleSheetPicked = useCallback(
    async (doc: { id: string; name: string }, accessToken: string) => {
      setError(null);

      // Lock org switching for the request lifetime (released in finally).
      beginAddingDb();
      try {
        setFlowState("connecting");

        const createResponse = await uploadGoogleSheet({
          fileId: doc.id,
          fileName: doc.name,
          accessToken,
        });

        setFlowState("ingesting");

        const dataSourceId = createResponse.data_sources[0]?.data_source_id;

        if (!dataSourceId) throw new Error("No data source ID returned");
        const tableName = doc.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "_");
        await ingestDataSource(dataSourceId, tableName);

        setFlowState("done");
        onFileUpload(createResponse.orgdb_id);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { detail?: string; message?: string } };
        };
        const msg =
          axiosErr?.response?.data?.detail ??
          axiosErr?.response?.data?.message ??
          (err instanceof Error ? err.message : null) ??
          t("oauth.connectionFailed");
        setError(msg);
        setFlowState("error");
      } finally {
        endAddingDb();
      }
    },
    [onFileUpload, t, beginAddingDb, endAddingDb],
  );

  const openPicker = useCallback(
    async (accessToken: string) => {
      setFlowState("picking");
      setError(null);

      try {
        const res = await fetch("/api/oauth/google/picker-config");

        if (!res.ok) throw new Error(t("oauth.pickerConfigFailed"));
        const { appId, developerKey } = await res.json();

        try {
          await loadGapi();
        } catch {
          throw new Error(t("oauth.gapiFailed"));
        }
        await new Promise<void>((resolve) =>
          globalThis.window.gapi.load("picker", resolve),
        );

        const csvView = new globalThis.window.google.picker.DocsView()
          .setMimeTypes(CSV_MIME_TYPE)
          .setMode(globalThis.window.google.picker.DocsViewMode.LIST);

        const picker = new globalThis.window.google.picker.PickerBuilder()
          .setOAuthToken(accessToken)
          .setDeveloperKey(developerKey)
          .setAppId(appId)
          .setOrigin(globalThis.window.location.origin)
          .addView(csvView)
          .setCallback(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (data: any) => {
              if (data.action === "cancel") {
                setFlowState("idle");
                return;
              }
              if (data.action !== "picked" || !data.docs?.[0]) return;
              await handleSheetPicked(data.docs[0], accessToken);
            },
          )
          .build();

        picker.setVisible(true);
        // Picker is now open as a modal overlay — reset spinner
        setFlowState("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("oauth.pickerFailed"));
        setFlowState("error");
      }
    },
    [handleSheetPicked, t],
  );

  const handleOAuthChange = useCallback(
    async (refreshToken: string, accessToken: string) => {
      if (!refreshToken) {
        setCredentials(null);
        return;
      }
      setCredentials({ refreshToken, accessToken });
      await openPicker(accessToken);
    },
    [openPicker],
  );

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

          {/* Right panel */}
          <div className="p-5">
            <GcpOAuthButton
              label={t("oauth.gcpAccountLabel")}
              required
              value={credentials?.refreshToken ?? ""}
              onChange={handleOAuthChange}
            />

            {flowState === "picking" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="Loader2" size="xs" className="animate-spin" />
                {t("oauth.openingPicker")}
              </div>
            )}

            {flowState === "connecting" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="Loader2" size="xs" className="animate-spin" />
                {t("oauth.connecting")}
              </div>
            )}

            {flowState === "ingesting" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="Loader2" size="xs" className="animate-spin" />
                {t("oauth.ingesting")}
              </div>
            )}

            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Icon name="Info" size="xxs" className="mt-px shrink-0" />
              <span>{t("oauth.csvOnlyNote")}</span>
            </div>

            {credentials && !isLoading && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("oauth.noSpreadsheet")}{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => openPicker(credentials.accessToken)}
                >
                  {t("oauth.pickSheet")}
                </button>
              </p>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-1.5">
                <Icon
                  name="AlertCircle"
                  size="xxs"
                  variant="destructive"
                  className="mt-px shrink-0"
                />
                <p className="text-[11px] text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
