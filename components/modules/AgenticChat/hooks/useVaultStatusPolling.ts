import { useEffect, useRef, useMemo, Dispatch } from "react";
import { getVaultWriteStatuses } from "@/lib/services/agenticChatService";
import { AgenticChatAction } from "../agenticChatReducer";
import { ChatMessage, parseVaultWriteRequestId } from "../types";
import { isToolCategory } from "../toolMeta";

/**
 * Fetches /agentic/vault/statuses ONCE per pending vault write to check
 * if it has been approved/rejected externally (e.g. by another user or device).
 *
 * Self-initiated approve/reject is handled by an immediate dispatch in
 * AgenticChatContext (see approveVaultWriteWithDispatch / rejectVaultWriteWithDispatch).
 */
export const useVaultStatusPolling = (
  messages: ChatMessage[],
  dispatch: Dispatch<AgenticChatAction>,
  isLoadingHistory: boolean,
) => {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Only IDs that are pending and need status check
  const pendingIds = useMemo(() => {
    const ids: string[] = [];
    for (const msg of messages) {
      if (msg.role !== "agent" || !msg.steps) continue;
      for (const step of msg.steps) {
        if (!isToolCategory(step.tool, "vault-write") || !step.toolOutput?.raw)
          continue;
        const requestId = parseVaultWriteRequestId(step.toolOutput.raw);

        if (!requestId) continue;
        const status = step.toolOutput.vaultWriteStatus?.status;

        if (!status || status === "pending") {
          ids.push(requestId);
        }
      }
    }
    return ids.sort().join(",");
  }, [messages]);

  useEffect(() => {
    if (isLoadingHistory || !pendingIds) return;

    const ids = pendingIds.split(",");
    let cancelled = false;

    (async () => {
      try {
        const response = await getVaultWriteStatuses(ids);

        if (cancelled) return;

        const statuses: Record<
          string,
          {
            status: "pending" | "approved" | "rejected";
            reviewedBy?: string | null;
            reviewedAt?: string | null;
            rejectionReason?: string | null;
          }
        > = {};

        for (const [id, apiStatus] of Object.entries(response.statuses)) {
          statuses[id] = {
            status: apiStatus.status,
            reviewedBy: apiStatus.reviewed_by,
            reviewedAt: apiStatus.reviewed_at,
            rejectionReason: apiStatus.rejection_reason,
          };
        }

        if (Object.keys(statuses).length > 0) {
          dispatchRef.current({
            type: "BATCH_UPDATE_VAULT_WRITE_STATUSES",
            payload: { statuses },
          });
        }
      } catch (error) {
        console.error("Failed to fetch vault write statuses:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoadingHistory, pendingIds]);
};
