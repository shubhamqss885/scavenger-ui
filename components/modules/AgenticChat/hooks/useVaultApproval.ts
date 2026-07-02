import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import {
  approveVaultWriteRequest,
  getVaultPendingWrites,
  rejectVaultWriteRequest,
} from "@/lib/services/vaultService";
import type {
  VaultWritePending,
  VaultWritePayload,
  VaultWriteResult,
} from "../types";

type UseVaultApprovalParams = Readonly<{
  orgdbId?: string | null;
}>;

type UseVaultApprovalReturn = Readonly<{
  currentVaultApproval: VaultWritePending | null;
  pendingVaultWriteCount: number;
  currentIndex: number;
  approveVaultWrite: (requestId: string) => Promise<boolean>;
  rejectVaultWrite: (requestId: string, reason?: string) => Promise<boolean>;
  closeVaultApproval: () => void;
  openPendingVaultWrites: () => Promise<void>;
  goToNextPending: () => void;
  goToPrevPending: () => void;
  checkAndOpenVaultApproval: (
    requestId: string,
    toolName: string,
    vaultPath: string,
    payload: VaultWritePayload,
  ) => void;
  handleVaultWritePending: (data: VaultWritePending) => void;
  handleVaultWriteResult: (data: VaultWriteResult) => void;
}>;

