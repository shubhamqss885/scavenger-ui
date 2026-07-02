"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { AxiosContext } from "@/lib/context/AuthContext";
import {
  flattenFields,
  maskConnectionString,
} from "../../config/connectorData";
import type { Connector } from "../../config/connectorData";
import type { ConnectionState, SecurityConfig } from "../../types";
import { SSLSettings } from "../security/SSLSettings";
import type { SSLConfig } from "../security/SSLSettings";
import { SSHTunnelSettings } from "../security/SSHTunnelSettings";
import type { SSHConfig } from "../security/SSHTunnelSettings";
import { buildDefaults, buildZodSchema } from "./formHelpers";
import { ConnectorFormLeftPanel } from "./ConnectorFormLeftPanel";
import { useConnectorFormFields } from "./useConnectorFormFields";
import { useConnectorFormStorage } from "../../hooks/useConnectorFormStorage";
import { useTestConnection } from "./useTestConnection";
import { ConnectorTestResult } from "./ConnectorTestResult";

type Props = {
  connector: Connector;
  onSubmit: (url: string, display: string, security?: SecurityConfig) => void;
  showSecuritySettings?: boolean;
  showSSHTunnel?: boolean;
  connectionState?: ConnectionState;
  connectionError?: string;
  orgdbId?: string | null;
  onGoToDataSource?: () => void;
  /** Initial field values for edit mode */
  initialValues?: Record<string, string>;
  /** When true, shows "Save" instead of "Connect" */
  isEditing?: boolean;
};

