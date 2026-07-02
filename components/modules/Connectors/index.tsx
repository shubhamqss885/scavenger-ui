"use client";

import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { isJSON } from "@/components/modules/AgenticChat/utils";
import { CredentialInput } from "./components/credentials/CredentialInput";
import { CONNECTORS, type ConnectorId } from "./config/connectorData";
import { ConnectorForm } from "./components/connection-forms/ConnectorForm";
import { ConnectPanel } from "./components/connector-display/ConnectPanel";
import PageHeader from "@/components/blocks/Header";
import { Icon } from "@/components/ui/icon";
import { HELP_CALENDAR_URL } from "@/lib/constants";
import type {
  ProgressStep,
  ChatMessage,
  CredentialRequest,
  SecurityConfig,
} from "./types";
import { DB_CONNECT_WS_URL, API_BASE } from "./types";
import { encryptForServer } from "@/lib/services/ecdhService";
import { AxiosContext } from "@/lib/context/AuthContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useOrganizationDbActions } from "@/lib/context/OrganizationDbProvider";
import { useTranslation } from "@/lib/i18n/client";
import { useConnectorFormStorage } from "./hooks/useConnectorFormStorage";

type Props = Readonly<{
  initialConnectorId?: ConnectorId;
}>;

const Connectors = ({ initialConnectorId }: Props) => {
  const { t } = useTranslation("common");
  const { t: tc } = useTranslation("connectors");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingCredential, setPendingCredential] =
    useState<CredentialRequest | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [orgdbId, setOrgdbId] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<
    "idle" | "connecting" | "validating" | "registering" | "complete" | "error"
  >("idle");
  const [connectionError, setConnectionError] = useState("");

  // Use URL-based connector selection
  const selectedConnector = initialConnectorId ?? null;

  // Storage hook to clear form data on successful connection
  const { clearStorage } = useConnectorFormStorage(
    selectedConnector ?? "postgresql",
  );

  const router = useRouter();
  const { token } = useContext(AxiosContext);
  const { organizationDetails } = useOrgFeatures();
  const { fetchOrganizationDbs, beginAddingDb, endAddingDb } =
    useOrganizationDbActions();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAccumRef = useRef("");
  const wsRef = useRef<WebSocket | null>(null);
  const releaseAddingDbRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const progressStepsRef = useRef<ProgressStep[]>([]);
  const streamingDeltaRef = useRef("");
  const securityConfigRef = useRef<SecurityConfig | undefined>(undefined);

  const closeCurrentSocket = useCallback(() => {
    const ws = wsRef.current;
    const releaseAddingDb = releaseAddingDbRef.current;

    wsRef.current = null;
    releaseAddingDbRef.current = null;
    releaseAddingDb?.();
    ws?.close();
  }, []);

  useEffect(() => closeCurrentSocket, [closeCurrentSocket]);

  useEffect(() => {
    progressStepsRef.current = progressSteps;
  }, [progressSteps]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progressSteps, pendingCredential]);

  const updateLastAgentMessage = useCallback(
    (updater: (msg: ChatMessage) => Partial<ChatMessage>) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.at(-1);

        if (last?.role === "agent") {
          updated[updated.length - 1] = { ...last, ...updater(last) };
        }
        return updated;
      });
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // WebSocket handlers (unchanged business logic)
  // ---------------------------------------------------------------------------

  const finalizeResponse = useCallback(() => {
    if (streamingDeltaRef.current) {
      if (textAccumRef.current && !textAccumRef.current.endsWith("\n")) {
        textAccumRef.current += "\n\n";
      }
      textAccumRef.current += streamingDeltaRef.current;
      streamingDeltaRef.current = "";
    }
    updateLastAgentMessage(() => ({
      text: textAccumRef.current,
      steps: [...progressStepsRef.current],
    }));
    setIsStreaming(false);
    setProgressSteps([]);

    // If agent finished without reaching "complete", treat it as an error
    setConnectionStage((prev) => {
      if (prev === "complete" || prev === "idle" || prev === "error")
        return prev;
      // Use agent's response text as error message if available
      const agentError = textAccumRef.current?.trim();
      setConnectionError(agentError || tc("progress.status.incompleteError"));
      return "error";
    });
  }, [updateLastAgentMessage, tc]);

  const appendToTextAccum = useCallback((text: string) => {
    if (textAccumRef.current && !textAccumRef.current.endsWith("\n")) {
      textAccumRef.current += "\n\n";
    }
    textAccumRef.current += text;
  }, []);

  const handleNonJsonMessage = useCallback(
    (data: string) => {
      appendToTextAccum(data);
      setProgressSteps((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          tool: "_text",
          message: "",
          status: "done" as const,
          toolOutput: { raw: data },
        },
      ]);
    },
    [appendToTextAccum],
  );

  const handleTextDelta = useCallback((content: string) => {
    streamingDeltaRef.current += content;
    const blockText = streamingDeltaRef.current;

    setProgressSteps((prev) => {
      const last = prev.at(-1);

      if (last?.tool === "_text" && last?.status === "streaming") {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          toolOutput: { raw: blockText },
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          tool: "_text",
          message: "",
          status: "streaming" as const,
          toolOutput: { raw: blockText },
        },
      ];
    });
  }, []);

  const handleTextComplete = useCallback(() => {
    if (streamingDeltaRef.current) {
      appendToTextAccum(streamingDeltaRef.current);
    }
    streamingDeltaRef.current = "";
    setProgressSteps((prev) => {
      const updated = [...prev];
      const last = updated.at(-1);

      if (last?.status === "streaming") {
        updated[updated.length - 1] = { ...last, status: "done" };
      }
      return updated;
    });
  }, [appendToTextAccum]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgressUpdate = useCallback((obj: any) => {
    if (obj.status === "calling") {
      const tool = obj.tool || "";

      if (tool.includes("validate_db_connection")) {
        setConnectionStage("validating");
      } else if (tool.includes("register_database")) {
        setConnectionStage("registering");
      }
      setProgressSteps((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          tool: obj.tool || "",
          message: obj.message || "Working\u2026",
          status: "calling",
        },
      ]);
      return;
    }

    if (obj.status === "done") {
      setProgressSteps((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const doneTool = obj.tool || "";
        let idx = doneTool
          ? updated.findIndex(
              (s) => s.status === "calling" && s.tool === doneTool,
            )
          : -1;

        if (idx < 0) {
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].status === "calling") {
              idx = i;
              break;
            }
          }
        }

        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            status: "done",
            message: obj.message || "Done",
            durationMs: obj.duration_ms,
          };
        }
        return updated;
      });
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWsError = useCallback(
    (obj: any) => {
      setConnectionStage("error");

      setConnectionError(obj.error);
      updateLastAgentMessage(() => ({ text: `Error: ${obj.error}` }));
    },
    [updateLastAgentMessage],
  );

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data as string;

      if (!isJSON(data)) {
        handleNonJsonMessage(data);
        return;
      }

      const obj = JSON.parse(data);

      if (obj.message === "response ended") {
        finalizeResponse();
        return;
      }
      if (obj.type === "ping") return;

      if (obj.type === "session_init") {
        sessionIdRef.current = obj.session_id;
        return;
      }

      if (obj.type === "credential_request") {
        setPendingCredential({
          credential_type: obj.credential_type,
          prompt_message: obj.prompt_message,
        });
        return;
      }

      if (obj.type === "connection_established") {
        // Connection validated, continue to registration
        return;
      }

      if (obj.type === "connection_complete") {
        setOrgdbId(obj.orgdb_id || null);
        setConnectionStage("complete");
        // Refresh org databases so the new one appears in the sidebar
        if (organizationDetails?.org_id) {
          fetchOrganizationDbs(organizationDetails.org_id);
        }
        return;
      }

      if (obj.type === "text_delta") {
        handleTextDelta(obj.content as string);
        return;
      }

      if (obj.type === "text_complete") {
        handleTextComplete();
        return;
      }

      if (obj.type === "progress") {
        handleProgressUpdate(obj);
        return;
      }

      if (obj.error) {
        handleWsError(obj);
      }
    },
    [
      finalizeResponse,
      handleNonJsonMessage,
      handleTextDelta,
      handleTextComplete,
      handleProgressUpdate,
      handleWsError,
      fetchOrganizationDbs,
      organizationDetails?.org_id,
    ],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const sendWsMessage = useCallback(
    (query: string, displayText?: string) => {
      if (isStreaming) return;

      const agentMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        text: "",
      };

      if (query.trim()) {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          text: displayText ?? query,
        };
        setMessages((prev) => [...prev, userMsg, agentMsg]);
      } else {
        setMessages((prev) => [...prev, agentMsg]);
      }

      setIsStreaming(true);
      setProgressSteps([]);
      setConnectionStage("connecting");
      setConnectionError("");
      textAccumRef.current = "";
      streamingDeltaRef.current = "";

      if (wsRef.current) {
        closeCurrentSocket();
      }

      // Hold the org-switch lock for the socket's lifetime; the idempotent
      // release lets unmount unlock immediately, with onclose as the normal path.
      beginAddingDb();
      let hasReleasedAddingDb = false;
      const releaseAddingDb = () => {
        if (hasReleasedAddingDb) return;
        hasReleasedAddingDb = true;
        endAddingDb();
      };

      let ws: WebSocket;

      try {
        ws = new WebSocket(DB_CONNECT_WS_URL);
      } catch (error) {
        releaseAddingDb();
        const networkError = t("errors.networkLost");
        console.error("Failed to open DB connector WebSocket:", error);
        setIsStreaming(false);
        setConnectionStage("error");
        setConnectionError(networkError);
        updateLastAgentMessage(() => ({ text: networkError }));
        return;
      }

      wsRef.current = ws;
      releaseAddingDbRef.current = releaseAddingDb;

      const sec = securityConfigRef.current;

      ws.onopen = async () => {
        // Encrypt connection string if server supports it
        let connectionStringToSend: string;

        try {
          connectionStringToSend = await encryptForServer(query);
        } catch (err) {
          // Server encryption not configured - send plaintext
          console.debug("Encryption not available, sending plaintext:", err);
          connectionStringToSend = query;
        }

        if (ws.readyState !== WebSocket.OPEN) return;

        ws.send(
          JSON.stringify({
            auth_token: token,
            connection_string: connectionStringToSend,
            org_id: organizationDetails?.org_id ?? "",
            ssh_config: sec?.ssh?.enabled ? sec.ssh : undefined,
            ssl_config: sec?.ssl?.enabled
              ? {
                  mode: sec.ssl.mode,
                  ca_cert: sec.ssl.caFileId,
                  cert: sec.ssl.certFileId,
                  key: sec.ssl.keyFileId,
                }
              : undefined,
          }),
        );
      };

      ws.onmessage = handleWsMessage;

      ws.onerror = () => {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.at(-1);

          if (last?.role === "agent" && !last.text) {
            updated[updated.length - 1] = {
              ...last,
              text: t("errors.networkLost"),
            };
          }
          return updated;
        });
      };

      ws.onclose = () => {
        releaseAddingDb();
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        releaseAddingDbRef.current = null;
        finalizeResponse();
        setPendingCredential(null);
      };
    },
    [
      isStreaming,
      handleWsMessage,
      finalizeResponse,
      token,
      organizationDetails?.org_id,
      t,
      beginAddingDb,
      endAddingDb,
      closeCurrentSocket,
      updateLastAgentMessage,
    ],
  );

  const sendQuery = useCallback(
    (query: string, displayText?: string, security?: SecurityConfig) => {
      if (!query.trim()) return;
      securityConfigRef.current = security;
      sendWsMessage(query, displayText);
    },
    [sendWsMessage],
  );

  // Refetch so the new DB is in provider state before etl.completed arrives.
  const handleDataSourceCreated = useCallback(() => {
    if (organizationDetails?.org_id) {
      fetchOrganizationDbs(organizationDetails.org_id);
    }
  }, [fetchOrganizationDbs, organizationDetails?.org_id]);

  const handleFileUpload = useCallback(
    (newOrgdbId: string) => {
      setOrgdbId(newOrgdbId);
      setConnectionStage("complete");
      clearStorage();
      router.push(`/data-sources/${newOrgdbId}`);
    },
    [clearStorage, router],
  );

  const handleCredentialSubmit = useCallback((value: string) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ value }));
    setPendingCredential(null);
  }, []);

  const resetConnectionState = useCallback(() => {
    closeCurrentSocket();
    setMessages([]);
    setIsStreaming(false);
    setPendingCredential(null);
    setProgressSteps([]);
    setOrgdbId(null);
    setConnectionStage("idle");
    setConnectionError("");
    textAccumRef.current = "";
    streamingDeltaRef.current = "";
    sessionIdRef.current = crypto.randomUUID();
  }, [closeCurrentSocket]);

  // Clean up session and navigate back to connector list
  const handleBack = useCallback(async () => {
    try {
      await fetch(
        `${API_BASE}/agentic/db_connect/disconnect?session_id=${sessionIdRef.current}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
    } catch {
      // Ignore - we still want to reset state
    }
    resetConnectionState();
    router.push("/connectors");
  }, [token, router, resetConnectionState]);

  // ---------------------------------------------------------------------------
  // Determine connection state for the form
  // ---------------------------------------------------------------------------

  // Map internal stages to simplified form state
  const formConnectionState = (() => {
    if (connectionStage === "complete") return "success" as const;
    if (connectionStage === "error") return "error" as const;
    if (connectionStage !== "idle" || isStreaming) return "connecting" as const;
    return "idle" as const;
  })();

  const handleGoToDataSource = useCallback(() => {
    clearStorage();
    router.push(`/data-sources/${orgdbId}`);
  }, [clearStorage, router, orgdbId]);

  return (
    <div className="flex h-screen flex-col bg-background font-sans">
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedConnector ? (
            <motion.div
              key="connector-form"
              className="flex h-full flex-col overflow-hidden px-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <PageHeader
                title={
                  CONNECTORS.find((c) => c.id === selectedConnector)?.name ?? ""
                }
                onBack={handleBack}
              >
                <a
                  href={HELP_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-xs items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:max-w-none sm:shrink-0"
                >
                  <Icon name="Calendar" size="xs" />
                  {tc("panel.needHelp")}
                </a>
              </PageHeader>

              <div className="min-h-0 flex-1 overflow-y-auto pb-6">
                <ConnectorForm
                  connectorId={selectedConnector}
                  onSubmit={sendQuery}
                  onFileUpload={handleFileUpload}
                  onDataSourceCreated={handleDataSourceCreated}
                  connectionState={formConnectionState}
                  connectionError={connectionError}
                  orgdbId={orgdbId}
                  onGoToDataSource={handleGoToDataSource}
                />
              </div>

              {/* Credential input overlay */}
              {pendingCredential && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="w-full max-w-md px-4">
                    <CredentialInput
                      request={pendingCredential}
                      onSubmit={handleCredentialSubmit}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="connect-panel"
              className="h-full"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ConnectPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Connectors;