export const useVaultApproval = ({
  orgdbId,
}: UseVaultApprovalParams): UseVaultApprovalReturn => {
  const { t } = useTranslation("agentic-chat");
  const [currentVaultApproval, setCurrentVaultApproval] =
    useState<VaultWritePending | null>(null);
  const [pendingWrites, setPendingWrites] = useState<VaultWritePending[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch pending vault writes on mount and when orgdbId changes
  useEffect(() => {
    if (!orgdbId) {
      setPendingWrites([]);
      return;
    }

    const fetchPendingVaultWrites = async () => {
      try {
        const pending = await getVaultPendingWrites(orgdbId);
        setPendingWrites(pending);
      } catch (err) {
        console.error("Failed to fetch pending vault writes:", err);
      }
    };

    fetchPendingVaultWrites();
  }, [orgdbId]);

  const pendingVaultWriteCount = pendingWrites.length;

  // Open pending vault writes modal (starts at first)
  const openPendingVaultWrites = useCallback(async () => {
    if (!orgdbId) return;

    try {
      const pending = await getVaultPendingWrites(orgdbId);
      setPendingWrites(pending);
      if (pending.length > 0) {
        setCurrentIndex(0);
        setCurrentVaultApproval({ ...pending[0], status: "pending" });
      }
    } catch (err) {
      console.error("Failed to open pending vault writes:", err);
    }
  }, [orgdbId]);

  // Navigate between pending writes
  const goToNextPending = useCallback(() => {
    if (currentIndex < pendingWrites.length - 1) {
      const nextIndex = currentIndex + 1;

      setCurrentIndex(nextIndex);
      setCurrentVaultApproval({
        ...pendingWrites[nextIndex],
        status: "pending",
      });
    }
  }, [currentIndex, pendingWrites]);

  const goToPrevPending = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;

      setCurrentIndex(prevIndex);
      setCurrentVaultApproval({
        ...pendingWrites[prevIndex],
        status: "pending",
      });
    }
  }, [currentIndex, pendingWrites]);

  // Handle real-time vault_write_pending from WebSocket
  // Only updates the badge count - user opens modal manually when ready
  const handleVaultWritePending = useCallback(
    async (_data: VaultWritePending) => {
      if (!orgdbId) return;
      try {
        const pending = await getVaultPendingWrites(orgdbId);
        setPendingWrites(pending);
      } catch (err) {
        console.error("Failed to fetch vault pending writes:", err);
      }
    },
    [orgdbId],
  );

  // Handle vault_write_result from WebSocket (for real-time updates)
  const handleVaultWriteResult = useCallback(
    async (data: VaultWriteResult) => {
      if (orgdbId) {
        try {
          const pending = await getVaultPendingWrites(orgdbId);
          setPendingWrites(pending);
        } catch (err) {
          console.error("Failed to fetch vault pending writes:", err);
        }
      }

      // Close modal if it was showing this request
      const matchesPending = (p: VaultWritePending) =>
        data.request_id
          ? p.request_id === data.request_id
          : p.vault_path === data.vault_path;

      setCurrentVaultApproval((current) =>
        current && matchesPending(current) ? null : current,
      );
    },
    [orgdbId],
  );

  // Helper to advance to next pending item using fresh data
  const advanceToNextPending = useCallback(
    (freshPending: VaultWritePending[], prevIndex: number) => {
      if (freshPending.length === 0) {
        setCurrentVaultApproval(null);
        setPendingWrites([]);
        setCurrentIndex(0);
        return;
      }

      // Stay at current index, or move to end if out of bounds
      const newIndex = Math.min(prevIndex, freshPending.length - 1);
      setPendingWrites(freshPending);
      setCurrentIndex(newIndex);
      setCurrentVaultApproval({ ...freshPending[newIndex], status: "pending" });
    },
    [],
  );

  const approveVaultWrite = useCallback(
    async (requestId: string): Promise<boolean> => {
      // Capture current index before async operation
      const indexBeforeAction = currentIndex;

      try {
        const result = await approveVaultWriteRequest(requestId);

        if (result.success) {
          toast.success(t("vault.toast.approved"), {
            description: result.vault_path
              ? t("vault.toast.approvedSavedTo", { path: result.vault_path })
              : t("vault.toast.approvedDefault"),
          });
          // Refetch and advance to next item using fresh data
          if (orgdbId) {
            const freshPending = await getVaultPendingWrites(orgdbId);
            advanceToNextPending(freshPending, indexBeforeAction);
          }
          return true;
        } else {
          toast.error(t("vault.toast.approveFailed"), {
            description: result.error || t("vault.toast.unknownError"),
          });
          return false;
        }
      } catch (err) {
        console.error("Approve vault write failed:", err);
        toast.error(t("vault.toast.approveFailedGeneric"));
        return false;
      }
    },
    [t, orgdbId, currentIndex, advanceToNextPending],
  );

  const rejectVaultWrite = useCallback(
    async (requestId: string, reason?: string): Promise<boolean> => {
      // Capture current index before async operation
      const indexBeforeAction = currentIndex;

      try {
        const result = await rejectVaultWriteRequest(requestId, reason);

        if (result.success || result.rejected) {
          toast.info(t("vault.toast.rejected"));
          // Refetch and advance to next item using fresh data
          if (orgdbId) {
            const freshPending = await getVaultPendingWrites(orgdbId);
            advanceToNextPending(freshPending, indexBeforeAction);
          }
          return true;
        } else {
          toast.error(t("vault.toast.rejectFailed"), {
            description: result.error || t("vault.toast.unknownError"),
          });
          return false;
        }
      } catch (err) {
        console.error("Reject vault write failed:", err);
        toast.error(t("vault.toast.rejectFailedGeneric"));
        return false;
      }
    },
    [t, orgdbId, currentIndex, advanceToNextPending],
  );

  // Check backend status and open modal at the correct index
  const checkAndOpenVaultApproval = useCallback(
    async (
      requestId: string,
      toolName: string,
      vaultPath: string,
      payload: VaultWritePayload,
    ) => {
      if (!orgdbId) {
        setCurrentVaultApproval({
          request_id: requestId,
          tool_name: toolName,
          vault_path: vaultPath,
          payload,
          status: "unknown",
        });
        return;
      }

      try {
        const freshPendingWrites = await getVaultPendingWrites(orgdbId);
        const foundIndex = freshPendingWrites.findIndex(
          (p) => p.request_id === requestId,
        );

        if (foundIndex !== -1) {
          // Update pending list and open modal at the correct index
          setPendingWrites(freshPendingWrites);
          setCurrentIndex(foundIndex);
          setCurrentVaultApproval({
            ...freshPendingWrites[foundIndex],
            status: "pending",
          });
        } else {
          // Request already processed
          setCurrentVaultApproval({
            request_id: requestId,
            tool_name: toolName,
            vault_path: vaultPath,
            payload,
            status: "processed",
          });
        }
      } catch (err) {
        console.error("Failed to check vault write status:", err);
        setCurrentVaultApproval({
          request_id: requestId,
          tool_name: toolName,
          vault_path: vaultPath,
          payload,
          status: "pending",
        });
      }
    },
    [orgdbId],
  );

  const closeVaultApproval = useCallback(() => {
    setCurrentVaultApproval(null);
  }, []);

  return {
    currentVaultApproval,
    pendingVaultWriteCount,
    currentIndex,
    approveVaultWrite,
    rejectVaultWrite,
    closeVaultApproval,
    openPendingVaultWrites,
    goToNextPending,
    goToPrevPending,
    checkAndOpenVaultApproval,
    handleVaultWritePending,
    handleVaultWriteResult,
  };
};
