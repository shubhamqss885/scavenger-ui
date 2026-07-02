"use client";

// 🚧 UNDER CONSTRUCTION — gated behind FEATURE_FLAGS.DASHBOARD_BUILDER
// (dev/localhost only); /dashboard/builder redirects to /home when off.
// Fix before un-gating:
//   • `auth_token: ""` on every WS message — unauthenticated.
//   • WS_URL fallback `ws://localhost:8000` breaks non-local envs.
//   • `project_id: ""` sent empty.
//   • Backend `/agentic/dashboard_builder_ws` doesn't exist (FEATURE_PLANS/backlog/ai-dashboard-builder.md).
//   • WS race: `setTimeout(500)` instead of awaiting `onopen` — queue/await readiness.
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type BuilderState = {
  sessionId: string | null;
  appCode: string | null;
  isConnected: boolean;
  isBuilding: boolean;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const DashboardBuilder = () => {
  // Params state
  const [appName, setAppName] = useState("My Dashboard");
  const [dataSourceId, setDataSourceId] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("manual");
  const [colorScheme, setColorScheme] = useState("default");

  // Builder state
  const [state, setState] = useState<BuilderState>({
    sessionId: null,
    appCode: null,
    isConnected: false,
    isBuilding: false,
  });

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showParams, setShowParams] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/agentic/dashboard_builder_ws`);

    ws.onopen = () => {
      console.log("Dashboard builder WebSocket connected");
      setState((prev) => ({ ...prev, isConnected: true }));

      // Send init message
      ws.send(
        JSON.stringify({
          type: "init",
          auth_token: "", // Add auth token if needed
          project_id: "",
          data_source_id: dataSourceId,
          app_name: appName,
          update_frequency: updateFrequency,
          color_scheme: colorScheme,
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);

      switch (data.type) {
        case "session_created":
          setState((prev) => ({ ...prev, sessionId: data.session_id }));
          break;

        case "agent_message":
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.content },
          ]);
          break;

        case "app_code":
          setState((prev) => ({ ...prev, appCode: data.code }));
          break;

        case "app_complete":
          setState((prev) => ({
            ...prev,
            appCode: data.code,
            isBuilding: false,
          }));
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Dashboard ready!" },
          ]);
          break;

        case "error":
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${data.error}` },
          ]);
          setState((prev) => ({ ...prev, isBuilding: false }));
          break;

        case "pong":
          // Heartbeat response
          break;
      }
    };

    ws.onclose = () => {
      console.log("Dashboard builder WebSocket disconnected");
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  }, [appName, dataSourceId, updateFrequency, colorScheme]);

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setState({
      sessionId: null,
      appCode: null,
      isConnected: false,
      isBuilding: false,
    });
  };

  const sendMessage = (type: string, payload: Record<string, unknown> = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type,
        auth_token: "",
        ...payload,
      }),
    );
  };

  const handleStartBuild = () => {
    if (!inputValue.trim()) return;

    setShowParams(false);
    setState((prev) => ({ ...prev, isBuilding: true }));

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: inputValue }]);

    // Connect if not connected
    if (!state.isConnected) {
      connect();
      // Wait for connection and session, then send
      setTimeout(() => {
        sendMessage("build_app", { prompt: inputValue });
      }, 500);
    } else {
      sendMessage("build_app", { prompt: inputValue });
    }

    setInputValue("");
  };

  const handleRefine = () => {
    if (!inputValue.trim() || !state.isConnected) return;

    setMessages((prev) => [...prev, { role: "user", content: inputValue }]);
    sendMessage("refine_app", { prompt: inputValue });
    setInputValue("");
  };

  const handleSave = () => {
    if (!state.isConnected) return;
    sendMessage("save_app");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Dashboard Builder</h1>
          {state.isConnected && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.appCode && (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Icon name="Save" size="sm" className="mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Main content - split screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Chat */}
        <div className="flex w-1/3 flex-col border-r">
          {/* Params section (collapsible) */}
          {showParams && (
            <div className="space-y-4 border-b p-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Dashboard Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="My Dashboard"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Update Frequency</Label>
                <Select
                  value={updateFrequency}
                  onValueChange={setUpdateFrequency}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Realtime</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorScheme">Color Scheme</Label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Describe the dashboard you want to create...
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 ${
                  msg.role === "user"
                    ? "ml-8 bg-primary text-primary-foreground"
                    : "mr-8 bg-muted"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {state.isBuilding && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Loader2" size="sm" className="animate-spin" />
                Building...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  state.appCode
                    ? "Refine your dashboard..."
                    : "Describe your dashboard..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (state.appCode) {
                      handleRefine();
                    } else {
                      handleStartBuild();
                    }
                  }
                }}
              />
              <Button
                onClick={state.appCode ? handleRefine : handleStartBuild}
                disabled={!inputValue.trim() || state.isBuilding}
              >
                {state.isBuilding ? (
                  <Icon name="Loader2" size="sm" className="animate-spin" />
                ) : state.appCode ? (
                  <Icon name="Send" size="sm" />
                ) : (
                  <Icon name="Play" size="sm" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel - Preview */}
        <div className="flex flex-1 flex-col bg-muted/30">
          {!state.appCode ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="mb-4 text-4xl">📊</div>
                <div>Your dashboard preview will appear here</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{appName}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Preview (Streamlit code generated)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[calc(100vh-300px)] overflow-auto rounded-lg bg-muted p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {state.appCode}
                    </pre>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>To run this dashboard locally:</p>
                    <code className="rounded mt-2 block bg-muted p-2 text-xs">
                      pip install streamlit plotly pandas && streamlit run
                      app.py
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
