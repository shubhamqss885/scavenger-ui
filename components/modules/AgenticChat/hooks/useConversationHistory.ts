import { Dispatch, SetStateAction, useEffect } from "react";
import {
  getFullHistory,
  getFullHistoryAgno,
} from "@/lib/services/agenticChatService";
import { AgenticChatAction } from "../agenticChatReducer";
import { chatSessionStore } from "../chatSession";
import { transformFullHistory } from "../transformHistory";
import { PendingClarification, TokenUsage } from "../types";

/**
 * Loads full conversation history (messages + tool calls + SQL results).
 * Chart images are fetched lazily by ChartChip via toolCallId.
 * Restores pending clarification state if one exists.
 * Sets token usage from the API response.
 *
 * Guards on empty projectId. Silent failure — chat starts empty.
 *
 * @param useAgnoEndpoint - If true, uses the Agentic service endpoint (for groups)
 */
export const useConversationHistory = (
  projectId: string,
  dispatch: Dispatch<AgenticChatAction>,
  setPendingClarification: Dispatch<
    SetStateAction<PendingClarification | null>
  >,
  setTokenUsage: Dispatch<SetStateAction<TokenUsage | null>>,
  skip: boolean = false,
  useAgnoEndpoint: boolean = false,
  refreshKey: number = 0,
) => {
  useEffect(() => {
    if (!projectId) return;
    if (skip) {
      dispatch({ type: "LOAD_HISTORY_SUCCESS", payload: { messages: [] } });
      chatSessionStore.pingDrain(projectId);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      dispatch({ type: "LOAD_HISTORY_START" });
      try {
        // Use agentic endpoint for groups (Agno backend), otherwise use main API
        const response = useAgnoEndpoint
          ? await getFullHistoryAgno(projectId)
          : await getFullHistory(projectId);

        if (cancelled) return;

        const { messages, pendingClarification } =
          transformFullHistory(response);
        dispatch({ type: "LOAD_HISTORY_SUCCESS", payload: { messages } });

        // Restore pending clarification if one exists. If history says there
        // is no pending clarification, clear stale detached UI state, while
        // preserving a live socket clarification that history may not have
        // persisted yet.
        if (pendingClarification) {
          setPendingClarification(
            chatSessionStore.restorePendingClarification(
              projectId,
              pendingClarification,
            ),
          );
        } else {
          const livePending =
            chatSessionStore.getLivePendingClarification(projectId);

          if (livePending) {
            setPendingClarification(livePending);
          } else {
            chatSessionStore.clearPendingClarification(projectId);
            setPendingClarification(null);
          }
        }

        // Set token usage from API response
        if (response.token_usage) {
          setTokenUsage({
            usagePercent: response.token_usage.usage_percent,
            estimatedTokens: response.token_usage.estimated_tokens,
            contextWindow: response.token_usage.context_window,
            shouldWarn: response.token_usage.should_warn,
            shouldCompact: response.token_usage.should_compact,
          });
        }
        chatSessionStore.pingDrain(projectId);
      } catch {
        if (!cancelled) {
          dispatch({ type: "LOAD_HISTORY_FAILURE" });
          chatSessionStore.pingDrain(projectId);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    dispatch,
    setPendingClarification,
    setTokenUsage,
    skip,
    useAgnoEndpoint,
    refreshKey,
  ]);
};
