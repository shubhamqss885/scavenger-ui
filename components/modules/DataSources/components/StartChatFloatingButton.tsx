"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { useTranslation } from "@/lib/i18n/client";
import { generateProjectName } from "@/lib/utils/projectNameGenerator";

type StartChatFloatingButtonProps = Readonly<{
  databaseId: string;
}>;

export function StartChatFloatingButton({
  databaseId,
}: StartChatFloatingButtonProps) {
  const { t } = useTranslation("database");
  const { t: tHome } = useTranslation("home");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { projects } = useProjectsData();
  const { addProject } = useProjectsActions();
  const router = useRouter();

  const handleStartChat = useCallback(async () => {
    // Guard against duplicate calls
    if (isCreatingProject) return;

    // Validate databaseId
    if (!databaseId) {
      console.error("Cannot create project: databaseId is undefined");
      return;
    }

    setIsCreatingProject(true);

    try {
      const projectName = generateProjectName(
        projects ?? [],
        tHome("page.newProject"),
      );

      const newProjectData = await addProject(projectName, databaseId, true);

      if (!newProjectData) {
        setIsCreatingProject(false);
        return;
      }

      // Navigate immediately when ready (no artificial delay)
      router.push(`/project/${newProjectData.id}/agent`);
    } catch (error) {
      console.error("Failed to start chat with data source:", error);
      setIsCreatingProject(false);
    }
  }, [addProject, databaseId, isCreatingProject, projects, router, tHome]);

  return (
    <Button
      onClick={handleStartChat}
      disabled={isCreatingProject}
      aria-label={t("actions.startChatWithYourData")}
      aria-busy={isCreatingProject}
      className="fixed bottom-10 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full p-0 shadow-xl hover:shadow-2xl disabled:opacity-100 sm:bottom-12 sm:right-6 sm:w-[236px] sm:justify-start sm:gap-2 sm:px-5"
    >
      {isCreatingProject ? (
        <Icon
          name="Loader2"
          size="sm"
          className="h-[18px] w-[18px] animate-spin"
          variant="white"
        />
      ) : (
        <Icon
          name="MessageCircle"
          size="sm"
          variant="white"
          strokeWidth={2}
          className="h-[18px] w-[18px]"
        />
      )}

      <span className="hidden whitespace-nowrap sm:inline">
        {isCreatingProject
          ? t("actions.startingChatWithYourData")
          : t("actions.startChatWithYourData")}
      </span>
    </Button>
  );
}
