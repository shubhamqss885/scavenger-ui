"use client";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import AgenticChatLayout from "@/components/modules/AgenticChat/components/layout/AgenticChatLayout";
import { AgenticChatProvider } from "@/components/modules/AgenticChat/AgenticChatContext";
import RotatingStatus from "@/components/modules/AgenticChat/components/messages/RotatingStatus";
import { useUserContext } from "@/lib/context/UserDataContext";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AgentPageProps = Readonly<{
  params: { projectId: string };
}>;

const AgentPage = ({ params }: AgentPageProps) => {
  const { isLoading: isUserLoading } = useUserContext();
  const { isLoading: isProjectsLoading } = useProjectsData();
  const { getProjectDetailById } = useProjectsActions();
  const {
    isFeatureEnabled,
    FEATURE_FLAGS,
    homeRoute,
    isLoading: isFeaturesLoading,
  } = useOrgFeatures();
  const router = useRouter();
  const project = getProjectDetailById(params.projectId);
  const canViewChats = isFeatureEnabled(FEATURE_FLAGS.VIEW_CHATS);

  const isLoading =
    isUserLoading || isFeaturesLoading || (isProjectsLoading && !project);

  useEffect(() => {
    if (isLoading) return;
    if (!canViewChats) {
      router.replace(homeRoute);
      return;
    }
    if (project && !project.is_agentic) {
      router.replace(`/project/${params.projectId}`);
    }
  }, [isLoading, canViewChats, project, params.projectId, router, homeRoute]);

  if (isLoading || !canViewChats || !project?.is_agentic) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <RotatingStatus active />
      </div>
    );
  }

  return (
    <AgenticChatProvider projectId={params.projectId}>
      <AgenticChatLayout />
    </AgenticChatProvider>
  );
};

export default withPageAuthRequired(AgentPage);
