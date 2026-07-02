import {
  CompactionResult,
  PendingClarification,
  ProgressStep,
  TokenUsage,
  VaultWritePending,
  VaultWriteResult,
} from "../types";
import { type ModelProvider } from "@/components/blocks/InputBarShell/ModelSwitcher";

export const NOTIFY_BANNER_THRESHOLD_MS = 10_000;

export const NOTIFY_BANNER_CONFIRM_LINGER_MS = 3_000;

export const IDLE_SESSION_TEARDOWN_MS = 5 * 60_000;

export type Translator = (
  key: string,
  opts?: Record<string, unknown>,
) => string;

// All side-effects that need a live React callback. Set by the store while
// (potentially) detached; drained by the hook in `syncFromSnapshot` once a
// component is mounted.
export type PendingReplay = {
  autoName?: { expectedName: string };
  tokenLimitReached?: true;
  authError?: true;
  agentError?: { error: string; guardEmpty?: boolean };
  snapshotClarification?: { text: string; steps: ProgressStep[] };
  finalize?: {
    text: string;
    steps: ProgressStep[];
    conversationId: string;
    interrupted: boolean;
  };
  vaultWritePending?: VaultWritePending[];
  vaultWriteResult?: VaultWriteResult[];
  tokenUsage?: TokenUsage;
  tokensDelta?: number;
  compactionStarted?: true;
  compactionResult?: CompactionResult;
  // Signal that a fresh clarification_request arrived (not a history restore).
  // Hook drains this to reset selectedOptions / clarificationCollapsed —
  // matches the original WS-handler behavior.
  newClarification?: true;
};

export type ChatSessionState = {
  textAccum: string;
  streamingDelta: string;
  progressSteps: ProgressStep[];
  isStreaming: boolean;
  pendingClarification: PendingClarification | null;
  statusMessage: string | null;
  tokenUsage: TokenUsage | null;
  // True once response_ended / agent_stopped has been captured. Distinct from
  // isStreaming: lets the mount-time merge tell "still running" from
  // "finalized while detached — REST history is authoritative".
  didFinalize: boolean;
  pendingReplay: PendingReplay;
  // Persisted across unmount so finalize() can fire the desktop notification
  // post-unmount. The hook mirrors a copy for the banner UI.
  notifyOnDone: boolean;
  // Cross-mount lifecycle anchor. The hook reads it on attach to re-arm the
  // threshold timer from remaining time; hook-local state would be lost on remount.
  bannerArmedAt: number | null;
  // Group chat: true when another member is chatting with the agent
  isAgentBusy?: boolean;
};

export type SendContext = Readonly<{
  token: string;
  provider: ModelProvider;
  isAgnoEnabled: boolean;
  t: Translator;
  webSearchEnabled?: boolean;
  hasFiles?: boolean;
  // Used at finalize time to decide whether to trigger auto-name. Captured at
  // send time so the check uses the project name as of when the run started.
  currentProjectName?: string;
  // The user-facing text for this turn — distinct from `query` (which is the
  // WS wire payload). Pass `undefined` when no user bubble should be shown
  // (e.g. clarification fallback where the answer renders inline on the
  // prior agent's clarification card).
  displayedText?: string;
}>;

export type ChatSession = {
  projectId: string;
  socket: WebSocket | null;
  state: ChatSessionState;
  onUpdate: (() => void) | null;
  // Latest translator from the last attach. WS handlers run with this even
  // when no component is mounted (i18next state is module-scoped, so `t`
  // remains callable after the React component that owned it unmounts).
  t: Translator;
  // Project name captured at send time, used for auto-name check at finalize.
  // BE-quirk workaround (paired with `displayedUserMessage`): both exist
  // because the BE persists user message + project rename at response_ended,
  // not at send. When the BE persists eagerly, delete both together.
  currentProjectName: string | undefined;
  // Display text for the most recent user turn. Used to synthesize a user
  // bubble on remount when REST history hasn't yet persisted it — the BE
  // persists user messages at response_ended, not at send. This is the
  // user-facing text, NOT the WS wire payload (the two diverge for the
  // clarification-fallback case; see useClarification + sendWsMessage).
  //
  // If/when the BE persists user messages eagerly (separate ticket), this
  // field and the user-bubble half of ENSURE_INFLIGHT_TAIL can go away.
  displayedUserMessage: string | undefined;
  idleTeardownTimer?: ReturnType<typeof setTimeout>;
};

export const sessions = new Map<string, ChatSession>();

export const initialState = (): ChatSessionState => ({
  textAccum: "",
  streamingDelta: "",
  progressSteps: [],
  isStreaming: false,
  pendingClarification: null,
  statusMessage: null,
  tokenUsage: null,
  didFinalize: false,
  pendingReplay: {},
  notifyOnDone: false,
  bannerArmedAt: null,
  isAgentBusy: false,
});

// Identity translator used pre-attach. Real `t` is set on first attach()
// and persists across detach. If a session ever errors with NO attach
// having ever happened, the user would see the raw i18n key — currently
// unreachable from the UI, but the path exists.
export const fallbackT: Translator = (key) => key;
