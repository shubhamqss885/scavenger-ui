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

type RetryInChatButtonProps = Readonly<{
  title: string;
  sqlQuery: string;
  orgdbId: string;
  disabled?: boolean;
}>;

const RetryInChatButton = ({
  title,
  sqlQuery,
  orgdbId,
  disabled,
}: RetryInChatButtonProps) => {
  const { t } = useTranslation("dashboard");
  const { t: tHome } = useTranslation("home");
  const { projects } = useProjectsData();
  const { addProject } = useProjectsActions();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleClick = useCallback(async () => {
    if (isStarting || !orgdbId) return;
    setIsStarting(true);
    try {
      const projectName = generateProjectName(
        projects ?? [],
        tHome("page.newProject"),
      );
      const newProject = await addProject(projectName, orgdbId, true);

      if (!newProject) {
        setIsStarting(false);
        return;
      }

      const prompt = t("orgDashboard.widget.retryInChatPrompt", {
        title,
        sql: sqlQuery,
      });
      sessionStorage.setItem(`project_${newProject.id}_initialMessage`, prompt);
      sessionStorage.setItem(`project_${newProject.id}_agenticMode`, "chat");
      router.push(`/project/${newProject.id}/agent`);
    } catch (err) {
      console.error("Failed to start retry chat:", err);
      setIsStarting(false);
    }
  }, [
    isStarting,
    orgdbId,
    projects,
    addProject,
    router,
    t,
    tHome,
    title,
    sqlQuery,
  ]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isStarting || disabled}
    >
      {isStarting && (
        <Icon name="Loader2" size="xs" className="mr-1 animate-spin" />
      )}
      {t("orgDashboard.widget.retryInChat")}
    </Button>
  );
};

export default RetryInChatButton;
