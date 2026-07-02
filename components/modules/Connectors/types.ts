// Re-export shared types from AgenticChat
export type {
  ProgressStep,
  ChatMessage,
} from "@/components/modules/AgenticChat/types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// --- db-connect specific types ---

export type CredentialRequest = {
  credential_type:
    | "db_password"
    | "ssh_password"
    | "ssh_private_key"
    | "ssh_key_passphrase";
  prompt_message: string;
};

export type SecurityConfig = {
  ssh?: import("./components/security/SSHTunnelSettings").SSHConfig;
  ssl?: import("./components/security/SSLSettings").SSLConfig;
};

export type ConnectionState = "idle" | "connecting" | "success" | "error";

// --- Constants ---

export const DB_CONNECT_WS_URL =
  (process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000") +
  "/agentic/db_connect_ws";
