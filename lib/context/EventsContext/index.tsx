"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { AxiosContext } from "@/lib/context/AuthContext";
import { refreshOrForceLogout } from "@/lib/services/axiosInstances/tokenRefresh";
import {
  PaymentEvent,
  OrgDbStatusEvent,
  DataSourceEvent,
  IngestionEvent,
  FileIndexingEvent,
  AppEvent,
  PaymentEventsContextValue,
  OrgDbStatusEventsContextValue,
  DataSourceEventsContextValue,
  IngestionEventsContextValue,
  FileIndexingEventsContextValue,
} from "./types";

// Three Separate Contexts
const PaymentEventsContext = createContext<PaymentEventsContextValue>({
  events: [],
  clearEvents: async () => {},
});

const OrgDbStatusEventsContext = createContext<OrgDbStatusEventsContextValue>({
  events: [],
});

const DataSourceEventsContext = createContext<DataSourceEventsContextValue>({
  events: [],
});

const IngestionEventsContext = createContext<IngestionEventsContextValue>({
  events: [],
});

const FileIndexingEventsContext = createContext<FileIndexingEventsContextValue>(
  {
    events: [],
    seedEvents: () => {},
    removeEvent: () => {},
  },
);

// EventsProvider - Single WebSocket, Split State
type EventsProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export const EventsProvider = ({ children }: EventsProviderProps) => {
  const { token, authStatus } = useContext(AxiosContext);
  const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;

  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [orgDbStatusEvents, setOrgDbStatusEvents] = useState<
    OrgDbStatusEvent[]
  >([]);
  const [dataSourceEvents, setDataSourceEvents] = useState<DataSourceEvent[]>(
    [],
  );
  const [ingestionEvents, setIngestionEvents] = useState<IngestionEvent[]>([]);
  const [fileIndexingEvents, setFileIndexingEvents] = useState<
    FileIndexingEvent[]
  >([]);

  // Clear payment events (calls backend + clears local state)
  const clearPaymentEvents = useCallback(async () => {
    try {
      await axios.post("/api/payments/events/clear-notification-events");
      setPaymentEvents([]);
    } catch (error) {
      console.error("Failed to clear payment events:", error);
      throw error;
    }
  }, []);

  // Single WebSocket connection
  useEffect(() => {
    if (!wsBaseUrl || !token || authStatus !== "ready") {
      return;
    }

    const eventsUrl = `${wsBaseUrl}/llm/notifications/stream`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      socket = new WebSocket(eventsUrl);

      socket.onopen = () => {
        if (isUnmounted) return;
        // Connected successfully — reset the backoff so the next drop starts
        // from a short delay again.
        reconnectAttempts = 0;
        // Authenticate
        socket?.send(JSON.stringify({ auth_token: token }));
      };

      socket.onmessage = (event) => {
        if (isUnmounted) return;

        try {
          const raw = JSON.parse(event.data) as Record<string, unknown>;

          // Auth error detection — refresh token then close to trigger
          // reconnect via the useEffect (token is in the dependency array)
          if (
            raw.error === "unauthorized" ||
            raw.error === "invalid_token" ||
            (typeof raw.message === "string" &&
              raw.message.toLowerCase().includes("invalid jwt"))
          ) {
            console.warn("[Events] Auth error detected, refreshing token");
            refreshOrForceLogout()
              .catch(() => {
                // Force logout already triggered inside refreshOrForceLogout
              })
              .finally(() => {
                socket?.close();
              });
            return;
          }

          // BE may still emit schema_description.completed but FE no longer
          // gates on it. Short-circuit before narrowing to AppEvent so the
          // switch can stay exhaustive over the active union.
          if (raw.type === "schema_description.completed") return;

          const payload = raw as unknown as AppEvent;

          // Route to appropriate state based on event type
          switch (payload.type) {
            case "subscription_deleted":
            case "subscription_updated":
              setPaymentEvents([payload]);
              break;

            case "orgdb_task_status":
              setOrgDbStatusEvents([payload]);
              break;

            case "table_names_received":
              setDataSourceEvents([payload]);
              break;

            case "etl.completed":
            case "ingestion.failed":
              setIngestionEvents([payload]);
              break;

            case "file_etl.completed":
            case "file_etl.failed": {
              const fileName = payload.data.file_name;
              setIngestionEvents((prev) => [
                ...prev.filter(
                  (e) =>
                    (e.type !== "file_etl.completed" &&
                      e.type !== "file_etl.failed") ||
                    e.data.file_name !== fileName,
                ),
                payload,
              ]);
              break;
            }

            case "file.indexing_progress":
              setFileIndexingEvents((prev) => {
                const filtered = prev.filter(
                  (e) => e.data.file_id !== payload.data.file_id,
                );
                return [...filtered, payload];
              });
              break;

            default:
              console.warn("Unknown event type:", payload);
          }
        } catch (error) {
          console.error("Failed to parse event:", error);
        }
      };

      socket.onclose = () => {
        if (isUnmounted) return;
        // Don't reconnect while the tab is backgrounded — the visibilitychange
        // handler kicks a fresh attempt when the user returns. This stops a
        // dead endpoint from being hammered every few seconds in the background.
        if (typeof document !== "undefined" && document.hidden) return;
        // Exponential backoff with jitter, capped at 30s (was a fixed 5s loop).
        const delay =
          Math.min(30000, 1000 * 2 ** reconnectAttempts) + Math.random() * 1000;
        reconnectAttempts += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    // When the tab becomes visible again, reconnect immediately (fresh backoff)
    // if the socket isn't already open — covers drops that happened in the
    // background and the paused-reconnect case above.
    const handleVisibility = () => {
      if (isUnmounted || (typeof document !== "undefined" && document.hidden)) {
        return;
      }
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        reconnectAttempts = 0;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        connect();
      }
    };

    connect();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      isUnmounted = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [wsBaseUrl, token, authStatus]);

  // Memoize context values to prevent unnecessary re-renders
  const paymentValue = useMemo(
    () => ({ events: paymentEvents, clearEvents: clearPaymentEvents }),
    [paymentEvents, clearPaymentEvents],
  );

  const orgDbStatusValue = useMemo(
    () => ({ events: orgDbStatusEvents }),
    [orgDbStatusEvents],
  );

  const dataSourceValue = useMemo(
    () => ({ events: dataSourceEvents }),
    [dataSourceEvents],
  );

  const ingestionValue = useMemo(
    () => ({ events: ingestionEvents }),
    [ingestionEvents],
  );

  const seedFileIndexingEvents = useCallback((seeded: FileIndexingEvent[]) => {
    setFileIndexingEvents((prev) => {
      const liveIds = new Set(prev.map((e) => e.data.file_id));
      const novel = seeded.filter((e) => !liveIds.has(e.data.file_id));
      return novel.length ? [...prev, ...novel] : prev;
    });
  }, []);

  const removeFileIndexingEvent = useCallback((fileId: string) => {
    setFileIndexingEvents((prev) =>
      prev.some((e) => e.data.file_id === fileId)
        ? prev.filter((e) => e.data.file_id !== fileId)
        : prev,
    );
  }, []);

  const fileIndexingValue = useMemo(
    () => ({
      events: fileIndexingEvents,
      seedEvents: seedFileIndexingEvents,
      removeEvent: removeFileIndexingEvent,
    }),
    [fileIndexingEvents, seedFileIndexingEvents, removeFileIndexingEvent],
  );

  // Nested providers - each context isolated
  return (
    <PaymentEventsContext.Provider value={paymentValue}>
      <OrgDbStatusEventsContext.Provider value={orgDbStatusValue}>
        <DataSourceEventsContext.Provider value={dataSourceValue}>
          <IngestionEventsContext.Provider value={ingestionValue}>
            <FileIndexingEventsContext.Provider value={fileIndexingValue}>
              {children}
            </FileIndexingEventsContext.Provider>
          </IngestionEventsContext.Provider>
        </DataSourceEventsContext.Provider>
      </OrgDbStatusEventsContext.Provider>
    </PaymentEventsContext.Provider>
  );
};

// Export Contexts (for hooks)
export {
  PaymentEventsContext,
  OrgDbStatusEventsContext,
  DataSourceEventsContext,
  IngestionEventsContext,
  FileIndexingEventsContext,
};
