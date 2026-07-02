"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useProjectFilesState } from "@/lib/context/ProjectFilesProvider";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";
import { useTransitionRouter } from "next-view-transitions";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useTranslation } from "@/lib/i18n/client";
import { generateProjectName } from "@/lib/utils/projectNameGenerator";
import { getValidDatabaseSelection } from "@/lib/utils/databaseSelection";
import { DatabaseSelector } from "@/components/blocks/DatabaseSelector";
import {
  useAudioRecording,
  type RecordingErrorCode,
} from "@/lib/hooks/useAudioRecording";
import {
  DictationActiveControls,
  DictationStartButton,
} from "@/components/blocks/InputBar/components/DictationControls";
import { RecordingSurface } from "@/components/blocks/InputBar/components/RecordingSurface";
import HomeSuggestedCategories from "@/components/blocks/InputBar/components/HomeSuggestedCategories";
import InputBarShell from "@/components/blocks/InputBarShell";
import { toast } from "sonner";
import LanguageToolbarButton from "@/components/blocks/InputBarShell/LanguageToolbarButton";
import WebSearchToggleButton from "@/components/blocks/InputBarShell/WebSearchToggleButton";
// Disabled: single backend now, no model switching needed
// import ModelSwitcher from "@/components/blocks/InputBarShell/ModelSwitcher";
// import AgnoToggle from "@/components/blocks/InputBarShell/AgnoToggle";
import { type ModelProvider } from "@/components/blocks/InputBarShell/ModelSwitcher";
import { ProjectFilesButton } from "@/components/modules/AgenticChat/components/files/ProjectFilesButton";
import { useFileIndexingEvents } from "@/lib/context/EventsContext/hooks/useFileIndexingEvents";
import PendingFilesBar, {
  type PendingFile,
  ACTIVE_STAGES,
} from "@/components/blocks/InputBar/components/PendingFilesBar";
import { TooltipProvider } from "@/components/ui/tooltip";

type PendingUpload = {
  projectId: string;
  files: PendingFile[];
};

