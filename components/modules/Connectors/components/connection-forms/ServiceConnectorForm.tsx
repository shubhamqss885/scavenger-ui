"use client";

import { useContext, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { AxiosContext } from "@/lib/context/AuthContext";
import { flattenFields } from "../../config/connectorData";
import type { Connector } from "../../config/connectorData";
import type { ConnectionState, SecurityConfig } from "../../types";
import {
  buildDefaults,
  buildZodSchema,
  fetchGcpCredentials,
} from "./formHelpers";
import { ConnectorFormLeftPanel } from "./ConnectorFormLeftPanel";
import { useConnectorFormFields } from "./useConnectorFormFields";
import { useTestConnection } from "./useTestConnection";
import { ConnectorTestResult } from "./ConnectorTestResult";

type Props = {
  connector: Connector;
  onSubmit: (url: string, display: string, security?: SecurityConfig) => void;
  connectionState?: ConnectionState;
  connectionError?: string;
  onGoToDataSource?: () => void;
};

/**
 * Form for cloud service and BI tool connectors (template: "service").
 * No connection-string paste mode — credentials are structured fields only.
 *
 * For connectors with a gcp-oauth field, the form stores the refresh_token.
 * On submit, the full credentials JSON is fetched server-side (so client_secret
 * never appears in the browser) before building the connection URL.
 */
export const ServiceConnectorForm = ({
  connector,
  onSubmit,
  connectionState = "idle",
  connectionError,
  onGoToDataSource,
}: Readonly<Props>) => {
  const { t } = useTranslation("connectors");
  const { token } = useContext(AxiosContext);

  const formSchema = useMemo(
    () => buildZodSchema(connector.fields),
    [connector.fields],
  );

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(connector.fields),
  });

  const watchedValues = useWatch({ control: form.control });
  const { renderFields } = useConnectorFormFields(form);

  const firstRequiredField = useMemo(
    () => flattenFields(connector.fields).find((f) => f.required),
    [connector.fields],
  );
  const previewText =
    firstRequiredField && watchedValues[firstRequiredField.name]
      ? connector.buildDisplayUrl(watchedValues as Record<string, string>)
      : null;

  const hasGcpOAuth = useMemo(
    () => flattenFields(connector.fields).some((f) => f.type === "gcp-oauth"),
    [connector.fields],
  );

  const {
    testStatus,
    testError,
    testHint,
    testDetailsOpen,
    setTestDetailsOpen,
    testWarnings,
    handleTestConnection,
  } = useTestConnection({
    getUrl: async () => {
      const isValid = await form.trigger();

      if (!isValid) return null;

      let urlData = { ...form.getValues() };

      // For GCP connectors, fetch full credentials JSON from server before validating
      if (hasGcpOAuth && urlData.credentialsJson) {
        const credentialsJson = await fetchGcpCredentials(
          urlData.credentialsJson,
        );

        urlData = { ...urlData, credentialsJson };
      }

      return connector.buildUrl(urlData as Record<string, string>);
    },
    token,
    defaultError: t("test.defaultError"),
    networkError: t("test.networkError"),
  });

  const handleFormSubmit = async (data: Record<string, string>) => {
    let urlData = { ...data };

    // For GCP connectors the form holds a refresh_token, not the full credentials JSON.
    // Fetch the complete authorized_user JSON (with client_secret) from the server.
    if (hasGcpOAuth && data.credentialsJson) {
      try {
        const credentialsJson = await fetchGcpCredentials(data.credentialsJson);
        urlData = { ...data, credentialsJson };
      } catch {
        form.setError("credentialsJson", {
          message: t("oauth.credentialsRetrievalFailed"),
        });
        return;
      }
    }

    onSubmit(connector.buildUrl(urlData), connector.buildDisplayUrl(urlData));
  };

  const isConnecting = connectionState === "connecting";
  const isSuccess = connectionState === "success";

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <ConnectorFormLeftPanel
            connector={connector}
            previewText={previewText}
          />

          {/* Right panel — form fields only, no connection-string tab */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* Success state */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-h-[300px] flex-col items-center justify-center text-center"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Icon
                      name="CheckCircle2"
                      className="h-7 w-7 text-green-600 dark:text-green-400"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("form.successTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("form.successSubtitle", { dialect: connector.name })}
                  </p>
                  {onGoToDataSource && (
                    <Button onClick={onGoToDataSource} className="mt-6 gap-1.5">
                      {t("form.goToDataSource")}
                      <Icon name="ArrowRight" size="sm" />
                    </Button>
                  )}
                </motion.div>
              ) : (
                /* Form state */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Form {...form}>
                    <form
                      id="service-connector-form"
                      onSubmit={form.handleSubmit(handleFormSubmit)}
                      className="space-y-3"
                    >
                      {renderFields(connector.fields)}

                      {/* Mobile-only preview */}
                      {previewText && (
                        <div className="rounded-md border border-border bg-muted/50 p-2.5 lg:hidden">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("leftPanel.preview")}
                          </p>
                          <code className="block break-all font-mono text-[11px] leading-relaxed text-foreground">
                            {previewText}
                          </code>
                        </div>
                      )}
                    </form>
                  </Form>

                  {/* Test Connection */}
                  <div className="mt-4 flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {t("test.title")}
                      </p>
                      <AnimatePresence mode="wait">
                        <ConnectorTestResult
                          testStatus={testStatus}
                          testError={testError}
                          testHint={testHint}
                          testDetailsOpen={testDetailsOpen}
                          setTestDetailsOpen={setTestDetailsOpen}
                          testWarnings={testWarnings}
                        />
                      </AnimatePresence>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testStatus === "testing"}
                      className="gap-1.5"
                    >
                      {testStatus === "testing" ? (
                        <Icon
                          name="Loader2"
                          size="xxs"
                          className="animate-spin"
                        />
                      ) : (
                        <Icon name="Plug" size="xxs" />
                      )}
                      {testStatus === "testing"
                        ? t("test.testing")
                        : t("test.button")}
                    </Button>
                  </div>

                  {/* Connection error */}
                  {connectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
                    >
                      <Icon
                        name="XCircle"
                        size="sm"
                        className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                      />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {connectionError}
                      </p>
                    </motion.div>
                  )}

                  {/* Connect button */}
                  <div className="mt-3">
                    <Button
                      type="submit"
                      form="service-connector-form"
                      size="sm"
                      disabled={isConnecting}
                      className="w-full gap-1.5"
                    >
                      {isConnecting ? (
                        <Icon
                          name="Loader2"
                          size="xxs"
                          className="animate-spin"
                        />
                      ) : (
                        <Icon name="Lock" size="xxs" />
                      )}
                      {isConnecting
                        ? t("form.connecting")
                        : t("form.connectSecurely")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
