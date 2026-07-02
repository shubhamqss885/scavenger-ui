import { getAxiosInstance } from "@/lib/services/axiosInstances";
import type {
  VaultWritePending,
  VaultWriteResult,
} from "@/components/modules/AgenticChat/types";

// --- Types ---

export type VaultStatus = Readonly<{
  enabled: boolean;
  file_count: number;
  summary: string;
  last_synced: string | null;
  directories: Record<string, number>;
  error?: string;
}>;

export type VaultGrepMatch = Readonly<{
  path: string;
  title: string;
  match: string;
  author: string;
}>;

export type VaultFile = Readonly<{
  path: string;
  title: string;
  content: string;
  directory: string;
  tables: string[];
  columns: string[];
  author: string;
  updated_at?: string | null;
}>;

export type VaultListResponse = Readonly<{
  files: VaultFile[];
  count: number;
  error?: string;
}>;

export type VaultHistoryEntry = Readonly<{
  audit_id: string;
  request_id: string;
  tool_name: string;
  vault_path: string | null;
  status: string;
  version: number;
  requested_by: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  is_delete?: boolean;
}>;

// --- Read / write / maintenance APIs ---

export const getVaultStatus = async (orgdbId: string): Promise<VaultStatus> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<VaultStatus>(
    "/agentic/vault/status",
    { params: { orgdb_id: orgdbId } },
  );
  return data;
};

export const vaultList = async (
  orgdbId: string,
  options?: { directory?: string; includeContent?: boolean },
): Promise<VaultListResponse> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<VaultListResponse>(
    "/agentic/vault/list",
    {
      params: {
        orgdb_id: orgdbId,
        directory: options?.directory,
        include_content: options?.includeContent,
      },
    },
  );
  return data;
};

export const vaultGrep = async (
  orgdbId: string,
  pattern: string,
  directory?: string,
): Promise<{ matches: VaultGrepMatch[]; count: number }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post("/agentic/vault/grep", {
    orgdb_id: orgdbId,
    pattern,
    directory: directory || undefined,
  });
  return data;
};

export const vaultGlob = async (
  orgdbId: string,
  pattern: string,
): Promise<{ files: string[]; count: number }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post("/agentic/vault/glob", {
    orgdb_id: orgdbId,
    pattern,
  });
  return data;
};

export const vaultRead = async (
  orgdbId: string,
  path: string,
): Promise<VaultFile> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<VaultFile>("/agentic/vault/read", {
    params: { orgdb_id: orgdbId, path },
  });
  return data;
};

export const vaultLog = async (
  orgdbId: string,
): Promise<{ report: string; enabled: boolean }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get("/agentic/vault/log", {
    params: { orgdb_id: orgdbId },
  });
  return data;
};

export const vaultWrite = async (
  orgdbId: string,
  path: string,
  content: string,
): Promise<{ ok: boolean; path?: string; error?: string }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post(
    "/agentic/vault/write",
    { content },
    { params: { orgdb_id: orgdbId, path } },
  );
  return data;
};

export const vaultDelete = async (
  orgdbId: string,
  path: string,
): Promise<{ ok: boolean; error?: string }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.delete("/agentic/vault/delete", {
    params: { orgdb_id: orgdbId, path },
  });
  return data;
};

export const vaultSync = async (
  orgdbId: string,
): Promise<{ ok: boolean; file_count?: number; error?: string }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post("/agentic/vault/sync", null, {
    params: { orgdb_id: orgdbId },
  });
  return data;
};

export const vaultHistory = async (
  orgdbId: string,
  limit: number = 50,
): Promise<{ history: VaultHistoryEntry[]; count: number }> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get("/agentic/vault/history", {
    params: { orgdb_id: orgdbId, limit },
  });
  return data;
};

// --- Write approval APIs ---

export const getVaultPendingWrites = async (
  orgdbId: string,
): Promise<VaultWritePending[]> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.get<{ pending: VaultWritePending[] }>(
    "/agentic/vault/pending",
    { params: { orgdb_id: orgdbId } },
  );
  return data.pending ?? [];
};

export const approveVaultWriteRequest = async (
  requestId: string,
): Promise<VaultWriteResult> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<VaultWriteResult>(
    "/agentic/vault/approve",
    { request_id: requestId },
  );
  return data;
};

export const rejectVaultWriteRequest = async (
  requestId: string,
  reason?: string,
): Promise<VaultWriteResult> => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post<VaultWriteResult>(
    "/agentic/vault/reject",
    {
      request_id: requestId,
      reason: reason || "Rejected by user",
    },
  );
  return data;
};