const HomeInputBar = () => {
  const { t, i18n } = useTranslation("home");
  const { t: tAgentic } = useTranslation("agentic-chat");
  const [conversationPrompt, setConversationPrompt] = useState("");
  const { isFileUploadingInProgress } = useProjectFilesState();
  const [isSending, setIsSending] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadingFilenames, setUploadingFilenames] = useState<string[]>([]);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
    null,
  );
  const pendingProjectId = pendingUpload?.projectId ?? null;
  const [isDeepQueryEnabled, setIsDeepQueryEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  // Disabled: single backend now, no model switching needed
  const [provider] = useState<ModelProvider>("claude");
  const [isAgnoEnabled] = useState(true);
  const { defaultDb, loading, organizationDbs } = useOrganizationDbData();
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const { projects } = useProjectsData();
  const { addProject } = useProjectsActions();
  const { enforceLimit } = useDashboardStats();
  const router = useTransitionRouter();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();

  const isDatabaseSelectorEnabled = isFeatureEnabled(
    FEATURE_FLAGS.DATABASE_SELECTOR,
  );
  const isDeepQueryFeatureEnabled = isFeatureEnabled(FEATURE_FLAGS.DEEP_QUERY);
  const isAudioRecordingEnabled = isFeatureEnabled(
    FEATURE_FLAGS.AUDIO_RECORDING,
  );
  // Disabled: single backend now
  // const isModelSwitcherEnabled = isFeatureEnabled(FEATURE_FLAGS.MODEL_SWITCHER);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscriptionComplete = (transcribedText: string) => {
    if (!transcribedText) return;
    const sep =
      conversationPrompt && !conversationPrompt.endsWith(" ") ? " " : "";
    const next = `${conversationPrompt}${sep}${transcribedText}`;
    setConversationPrompt(next);
    requestAnimationFrame(() => {
      const node = textareaRef.current;

      if (node) {
        node.focus();
        node.setSelectionRange(next.length, next.length);
      }
    });
  };

  const {
    recordingState,
    startRecording,
    cancelRecording,
    stopRecording,
    errorEvent,
    stream: recordingStream,
  } = useAudioRecording(handleTranscriptionComplete, i18n.language);

  useEffect(() => {
    if (!errorEvent) return;
    const keyMap: Record<RecordingErrorCode, string> = {
      PERMISSION_DENIED: "chat.dictation.error.permissionDenied",
      NO_MIC: "chat.dictation.error.noMic",
      MIC_IN_USE: "chat.dictation.error.micInUse",
      UNSUPPORTED: "chat.dictation.error.unsupported",
      ENCODER_FAILED: "chat.dictation.error.encoderFailed",
      TRANSCRIPTION_FAILED: "chat.dictation.error.transcriptionFailed",
      GENERIC: "chat.dictation.error.generic",
    };
    toast.error(tAgentic(keyMap[errorEvent.code]), { duration: 6000 });
  }, [errorEvent, tAgentic]);

  const isRecordingMode =
    recordingState === "recording" || recordingState === "processing";

  useEffect(() => {
    if (defaultDb?.orgdb_id) {
      setSelectedDatabaseId(defaultDb.orgdb_id);
    }
  }, [defaultDb]);

  useEffect(() => {
    if (loading) return;

    const validDbId = getValidDatabaseSelection(
      selectedDatabaseId,
      organizationDbs,
      defaultDb,
    );

    if (validDbId !== selectedDatabaseId) {
      setSelectedDatabaseId(validDbId);
    }
  }, [selectedDatabaseId, organizationDbs, defaultDb, loading]);

  const handleSubmit = async () => {
    if (isDisabled) return;
    if (!conversationPrompt.trim()) return;

    if (!selectedDatabaseId && !pendingProjectId) {
      toast.error(t("page.noDataSourceError"));
      return;
    }

    if (!pendingProjectId && enforceLimit("project")) return;
    if (enforceLimit("message")) return;
    if (enforceLimit("token")) return;

    const query = conversationPrompt;
    setConversationPrompt("");
    setIsSending(true);

    try {
      let projectId: string;

      if (pendingProjectId) {
        projectId = pendingProjectId;
      } else {
        const projectName = generateProjectName(
          projects ?? [],
          t("page.newProject"),
        );

        const newProjectData = await addProject(
          projectName,
          selectedDatabaseId || null,
          true,
        );

        if (!newProjectData) {
          setIsSending(false);
          return;
        }

        projectId = newProjectData.id;
      }

      if (query.trim()) {
        sessionStorage.setItem(`project_${projectId}_initialMessage`, query);
      }

      sessionStorage.setItem(`project_${projectId}_agenticMode`, "chat");

      // Pass web search toggle to the new chat session
      sessionStorage.setItem(
        `project_${projectId}_webSearchEnabled`,
        String(webSearchEnabled),
      );

      // Pass selected model provider + Agno backend toggle to the new chat session
      sessionStorage.setItem(`project_${projectId}_provider`, provider);
      sessionStorage.setItem(
        `project_${projectId}_agno`,
        String(isAgnoEnabled),
      );

      setPendingUpload(null);
      router.push(`/project/${projectId}/agent`);
    } catch (error) {
      console.error("Error in creating new project:", error);
      setIsSending(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setConversationPrompt(prompt);
  };

  const handleProjectNeededForUpload = useCallback(async (): Promise<
    string | null
  > => {
    // Reuse the project created by the first upload so subsequent uploads land
    // in the same project. Otherwise each separate upload creates a new project
    // and handleUploadComplete resets the list to just the latest file.
    if (pendingProjectId) return pendingProjectId;

    try {
      const projectName = generateProjectName(
        projects ?? [],
        t("page.newProject"),
      );

      const newProjectData = await addProject(
        projectName,
        selectedDatabaseId || null,
        true,
      );

      return newProjectData?.id ?? null;
    } catch (error) {
      console.error("Error creating project for file upload:", error);
      return null;
    }
  }, [pendingProjectId, projects, addProject, t, selectedDatabaseId]);

  const handleUploadStart = useCallback((filename: string) => {
    setIsUploadingFile(true);
    setUploadingFilenames((prev) => [...prev, filename]);
  }, []);

  const { seedEvents: seedIndexingEvents, events: indexingEvents } =
    useFileIndexingEvents();

  const handleUploadComplete = useCallback(
    (projectId: string, filename: string, fileId: string) => {
      setIsUploadingFile(false);
      setUploadingFilenames((prev) => prev.filter((f) => f !== filename));
      setPendingUpload((prev) => {
        const entry: PendingFile = { filename, fileId };

        if (prev && prev.projectId === projectId) {
          return { projectId, files: [...prev.files, entry] };
        }
        return { projectId, files: [entry] };
      });
      seedIndexingEvents([
        {
          type: "file.indexing_progress",
          data: {
            file_id: fileId,
            project_id: projectId,
            filename,
            progress: 0,
            stage: "queued",
          },
        },
      ]);
    },
    [seedIndexingEvents],
  );

  const handleUploadError = useCallback(() => {
    setIsUploadingFile(false);
    setUploadingFilenames([]);
  }, []);

  const isFileIndexing =
    pendingUpload?.files.some((f) => {
      const ev = indexingEvents.find((e) => e.data.file_id === f.fileId);
      return ev && ACTIVE_STAGES.has(ev.data.stage);
    }) ?? false;

  const isDisabled =
    isFileUploadingInProgress || isSending || isUploadingFile || isFileIndexing;

  return (
    <InputBarShell
      viewTransitionName="input-bar"
      formDataTour="home-input-bar"
      input={conversationPrompt}
      onInputChange={setConversationPrompt}
      onSubmit={handleSubmit}
      placeholder={t("page.placeholder")}
      disabled={isDisabled}
      submitDisabled={isDisabled || !conversationPrompt.trim()}
      isLoading={isSending}
      autoFocus
      textareaRef={textareaRef}
      inputOverride={
        isRecordingMode ? (
          <RecordingSurface
            recordingState={recordingState}
            stream={recordingStream}
          />
        ) : undefined
      }
      topContent={
        uploadingFilenames.length > 0 ||
        (pendingUpload && pendingUpload.files.length > 0) ? (
          <PendingFilesBar
            files={pendingUpload?.files ?? []}
            uploadingFilenames={uploadingFilenames}
            onRemove={(index) =>
              setPendingUpload((prev) => {
                if (!prev) return null;
                const next = prev.files.filter((_, i) => i !== index);
                return next.length === 0 ? null : { ...prev, files: next };
              })
            }
            onClearAll={() => setPendingUpload(null)}
            clearAllLabel={t("page.clearAll", "Clear all")}
          />
        ) : null
      }
      toolbarLeft={
        <TooltipProvider delayDuration={300}>
          {isDatabaseSelectorEnabled && (
            <div data-tour="database-selector">
              <DatabaseSelector
                value={selectedDatabaseId}
                onChange={setSelectedDatabaseId}
                align="start"
                showSelectedLabel
                className="h-7 border-0 bg-transparent shadow-none hover:bg-slate-100"
                iconClassName="h-3 w-3 text-slate-500"
              />
            </div>
          )}

          {/* Agno toggle for non-super-admins */}
          {/* Disabled: single backend now, no toggle needed */}
          {/* {!isModelSwitcherEnabled && (
            <AgnoToggle
              checked={isAgnoEnabled}
              onCheckedChange={setAgnoEnabled}
              disabled={isRecordingMode}
            />
          )} */}

          {/* Full model switcher (super-admin only) */}
          {/* Disabled: single backend now, no model switching needed */}
          {/* {isModelSwitcherEnabled && (
            <ModelSwitcher
              provider={provider}
              onProviderChange={setProvider}
              agno={isAgnoEnabled}
              onAgnoChange={setAgnoEnabled}
              disabled={isRecordingMode}
            />
          )} */}

          <WebSearchToggleButton
            enabled={webSearchEnabled}
            onToggle={() => setWebSearchEnabled((prev) => !prev)}
            disabled={isRecordingMode}
          />

          {isDeepQueryFeatureEnabled && (
            <Button
              type="button"
              onClick={() => setIsDeepQueryEnabled(!isDeepQueryEnabled)}
              variant="ghost"
              disabled={isRecordingMode}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 font-normal text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${
                isDeepQueryEnabled ? "bg-slate-100 text-slate-700" : ""
              }`}
            >
              <Icon
                name="Search"
                size="xxs"
                className={isDeepQueryEnabled ? "text-primary" : "text-current"}
              />
              <span className="text-xs">{tAgentic("chat.deepQuery")}</span>
            </Button>
          )}
        </TooltipProvider>
      }
      toolbarRight={
        <>
          <ProjectFilesButton
            onProjectNeeded={handleProjectNeededForUpload}
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            disabled={isDisabled}
            className="h-7 w-7 px-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          />

          {isFeatureEnabled(FEATURE_FLAGS.INPUT_LANGUAGE_SELECTOR) && (
            <LanguageToolbarButton />
          )}

          {isAudioRecordingEnabled &&
            (isRecordingMode ? (
              <DictationActiveControls
                isProcessing={recordingState === "processing"}
                onAccept={stopRecording}
                onCancel={cancelRecording}
              />
            ) : (
              <DictationStartButton
                onStart={startRecording}
                isRequesting={recordingState === "requesting"}
                disabled={isDisabled}
              />
            ))}
        </>
      }
      belowShell={
        <HomeSuggestedCategories onPromptSelect={handlePromptSelect} />
      }
    />
  );
};

export default HomeInputBar;
