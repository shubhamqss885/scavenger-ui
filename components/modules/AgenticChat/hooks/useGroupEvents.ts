import { useEffect, useRef, useContext } from "react";
import { AxiosContext } from "@/lib/context/AuthContext";

export type GroupEventMessage = {
  type: string;
  group_id: string;
  sender_sub: string;
  sender_name: string | null;
  content: string;
  timestamp: string;
  conversation_id: string | null;
};

type UseGroupEventsParams = {
  groupId: string | null;
  onUserMessage?: (message: GroupEventMessage) => void;
  onAgentTyping?: (message: GroupEventMessage) => void;
  onAgentResponse?: (message: GroupEventMessage) => void;
  onMemberJoined?: (message: GroupEventMessage) => void;
};

export const useGroupEvents = ({
  groupId,
  onUserMessage,
  onAgentTyping,
  onAgentResponse,
  onMemberJoined,
}: UseGroupEventsParams) => {
  const { token } = useContext(AxiosContext);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isConnectingRef = useRef(false);

  // Store callbacks in refs to avoid reconnection on callback changes
  const callbacksRef = useRef({
    onUserMessage,
    onAgentTyping,
    onAgentResponse,
    onMemberJoined,
  });
  callbacksRef.current = {
    onUserMessage,
    onAgentTyping,
    onAgentResponse,
    onMemberJoined,
  };

  // Store token in ref to avoid reconnection when token object changes but value is same
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Connect when groupId and token are available
  useEffect(() => {
    // Use ref for token check since we don't want token changes to trigger reconnect
    if (!groupId || !tokenRef.current) return;

    const connect = () => {
      // Double-check token is still available
      if (!tokenRef.current) {
        console.log("[GroupEvents] No token, skipping connection");
        return;
      }
      // Prevent duplicate connections - check both connecting state and existing connection
      if (isConnectingRef.current) {
        console.log("[GroupEvents] Already connecting, skipping");
        return;
      }
      if (wsRef.current) {
        const state = wsRef.current.readyState;

        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
          console.log(
            "[GroupEvents] WebSocket already open/connecting, skipping",
          );
          return;
        }
      }
      isConnectingRef.current = true;

      // Build WebSocket URL for group events
      const baseUrl =
        process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000";
      const wsUrl = `${baseUrl}/agentic/group/${groupId}/events`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[GroupEvents] Connected, sending auth");
        isConnectingRef.current = false;
        ws.send(JSON.stringify({ auth_token: tokenRef.current }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as GroupEventMessage & {
            error?: string;
          };

          if (msg.error) {
            console.error("[GroupEvents] Error:", msg.error);
            return;
          }

          if (msg.type === "subscribed") {
            console.log("[GroupEvents] Subscribed to group", msg.group_id);
            return;
          }

          if (msg.type === "pong") {
            return;
          }

          // Handle group events using refs to get latest callbacks
          const {
            onUserMessage,
            onAgentTyping,
            onAgentResponse,
            onMemberJoined,
          } = callbacksRef.current;

          if (msg.type === "group_user_message") {
            console.log("[GroupEvents] User message from", msg.sender_name);
            onUserMessage?.(msg);
          } else if (msg.type === "group_agent_typing") {
            console.log("[GroupEvents] Agent typing for", msg.sender_name);
            onAgentTyping?.(msg);
          } else if (msg.type === "group_agent_response") {
            console.log("[GroupEvents] Agent response for", msg.sender_name);
            onAgentResponse?.(msg);
          } else if (msg.type === "group_member_joined") {
            console.log("[GroupEvents] Member joined:", msg.sender_name);
            onMemberJoined?.(msg);
          }
        } catch (e) {
          console.error("[GroupEvents] Parse error:", e);
        }
      };

      ws.onclose = () => {
        console.log("[GroupEvents] Disconnected, reconnecting in 5s");
        wsRef.current = null;
        isConnectingRef.current = false;
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = (error) => {
        console.error("[GroupEvents] WebSocket error:", error);
        isConnectingRef.current = false;
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
    // Only reconnect when groupId changes, not when token object reference changes
    // Token is accessed via tokenRef.current which always has the latest value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!groupId) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [groupId]);

  return {};
};
