"use client";

import React, {
  useState,
  useReducer,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";
import { createContext } from "use-context-selector";
import {
  ALLOWED_FILE_EXTENSION_SET,
  INDEXING_ACTIVE_STAGES,
  INDEXING_DONE_STAGE,
  INDEXING_FAILED_STAGES,
  MAX_FILE_SIZE_BYTES,
  ChatMessage,
  CompactionResult,
  PendingClarification,
  ProgressStep,
  TokenUsage,
  VaultWritePayload,
  VaultWriteResult,
  WidgetEditContext,
} from "./types";
import { AxiosContext } from "@/lib/context/AuthContext";
import {
  useProjectsActions,
  saveProjectActivity,
} from "@/lib/context/ProjectsContext";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";
import { refreshOrForceLogout } from "@/lib/services/axiosInstances/tokenRefresh";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useConversationHistory } from "./hooks/useConversationHistory";
import { useInitializeChat } from "./hooks/useInitializeMode";
import { useClarification } from "./hooks/useClarification";
import { useAgenticWebSocket } from "./hooks/useAgenticWebSocket";
import { useVaultApproval } from "./hooks/useVaultApproval";
import { useVaultStatusPolling } from "./hooks/useVaultStatusPolling";
import { useGroupEvents, type GroupEventMessage } from "./hooks/useGroupEvents";
import { VaultWriteApprovalModal } from "./components/VaultWriteApprovalModal";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import {
  agenticChatReducer,
  initialAgenticChatState,
} from "./agenticChatReducer";
import {
  listProjectFiles,
  uploadProjectFile,
  deleteProjectFile,
  inferProjectName,
  getIndexingStatus,
  type ProjectFile,
} from "@/lib/services/agenticChatService";
import { getGroup, type GroupMember } from "@/lib/services/groupService";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useGroups } from "@/lib/context/GroupsContext";
import { useFileIndexingEvents } from "@/lib/context/EventsContext/hooks/useFileIndexingEvents";
import { useMutation } from "@tanstack/react-query";
import {
  DEFAULT_MODEL_PROVIDER,
  isModelProvider,
  type ModelProvider,
} from "@/components/blocks/InputBarShell/ModelSwitcher";

// SSR-safe sessionStorage access. These are read inside useState initializers,
// which run during render (including server render), where `sessionStorage` is
// undefined — reading it unguarded throws. On the server we return null and the
// initializers fall back to their defaults; the client hydrates the real value.
const ss = {
  get: (key: string): string | null =>
    typeof window === "undefined" ? null : sessionStorage.getItem(key),
  remove: (key: string): void => {
    if (typeof window !== "undefined") sessionStorage.removeItem(key);
  },
};

// --- Context value ---

type AgenticChatContextValue = Readonly<{
  // State
  messages: ChatMessage[];
  isLoadingHistory: boolean;
  input: string;
  isStreaming: boolean;
  progressSteps: ProgressStep[];
  provider: ModelProvider;
  isAgnoEnabled: boolean;
  pendingClarification: PendingClarification | null;
  selectedOptions: Set<string>;
  clarificationCollapsed: boolean;
  projectName: string;
  dbName: string | null;
  projectId: string;
  orgdbId: string | null | undefined;
  groupId: string | null;
  groupMembers: GroupMember[];
  tokenUsage: TokenUsage | null;
  isProjectTokenLimitReached: boolean;
  isCompacting: boolean;
  statusMessage: string | null;
  groupTypingUser: string | null;
  pendingVaultWriteCount: number;

  // Project files state
  projectFiles: ProjectFile[];
  isLoadingFiles: boolean;
  isUploadingFile: boolean;
  isFileIndexingActive: boolean;
  isFilesPanelOpen: boolean;

  // Actions
  sendQuery: (query: string) => void;
  sendWsMessage: (query: string, opts?: { skipUserMessage?: boolean }) => void;
  sendCompactMessage: (preserveRecent?: number) => void;
  stopAgent: () => void;
  setInput: Dispatch<SetStateAction<string>>;
  setProvider: Dispatch<SetStateAction<ModelProvider>>;
  setAgnoEnabled: Dispatch<SetStateAction<boolean>>;
  handleOptionClick: (option: string) => void;
  submitClarification: () => void;
  setClarificationCollapsed: Dispatch<SetStateAction<boolean>>;
  checkAndOpenVaultApproval: (
    requestId: string,
    toolName: string,
    vaultPath: string,
    payload: VaultWritePayload,
  ) => void;
  uploadProjectFile: (file: File) => Promise<void>;
  deleteProjectFile: (fileId: string) => Promise<void>;
  setFilesPanelOpen: Dispatch<SetStateAction<boolean>>;
  openPendingVaultWrites: () => Promise<void>;
  goToNextPending: () => void;
  goToPrevPending: () => void;
  currentVaultIndex: number;

  // "Notify me when done" — explicit opt-in for the current streaming run
  notifyOnDone: boolean;
  showNotifyBanner: boolean;
  requestNotifyOnDone: () => Promise<void>;

  // Web search toggle
  webSearchEnabled: boolean;
  setWebSearchEnabled: Dispatch<SetStateAction<boolean>>;

  // Set when this chat is editing a dashboard widget (null otherwise).
  editContext: WidgetEditContext | null;
}>;

