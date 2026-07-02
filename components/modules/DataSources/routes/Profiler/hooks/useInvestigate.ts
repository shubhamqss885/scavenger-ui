"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { generateProjectName } from "@/lib/utils/projectNameGenerator";
import { useTranslation } from "@/lib/i18n/client";

export const useInvestigate = (databaseId: string) => {
  const { t: tHome } = useTranslation("home");
  const { t: tDatabase } = useTranslation("database");
  const [isCreating, setIsCreating] = useState(false);
  const { projects } = useProjectsData();
  const { addProject } = useProjectsActions();
  const router = useRouter();

  const investigate = useCallback(
    async (promptMessage: string) => {
      // Guard against missing databaseId (button is disabled when isCreating)
      if (!databaseId) return;

      setIsCreating(true);

      try {
        const projectName = generateProjectName(
          projects ?? [],
          tHome("page.newProject"),
        );

        const newProjectData = await addProject(projectName, databaseId, true);

        if (newProjectData) {
          // Store message and agentic mode in sessionStorage for auto-submit on project page
          // This is the same pattern used by HomeInputBar
          sessionStorage.setItem(
            `project_${newProjectData.id}_initialMessage`,
            promptMessage,
          );
          sessionStorage.setItem(
            `project_${newProjectData.id}_agenticMode`,
            "chat",
          );
          router.push(`/project/${newProjectData.id}/agent`);
        } else {
          // Reset state if project creation was blocked (e.g., project limit reached)
          setIsCreating(false);
        }
      } catch (error) {
        console.error("Error creating investigation project:", error);
        toast.error(tDatabase("profiler.actions.investigateError"));
        setIsCreating(false);
      }
    },
    [databaseId, projects, addProject, router, tHome, tDatabase],
  );

  return { investigate, isCreating };
};