export const StandardConnectorForm = ({
  connector,
  onSubmit,
  showSecuritySettings = false,
  showSSHTunnel = false,
  connectionState = "idle",
  connectionError,
  onGoToDataSource,
  initialValues,
  isEditing = false,
}: Readonly<Props>) => {
  const { t } = useTranslation("connectors");
  const { token } = useContext(AxiosContext);

  const [pasteMode, setPasteMode] = useState(false);
  const [rawConnectionString, setRawConnectionString] = useState("");
  const [sslConfig, setSslConfig] = useState<SSLConfig>({
    enabled: false,
    mode: "require",
    caFileId: null,
    caPem: null,
    caFileName: null,
    certFileId: null,
    certPem: null,
    certFileName: null,
    keyFileId: null,
    keyFileName: null,
  });

  const [sshConfig, setSshConfig] = useState<SSHConfig>({
    enabled: false,
    host: "",
    port: "22",
    user: "",
    privateKeyFile: null,
    privateKeyFileName: null,
    passphrase: "",
  });

  const formSchema = useMemo(
    () => buildZodSchema(connector.fields),
    [connector.fields],
  );

  // Session storage for form persistence
  const { getStoredValues, saveValues, isInitializedRef } =
    useConnectorFormStorage(connector.id);

  // Get password field names to exclude from storage
  const passwordFieldNames = useMemo(
    () =>
      flattenFields(connector.fields)
        .filter((f) => f.type === "password")
        .map((f) => f.name),
    [connector.fields],
  );

  // Merge stored values with defaults (or use initialValues for edit mode)
  const defaultValues = useMemo(() => {
    const defaults = buildDefaults(connector.fields);

    // In edit mode, use initialValues directly
    if (isEditing && initialValues) {
      return { ...defaults, ...initialValues };
    }

    const stored = getStoredValues();

    if (stored) {
      return { ...defaults, ...stored };
    }

    return defaults;
  }, [connector.fields, getStoredValues, isEditing, initialValues]);

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchedValues = useWatch({ control: form.control });
  const { renderFields } = useConnectorFormFields(form);

  // Save form values to sessionStorage on change (debounced via effect)
  useEffect(() => {
    // Skip initial render to avoid overwriting with empty values
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    saveValues(watchedValues as Record<string, string>, passwordFieldNames);
  }, [watchedValues, saveValues, passwordFieldNames, isInitializedRef]);

  const firstRequiredField = useMemo(
    () => flattenFields(connector.fields).find((f) => f.required),
    [connector.fields],
  );
  const previewText =
    firstRequiredField && watchedValues[firstRequiredField.name]
      ? connector.buildDisplayUrl(watchedValues as Record<string, string>)
      : null;

  const buildSecurity = (): SecurityConfig | undefined => {
    const security: SecurityConfig = {};

    if (sshConfig.enabled) security.ssh = sshConfig;
    if (sslConfig.enabled) security.ssl = sslConfig;

    return Object.keys(security).length > 0 ? security : undefined;
  };

  const [showSslError, setShowSslError] = useState(false);

  const sslError = useMemo(() => {
    if (!sslConfig.enabled) return null;
    const hasCert = Boolean(sslConfig.certFileId);
    const hasKey = Boolean(sslConfig.keyFileId);

    if (hasCert && !hasKey) return t("security.ssl.errors.certNeedsKey");

    if (hasKey && !hasCert) return t("security.ssl.errors.keyNeedsCert");

    const needsVerify =
      sslConfig.mode === "verify-ca" || sslConfig.mode === "verify-full";

    if (needsVerify && !sslConfig.caFileId)
      return t("security.ssl.errors.caRequired");
    return null;
  }, [
    sslConfig.enabled,
    sslConfig.mode,
    sslConfig.caFileId,
    sslConfig.certFileId,
    sslConfig.keyFileId,
    t,
  ]);

  useEffect(() => {
    setShowSslError(false);
  }, [
    sslConfig.mode,
    sslConfig.caFileId,
    sslConfig.certFileId,
    sslConfig.keyFileId,
  ]);

  const handleFormSubmit = (data: Record<string, string>) => {
    if (sslError) {
      setShowSslError(true);
      return;
    }
    onSubmit(
      connector.buildUrl(data),
      connector.buildDisplayUrl(data),
      buildSecurity(),
    );
  };

  const handlePasteSubmit = () => {
    if (sslError) {
      setShowSslError(true);
      return;
    }
    const trimmed = rawConnectionString.trim();

    if (!trimmed) return;
    onSubmit(trimmed, maskConnectionString(trimmed), buildSecurity());
  };

  const getTestUrl = async () => {
    if (sslError) {
      setShowSslError(true);
      return null;
    }

    if (pasteMode) {
      const url = rawConnectionString.trim();
      return url || null;
    }

    const isValid = await form.trigger();

    if (!isValid) return null;

    return connector.buildUrl(form.getValues());
  };

  const {
    testStatus,
    testError,
    testHint,
    testDetailsOpen,
    setTestDetailsOpen,
    testWarnings,
    handleTestConnection,
  } = useTestConnection({
    getUrl: getTestUrl,
    getSslConfig: () => (sslConfig.enabled ? sslConfig : undefined),
    token,
    defaultError: t("test.defaultError"),
    networkError: t("test.networkError"),
  });

  const isConnecting = connectionState === "connecting";
  const isSuccess = connectionState === "success";
  const connectLabel = isEditing
    ? t("form.saveChanges")
    : t("form.connectSecurely");

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card",
          isEditing && "border-0",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-[260px_1fr]",
            isEditing && "lg:grid-cols-1",
          )}
        >
          {!isEditing && (
            <ConnectorFormLeftPanel
              connector={connector}
              previewText={previewText}
            />
          )}

          {/* Right panel */}
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
                  {/* Mode toggle */}
                  <div className="mb-4 inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setPasteMode(false)}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        pasteMode
                          ? "hover:text-foreground"
                          : "bg-background text-foreground shadow-sm",
                      )}
                    >
                      {t("form.modeForm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasteMode(true)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        pasteMode
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:text-foreground",
                      )}
                    >
                      <Icon name="Code2" size="xxs" />
                      {t("form.modeConnectionString")}
                    </button>
                  </div>

                  {/* Main input area */}
                  <AnimatePresence mode="wait">
                    {pasteMode ? (
                      <motion.div
                        key="paste-mode"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-1.5"
                      >
                        <label
                          htmlFor="connection-string-input"
                          className="text-xs font-medium text-foreground"
                        >
                          {t("form.connectionStringLabel")}
                        </label>
                        <Textarea
                          id="connection-string-input"
                          value={rawConnectionString}
                          onChange={(e) =>
                            setRawConnectionString(e.target.value)
                          }
                          placeholder={connector.pasteModePlaceholder}
                          className="min-h-[100px] resize-none font-mono text-xs"
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("form.connectionStringHint")}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form-mode"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Form {...form}>
                          <form
                            id="connector-form"
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
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Security & Test ── */}
                  <div className="mt-4 space-y-2">
                    {/* SSL Settings */}
                    {showSecuritySettings && (
                      <div>
                        <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon name="ShieldCheck" size="xs" />
                            <span className="text-xs font-medium text-foreground">
                              {t("security.ssl.title")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {sslConfig.enabled
                                ? t("security.ssl.status", {
                                    mode: sslConfig.mode,
                                  })
                                : t("security.ssl.disabled")}
                            </span>
                          </div>
                          <Switch
                            checked={sslConfig.enabled}
                            onCheckedChange={(checked) =>
                              setSslConfig((prev) => ({
                                ...prev,
                                enabled: checked,
                              }))
                            }
                          />
                        </div>
                        {sslConfig.enabled && (
                          <div className="mt-2 rounded-md border border-border p-3">
                            <SSLSettings
                              config={sslConfig}
                              onChange={setSslConfig}
                              dbType={connector.id}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* SSH Tunnel */}
                    {showSecuritySettings && showSSHTunnel && (
                      <div>
                        <div className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon name="Terminal" size="xs" />
                            <span className="text-xs font-medium text-foreground">
                              {t("security.ssh.title")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {sshConfig.enabled
                                ? sshConfig.host
                                  ? t("security.ssh.host", {
                                      host: sshConfig.host,
                                    })
                                  : t("security.ssh.enabled")
                                : t("security.ssh.disabled")}
                            </span>
                          </div>
                          <Switch
                            checked={sshConfig.enabled}
                            onCheckedChange={(checked) =>
                              setSshConfig((prev) => ({
                                ...prev,
                                enabled: checked,
                              }))
                            }
                          />
                        </div>
                        {sshConfig.enabled && (
                          <div className="mt-2 rounded-md border border-border p-3">
                            <SSHTunnelSettings
                              config={sshConfig}
                              onChange={setSshConfig}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Test Connection */}
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
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
                            validationError={showSslError ? sslError : null}
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

                  {/* Connect / Save */}
                  <div className="mt-3">
                    {pasteMode ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!rawConnectionString.trim() || isConnecting}
                        onClick={handlePasteSubmit}
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
                        {isConnecting ? t("form.connecting") : connectLabel}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        form="connector-form"
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
                        {isConnecting ? t("form.connecting") : connectLabel}
                      </Button>
                    )}
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
