"use client";

import { useCallback, useContext } from "react";
import { useContextSelector } from "use-context-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { AgenticChatContext } from "@/components/modules/AgenticChat/AgenticChatContext";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useProjectsActions } from "@/lib/context/ProjectsContext";
import { AxiosContext } from "@/lib/context/AuthContext";
import { toast } from "sonner";

const CopyAgenticMetadata = ({ iconOnly = false }: { iconOnly?: boolean }) => {
  const { t } = useTranslation("agentic-chat");

  // Agentic chat state
  const projectId = useContextSelector(AgenticChatContext, (c) => c!.projectId);
  const projectName = useContextSelector(
    AgenticChatContext,
    (c) => c!.projectName,
  );
  const dbName = useContextSelector(AgenticChatContext, (c) => c!.dbName);
  const isStreaming = useContextSelector(
    AgenticChatContext,
    (c) => c!.isStreaming,
  );
  const messages = useContextSelector(AgenticChatContext, (c) => c!.messages);
  const progressSteps = useContextSelector(
    AgenticChatContext,
    (c) => c!.progressSteps,
  );
  const pendingClarification = useContextSelector(
    AgenticChatContext,
    (c) => c!.pendingClarification,
  );
  const provider = useContextSelector(AgenticChatContext, (c) => c!.provider);

  // Auth
  const { authStatus } = useContext(AxiosContext);

  // User
  const { userProfile } = useUserContext();

  // Organization
  const { organizationDetails } = useOrgFeatures();

  // Database
  const { getDbById } = useOrganizationDbData();
  const { getProjectDetailById } = useProjectsActions();

  const copyMetadata = useCallback(async () => {
    const projectDetail = getProjectDetailById(projectId);
    const selectedDb = projectDetail?.selected_org_db
      ? getDbById(projectDetail.selected_org_db)
      : null;

    // Last user question — derive from messages
    const lastQuestion =
      messages.findLast((m) => m.role === "user")?.text ?? null;

    // Recent tool executions (last 10)
    // During streaming, live progressSteps has current data;
    // after finalization, steps are persisted in message.steps
    const allSteps = isStreaming
      ? progressSteps
      : messages.flatMap((m) => m.steps ?? []);
    const recentTools = allSteps.slice(-10).map((step) => ({
      tool: step.tool,
      status: step.status,
      durationMs: step.durationMs ?? null,
      hasError: step.toolOutput?.isError ?? false,
    }));

    const metadata = {
      timestamp: new Date().toISOString(),
      environment: {
        appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "unknown",
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "unknown",
        wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL ?? "unknown",
      },
      project: {
        projectId,
        projectName,
        sessionId: projectDetail?.session_id ?? null,
        isAgentic: projectDetail?.is_agentic ?? null,
      },
      database: {
        dbName,
        dbId: projectDetail?.selected_org_db ?? null,
        dbType: selectedDb?.db_type ?? null,
        unifiedStatus: selectedDb?.unified_status ?? null,
        schemaDescriptionStatus: selectedDb?.schema_description_status ?? null,
      },
      chatState: {
        provider,
        messageCount: messages.length,
        isStreaming,
        hasPendingClarification: pendingClarification !== null,
        lastUserQuestion: lastQuestion,
        recentToolExecutions: recentTools,
      },
      user: {
        userId: userProfile?.id ?? null,
        email: userProfile?.email ?? null,
        role: userProfile?.user_role_name ?? null,
        subscriptionPlan: userProfile?.subscription?.plan_name ?? null,
        subscriptionActive: userProfile?.subscription?.is_active ?? null,
        authStatus,
      },
      organization: {
        orgId: organizationDetails?.org_id ?? null,
        orgName: organizationDetails?.organization_name ?? null,
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      },
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
      toast.success(t("header.metadataCopied"));
    } catch {
      toast.error(t("header.metadataCopyFailed"));
    }
  }, [
    projectId,
    projectName,
    dbName,
    isStreaming,
    messages,
    progressSteps,
    pendingClarification,
    provider,
    authStatus,
    userProfile,
    organizationDetails,
    getDbById,
    getProjectDetailById,
    t,
  ]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconOnly ? (
            <button
              type="button"
              onClick={copyMetadata}
              className="inline-flex h-7 items-center justify-center rounded-md px-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icon
                name="Bug"
                size="xs"
                className="text-slate-800 dark:text-slate-100"
              />
            </button>
          ) : (
            <Button
              variant="ghost"
              className="h-auto cursor-pointer px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={copyMetadata}
            >
              {t("header.reportBug")}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side={iconOnly ? "top" : "bottom"} align="start">
          <p className="text-xs">{t("header.copyMetadata")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CopyAgenticMetadata;