// Exported for fine-grained selectors via useContextSelector(AgenticChatContext, ...)
export const AgenticChatContext = createContext<AgenticChatContextValue | null>(
  null,
);

// --- Provider ---

type AgenticChatProviderProps = Readonly<{
  projectId: string;
  children: ReactNode;
  forceAgno?: boolean;
  groupId?: string | null;
  groupOrgdbId?: string | null;
  groupName?: string;
  edit?: WidgetEditContext | null;
}>;

export const AgenticChatProvider = ({
  projectId,
  children,
  forceAgno = false,
  groupId = null,
  groupOrgdbId,
  groupName,
  edit = null,
}: AgenticChatProviderProps) => {
  const { t } = useTranslation("agentic-chat");
  const { token } = useContext(AxiosContext);
  const { userProfile } = useUserContext();
  const { getProjectDetailById, updateProjectNameLocal } = useProjectsActions();
  const { getDbById } = useOrganizationDbData();
  const { onMemberJoined: onGlobalMemberJoined } = useGroups();

  // Derived project data - for groups, use passed orgdbId; otherwise lookup from project
  const projectDetail = getProjectDetailById(projectId);
  const projectName =
    groupName ?? projectDetail?.project_name ?? t("header.fallbackTitle");
  const effectiveOrgdbId = groupOrgdbId ?? projectDetail?.selected_org_db;
  const selectedDb = effectiveOrgdbId ? getDbById(effectiveOrgdbId) : null;
  const dbName =
    selectedDb?.display_name || selectedDb?.orgdb_name_decrypted || null;

  // Reducer (messages + loading state)
  const [state, dispatch] = useReducer(
    agenticChatReducer,
    initialAgenticChatState,
  );
  const { messages, isLoadingHistory } = state;

  // Local state
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  // "Agno" backend toggle — seeded from the home input bar handoff (or a prior
  // session). Off → Claude-only via the cloud WS; on → all models via the Agno WS.
  // forceAgno overrides to always-on (e.g., for group chats).
  const [isAgnoEnabled, setAgnoEnabled] = useState(
    () => forceAgno || ss.get(`project_${projectId}_agno`) === "true",
  );

  // Model provider — seeded from the home input bar handoff (or a prior session)
  // via sessionStorage, default Claude. Mirrors the webSearchEnabled pattern below.
  // Invariant: with Agno off, only Claude is valid.
  const [provider, setProvider] = useState<ModelProvider>(() => {
    const agnoOn = ss.get(`project_${projectId}_agno`) === "true";
    const stored = ss.get(`project_${projectId}_provider`);

    if (!agnoOn) return DEFAULT_MODEL_PROVIDER;
    return isModelProvider(stored) ? stored : DEFAULT_MODEL_PROVIDER;
  });
  const [pendingClarification, setPendingClarification] =
    useState<PendingClarification | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    () => new Set(),
  );
  const [clarificationCollapsed, setClarificationCollapsed] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isCompacting, setIsCompacting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [groupTypingUser, setGroupTypingUser] = useState<string | null>(null);
  const groupTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Live mirror of the conversation's emptiness for sendQuery's first-message
  // logic, without recreating the callback on every message.
  const chatStateRef = useRef({ hasMessages: false, isLoadingHistory: true });
  useEffect(() => {
    chatStateRef.current = {
      hasMessages: state.messages.length > 0,
      isLoadingHistory: state.isLoadingHistory,
    };
  }, [state.messages.length, state.isLoadingHistory]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [isNewChat] = useState(
    () =>
      !!ss.get(`project_${projectId}_initialMessage`) ||
      !!ss.get(`project_${projectId}_agenticMode`),
  );

  const {
    seedEvents: seedIndexingEvents,
    events: indexingEvents,
    removeEvent: removeIndexingEvent,
  } = useFileIndexingEvents();

  const isFileIndexingActive = indexingEvents.some(
    (e) =>
      e.data.project_id === projectId &&
      INDEXING_ACTIVE_STAGES.has(e.data.stage),
  );

  // Web search toggle (persisted per session, default: off)
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    const stored = ss.get(`project_${projectId}_webSearchEnabled`);
    return stored === "true";
  });

  // Persist web search toggle to session storage
  useEffect(() => {
    sessionStorage.setItem(
      `project_${projectId}_webSearchEnabled`,
      String(webSearchEnabled),
    );
  }, [projectId, webSearchEnabled]);

  // Persist selected model provider to session storage (survives reload)
  useEffect(() => {
    sessionStorage.setItem(`project_${projectId}_provider`, provider);
  }, [projectId, provider]);

  // Persist Agno toggle to session storage (survives reload)
  useEffect(() => {
    sessionStorage.setItem(`project_${projectId}_agno`, String(isAgnoEnabled));
  }, [projectId, isAgnoEnabled]);

  // Project files state
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFilesPanelOpen, setFilesPanelOpen] = useState(() => {
    const shouldOpen = ss.get(`project_${projectId}_openFilesPanel`);

    if (shouldOpen) {
      ss.remove(`project_${projectId}_openFilesPanel`);
      return true;
    }
    return false;
  });

  // Fetch project files on mount; seed indexing state for refresh recovery
  const fetchProjectFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      const [filesRes, indexingRes] = await Promise.all([
        listProjectFiles(projectId),
        getIndexingStatus(projectId).catch(() => null),
      ]);
      // Merge rather than replace: refresh metadata for files we already show
      // and append any new ones, but keep optimistic entries the backend list
      // hasn't caught up to yet. A plain replace here races with the optimistic
      // add on a second upload and can drop a just-uploaded file.
      setProjectFiles((prev) => {
        if (prev.length === 0) return filesRes.files;
        const backendById = new Map(
          filesRes.files.map((f) => [f.file_id, f] as const),
        );
        const seen = new Set(prev.map((f) => f.file_id));
        const refreshed = prev.map((f) => backendById.get(f.file_id) ?? f);
        const additions = filesRes.files.filter((f) => !seen.has(f.file_id));
        return [...refreshed, ...additions];
      });
      // Only seed files still in progress. Terminal stages (done/failed/dead)
      // would otherwise leave a stale bar after a refresh; their metadata is
      // already in filesRes.
      const inProgress = indexingRes?.files.filter(
        (f) =>
          f.stage !== INDEXING_DONE_STAGE &&
          !INDEXING_FAILED_STAGES.has(f.stage),
      );

      if (inProgress?.length) {
        seedIndexingEvents(
          inProgress.map((f) => ({
            type: "file.indexing_progress" as const,
            data: {
              file_id: f.file_id,
              project_id: projectId,
              filename: f.filename,
              progress: f.progress,
              stage: f.stage,
            },
          })),
        );
      }
    } catch {
      toast.error(t("files.errors.fetchFailed"));
    } finally {
      setIsLoadingFiles(false);
    }
  }, [projectId, seedIndexingEvents, t]);

  useEffect(() => {
    fetchProjectFiles();
  }, [fetchProjectFiles]);

  // Track indexing completion so success/failure feedback reflects the actual
  // end of indexing (not just the upload transfer). Refs (never state) avoid
  // re-running the effect on their own mutation.
  const indexingPrevStageRef = useRef<Map<string, string>>(new Map());
  const indexingNotifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const event of indexingEvents) {
      const { file_id, project_id, stage, filename } = event.data;

      if (project_id !== projectId) continue;

      const prevStage = indexingPrevStageRef.current.get(file_id);
      indexingPrevStageRef.current.set(file_id, stage);

      // First time we see this file (e.g. seeded on refresh): record its stage
      // without firing — only real transitions should notify.
      if (prevStage === undefined) continue;
      if (prevStage === stage) continue;
      if (indexingNotifiedRef.current.has(file_id)) continue;

      if (stage === INDEXING_DONE_STAGE) {
        indexingNotifiedRef.current.add(file_id);
        toast.success(t("files.indexingComplete", { filename }));
        // Refresh so the card shows real metadata (rows/sheets) now that the
        // file is indexed. The "done" stage isn't an active stage, so the bar
        // collapses to the metadata view on its own.
        void fetchProjectFiles();
      } else if (INDEXING_FAILED_STAGES.has(stage)) {
        indexingNotifiedRef.current.add(file_id);
        toast.error(t("files.errors.indexingFailed", { filename }));
      }
    }
  }, [indexingEvents, projectId, fetchProjectFiles, t]);

  // Fetch group members for mention autocomplete
  const fetchGroupMembers = useCallback(async () => {
    if (!groupId) {
      setGroupMembers([]);
      return;
    }
    try {
      const response = await getGroup(groupId);
      setGroupMembers(response.group.members || []);
    } catch (err) {
      console.error("Failed to fetch group members:", err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  // Also listen to global member_joined notifications (from main API via GroupsContext)
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = onGlobalMemberJoined((joinedGroupId) => {
      if (joinedGroupId === groupId) {
        fetchGroupMembers();
      }
    });
    return unsubscribe;
  }, [groupId, onGlobalMemberJoined, fetchGroupMembers]);

  const handleUploadProjectFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!ALLOWED_FILE_EXTENSION_SET.has(ext ?? "")) {
        toast.error(t("files.errors.invalidType"));
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t("files.errors.tooLarge"));
        return;
      }

      setIsUploadingFile(true);
      try {
        const response = await uploadProjectFile(projectId, file);
        setProjectFiles((prev) => [
          {
            file_id: response.file_id,
            filename: response.filename,
            project_id: response.project_id,
            sheets: [],
            total_rows: 0,
            uploaded_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        seedIndexingEvents([
          {
            type: "file.indexing_progress",
            data: {
              file_id: response.file_id,
              project_id: projectId,
              filename: response.filename,
              progress: 0,
              stage: "queued",
            },
          },
        ]);
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };

        if (err.response?.status === 409) {
          toast.error(t("files.errors.alreadyExists", { filename: file.name }));
        } else if (err.response?.status === 413) {
          toast.error(t("files.errors.tooLarge"));
        } else if (err.response?.status === 400) {
          toast.error(t("files.errors.invalidType"));
        } else if (err.response?.status === 503) {
          toast.error(t("files.errors.unavailable"));
        } else {
          toast.error(t("files.errors.uploadFailed"));
        }
      } finally {
        setIsUploadingFile(false);
      }
    },
    [projectId, t, seedIndexingEvents],
  );

  const handleDeleteProjectFile = useCallback(
    async (fileId: string) => {
      try {
        const response = await deleteProjectFile(fileId);

        if (!response.ok) {
          toast.error(t("files.errors.deleteFailed"));
          return;
        }
        // Drop indexing events before re-fetch so late WS updates can't
        // fire spurious toasts or re-add the deleted file.
        removeIndexingEvent(fileId);
        indexingNotifiedRef.current.delete(fileId);
        indexingPrevStageRef.current.delete(fileId);
        setProjectFiles((prev) => prev.filter((f) => f.file_id !== fileId));
        toast.success(t("files.deleteSuccess"));
        await fetchProjectFiles();
      } catch {
        toast.error(t("files.errors.deleteFailed"));
      }
    },
    [t, removeIndexingEvent, fetchProjectFiles],
  );

  // Vault approval (state, REST API calls, WS callbacks)
  const orgdbId = effectiveOrgdbId;
  const {
    currentVaultApproval,
    pendingVaultWriteCount: pendingWritesCount,
    currentIndex: currentVaultIndex,
    approveVaultWrite,
    rejectVaultWrite,
    closeVaultApproval,
    openPendingVaultWrites,
    goToNextPending,
    goToPrevPending,
    checkAndOpenVaultApproval,
    handleVaultWritePending,
    handleVaultWriteResult,
  } = useVaultApproval({ orgdbId });

  // Badge count: use API count as the single source of truth
  // (message-based counting caused mismatches when switching projects)
  const pendingVaultWriteCount = pendingWritesCount;

  // Wrap approve/reject to also update message steps immediately on success
  const approveVaultWriteWithDispatch = useCallback(
    async (requestId: string) => {
      const success = await approveVaultWrite(requestId);

      if (success) {
        dispatch({
          type: "BATCH_UPDATE_VAULT_WRITE_STATUSES",
          payload: { statuses: { [requestId]: { status: "approved" } } },
        });
      }
    },
    [approveVaultWrite, dispatch],
  );

  const rejectVaultWriteWithDispatch = useCallback(
    async (requestId: string, reason?: string) => {
      const success = await rejectVaultWrite(requestId, reason);

      if (success) {
        dispatch({
          type: "BATCH_UPDATE_VAULT_WRITE_STATUSES",
          payload: {
            statuses: {
              [requestId]: {
                status: "rejected",
                rejectionReason: reason ?? null,
              },
            },
          },
        });
      }
    },
    [rejectVaultWrite, dispatch],
  );

  // Wrap vault write result handler to also update message steps
  const handleVaultWriteResultWithDispatch = useCallback(
    (data: VaultWriteResult) => {
      handleVaultWriteResult(data);

      // Update the message steps with the new status
      if (data.vault_path) {
        const status = data.rejected
          ? "rejected"
          : data.success
            ? "approved"
            : "pending";
        dispatch({
          type: "UPDATE_VAULT_WRITE_STATUS",
          payload: {
            vaultPath: data.vault_path,
            status,
            rejectionReason: data.reason,
          },
        });
      }
    },
    [handleVaultWriteResult],
  );

  const { incrementTokens, enforceLimit, openLimitDialog, getDashboardStats } =
    useDashboardStats();

  // Token usage & compaction callbacks
  const handleTokenUsage = useCallback((data: TokenUsage) => {
    setTokenUsage(data);
  }, []);

  const handleCompactionStarted = useCallback(() => {
    setIsCompacting(true);
  }, []);

  const handleCompactionResult = useCallback((result: CompactionResult) => {
    setIsCompacting(false);
    if (result.type === "success") {
      toast.success(result.message);
    } else if (result.type === "error") {
      toast.error(result.message);
    } else {
      toast.info(result.message);
    }
  }, []);

  // Await the token refresh before showing the retry prompt so the user
  // can't resend before the new token is in context (mirrors Chat.tsx:130-145).
  const handleAuthError = useCallback(() => {
    refreshOrForceLogout()
      .then(() => {
        dispatch({
          type: "SET_AGENT_ERROR",
          payload: { error: t("errors.sessionExpired", { ns: "common" }) },
        });
      })
      .catch(() => {
        // force logout modal already triggered inside refreshOrForceLogout
      });
  }, [dispatch, t]);

  // Open the upgrade dialog immediately, then sync client-side token state so
  // enforceLimit("token") catches subsequent send attempts without a server round-trip.
  const handleTokenLimitReached = useCallback(() => {
    openLimitDialog("token");
    getDashboardStats().catch(() => {});
  }, [openLimitDialog, getDashboardStats]);

  // Auto-name mutation. Retries on 409 to absorb the BE race where
  // "response ended" is emitted before the assistant message is persisted
  // (BE keeps that order on purpose so the FE stays snappy).
  const { mutate: mutateAutoName } = useMutation({
    mutationFn: ({ expectedName }: { expectedName: string }) =>
      inferProjectName(projectId, expectedName),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      return status === 409;
    },
    retryDelay: (attempt) => 300 + attempt * 300, // 300ms, 600ms
  });

  const triggerAutoName = useCallback(
    (expectedName: string) => {
      mutateAutoName(
        { expectedName },
        {
          onSuccess: ({ project_name, updated }) => {
            if (updated && project_name) {
              updateProjectNameLocal(projectId, project_name);
            }
          },
          onError: (err) => {
            // Silent fallback — keep the default name, no toast.
            console.warn("[auto-name] inference failed", err);
          },
        },
      );
    },
    [mutateAutoName, projectId, updateProjectNameLocal],
  );

  // WebSocket hook
  const {
    sendWsMessage,
    sendCompactMessage,
    stopAgent,
    sendClarificationAnswer,
    notifyOnDone,
    showNotifyBanner,
    requestNotifyOnDone,
  } = useAgenticWebSocket({
    dispatch,
    setProgressSteps,
    setIsStreaming,
    setPendingClarification,
    setSelectedOptions,
    setClarificationCollapsed,
    setInput,
    setStatusMessage,
    token: token ?? "",
    projectId,
    provider,
    isAgnoEnabled,
    isStreaming,
    isLoadingHistory,
    onVaultWritePending: handleVaultWritePending,
    onVaultWriteResult: handleVaultWriteResultWithDispatch,
    onTokenUsage: handleTokenUsage,
    onTokensDelta: incrementTokens,
    onCompactionStarted: handleCompactionStarted,
    onCompactionResult: handleCompactionResult,
    onAuthError: handleAuthError,
    onTokenLimitReached: handleTokenLimitReached,
    // Raw DB name (not the fallback above) — BE compares it for idempotency.
    currentProjectName: projectDetail?.project_name,
    onFirstResponseEnded: triggerAutoName,
    webSearchEnabled,
    hasFiles: projectFiles.length > 0,
    // Group chat: current user info for message attribution
    currentUserSub: userProfile?.sub,
    currentUserName: userProfile?.user_name || userProfile?.email,
  });

  // Clarification hook
  const { handleOptionClick, submitClarification } = useClarification({
    input,
    setInput,
    dispatch,
    sendClarificationAnswer,
    setProgressSteps,
    setIsStreaming,
    pendingClarification,
    setPendingClarification,
    selectedOptions,
    setSelectedOptions,
    setClarificationCollapsed,
    sendWsMessage,
  });

  // Conversation history (also restores pending clarification and token usage)
  // For groups (forceAgno=true), use the Agentic service endpoint
  // historyRefreshKey triggers refetch when another group member's agent responds
  useConversationHistory(
    projectId,
    dispatch,
    setPendingClarification,
    setTokenUsage,
    isNewChat,
    forceAgno,
    historyRefreshKey,
  );

  // Poll for vault write status updates (pending -> approved/rejected)
  useVaultStatusPolling(messages, dispatch, isLoadingHistory);

  // Group events: listen for other members' activity
  useGroupEvents({
    groupId,
    onUserMessage: useCallback(
      (msg: GroupEventMessage) => {
        // Add other member's message to the chat immediately
        const newMessage: ChatMessage = {
          id: msg.conversation_id || `group-${Date.now()}`,
          conversationId: msg.conversation_id || undefined,
          role: "user",
          text: msg.content,
          userSub: msg.sender_sub,
          userName: msg.sender_name || undefined,
        };
        dispatch({
          type: "ADD_GROUP_MESSAGE",
          payload: { message: newMessage },
        });
      },
      [dispatch],
    ),
    onAgentTyping: useCallback((msg: GroupEventMessage) => {
      if (groupTypingTimerRef.current) {
        clearTimeout(groupTypingTimerRef.current);
      }
      setGroupTypingUser(msg.sender_name || "Another member");
      groupTypingTimerRef.current = setTimeout(() => {
        setGroupTypingUser(null);
        groupTypingTimerRef.current = null;
      }, 60000);
    }, []),
    onAgentResponse: useCallback(() => {
      if (groupTypingTimerRef.current) {
        clearTimeout(groupTypingTimerRef.current);
        groupTypingTimerRef.current = null;
      }
      setGroupTypingUser(null);
      setHistoryRefreshKey((k) => k + 1);
    }, []),
    onMemberJoined: useCallback(() => {
      // Refresh group members when a new member joins
      fetchGroupMembers();
    }, [fetchGroupMembers]),
  });

  // Per-project context-window cap. Derived from the same `tokenUsage` payload
  // emitted by the WS and seeded by the conversation history API, so the
  // disabled state survives refresh without extra plumbing.
  const isProjectTokenLimitReached = (tokenUsage?.usagePercent ?? 0) >= 100;

  const sendQuery = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      if (isProjectTokenLimitReached) return;
      if (enforceLimit("message")) return;
      if (enforceLimit("token")) return;
      saveProjectActivity(projectId);
      // Edit chats attach the widget SQL to the FIRST message of an empty chat
      // only. The prefix stays armed across re-opens but fires solely when the
      // conversation is empty — so resuming a chat with history never re-injects
      // the original SQL into a follow-up turn (which would steer the model back
      // to the starting point). Later turns rely on history.
      let outgoing = query;
      if (typeof window !== "undefined") {
        const editKey = `project_${projectId}_editPrefix`;
        const prefix = sessionStorage.getItem(editKey);

        if (prefix) {
          const { hasMessages, isLoadingHistory: loadingHistory } =
            chatStateRef.current;

          if (!hasMessages && !loadingHistory) {
            // Empty, settled chat: this is the first message — attach context.
            sessionStorage.removeItem(editKey);
            outgoing = `${query}${prefix}`;
          } else if (hasMessages) {
            // Resumed chat with history: never inject; drop the stale arm.
            sessionStorage.removeItem(editKey);
          }
          // Empty-but-still-loading: leave armed; it fires once history settles.
        }
      }
      sendWsMessage(outgoing);
    },
    [sendWsMessage, projectId, enforceLimit, isProjectTokenLimitReached],
  );

  // Send initial message for new projects
  useInitializeChat(projectId, sendQuery, !!token && !isLoadingHistory);

  const contextValue = useMemo<AgenticChatContextValue>(
    () => ({
      messages,
      isLoadingHistory,
      input,
      isStreaming,
      progressSteps,
      provider,
      isAgnoEnabled,
      pendingClarification,
      selectedOptions,
      clarificationCollapsed,
      projectName,
      dbName,
      projectId,
      orgdbId,
      groupId,
      groupMembers,
      tokenUsage,
      isProjectTokenLimitReached,
      isCompacting,
      statusMessage,
      groupTypingUser,
      pendingVaultWriteCount,
      projectFiles,
      isLoadingFiles,
      isUploadingFile,
      isFileIndexingActive,
      isFilesPanelOpen,
      sendQuery,
      sendWsMessage,
      sendCompactMessage,
      stopAgent,
      setInput,
      setProvider,
      setAgnoEnabled,
      handleOptionClick,
      submitClarification,
      setClarificationCollapsed,
      checkAndOpenVaultApproval,
      uploadProjectFile: handleUploadProjectFile,
      deleteProjectFile: handleDeleteProjectFile,
      setFilesPanelOpen,
      openPendingVaultWrites,
      goToNextPending,
      goToPrevPending,
      currentVaultIndex,
      notifyOnDone,
      showNotifyBanner,
      requestNotifyOnDone,
      webSearchEnabled,
      setWebSearchEnabled,
      editContext: edit,
    }),
    [
      messages,
      isLoadingHistory,
      input,
      isStreaming,
      progressSteps,
      provider,
      isAgnoEnabled,
      pendingClarification,
      selectedOptions,
      clarificationCollapsed,
      projectName,
      dbName,
      projectId,
      orgdbId,
      groupId,
      groupMembers,
      tokenUsage,
      isProjectTokenLimitReached,
      isCompacting,
      statusMessage,
      groupTypingUser,
      pendingVaultWriteCount,
      projectFiles,
      isLoadingFiles,
      isUploadingFile,
      isFileIndexingActive,
      isFilesPanelOpen,
      sendQuery,
      sendWsMessage,
      sendCompactMessage,
      stopAgent,
      setInput,
      setProvider,
      setAgnoEnabled,
      handleOptionClick,
      submitClarification,
      setClarificationCollapsed,
      handleUploadProjectFile,
      handleDeleteProjectFile,
      checkAndOpenVaultApproval,
      openPendingVaultWrites,
      goToNextPending,
      goToPrevPending,
      currentVaultIndex,
      notifyOnDone,
      showNotifyBanner,
      requestNotifyOnDone,
      webSearchEnabled,
      setWebSearchEnabled,
      edit,
    ],
  );

  return (
    <AgenticChatContext.Provider value={contextValue}>
      {children}
      <VaultWriteApprovalModal
        pending={currentVaultApproval}
        onApprove={approveVaultWriteWithDispatch}
        onReject={rejectVaultWriteWithDispatch}
        onClose={closeVaultApproval}
        currentIndex={currentVaultIndex}
        totalCount={pendingWritesCount}
        onNext={goToNextPending}
        onPrev={goToPrevPending}
      />
    </AgenticChatContext.Provider>
  );
};
