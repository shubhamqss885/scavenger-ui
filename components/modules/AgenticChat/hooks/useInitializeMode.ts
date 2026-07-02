import { useEffect, useRef } from "react";

/**
 * Handles sending the initial message for a new project.
 *
 * Reads `initialMessage` from sessionStorage and sends it via sendQuery.
 * No longer calls modes API since modes have been removed.
 */
export const useInitializeChat = (
  projectId: string,
  sendQuery: (query: string) => void,
  isReady: boolean,
): void => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!isReady) return;

    hasInitialized.current = true;

    const messageKey = `project_${projectId}_initialMessage`;
    const modeKey = `project_${projectId}_agenticMode`;
    const initialMessage = sessionStorage.getItem(messageKey);
    sessionStorage.removeItem(messageKey);
    // `_agenticMode` is set by every "new project" entry point as the signal
    // for AgenticChatContext to skip the history fetch on first mount. It must
    // be cleared on first init too — otherwise a page reload re-reads it and
    // skips history again, hiding the existing conversation.
    sessionStorage.removeItem(modeKey);

    if (initialMessage?.trim()) {
      sendQuery(initialMessage);
    }
  }, [projectId, isReady, sendQuery]);
};
