"use client";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useUserContext } from "@/lib/context/UserDataContext";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import ProjectLoadingSkeleton from "@/components/blocks/Loading/ProjectLoadingSkeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";
import { H2, Muted } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const NonAgenticEmptyState = () => {
  const { t } = useTranslation("project");
  const { homeRoute } = useOrgFeatures();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <Icon name="Archive" size="xl" variant="muted" />
      <H2 className="border-b-0 pb-0">{t("nonAgentic.title")}</H2>
      <Muted className="max-w-md">{t("nonAgentic.description")}</Muted>
      <Button asChild variant="outline">
        <Link href={homeRoute}>{t("nonAgentic.backToHome")}</Link>
      </Button>
    </div>
  );
};

type PageProps = Readonly<{
  params: { projectId: string };
}>;

const Page = ({ params }: PageProps) => {
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
  const isLoading = isUserLoading || isProjectsLoading || isFeaturesLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!canViewChats) {
      router.replace(homeRoute);
      return;
    }
    if (project?.is_agentic) {
      router.replace(`/project/${params.projectId}/agent`);
    }
  }, [isLoading, canViewChats, project, params.projectId, router, homeRoute]);

  if (isLoading || !canViewChats) return <ProjectLoadingSkeleton />;
  if (project?.is_agentic) return <ProjectLoadingSkeleton />;

  return <NonAgenticEmptyState />;
};

export default withPageAuthRequired(Page);
