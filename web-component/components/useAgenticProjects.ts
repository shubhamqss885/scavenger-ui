"use client";

// The widget is an agentic-chat surface, so it only ever lists / selects AGENTIC
// projects. The shared ProjectsProvider returns both agentic and non-agentic (SQL)
// projects (the app needs both); this is the ONE place that narrows them to agentic.
// Both the sidebar (list + empty-state count) and the workspace (stale-active
// fallback) consume it, so they can't diverge and accidentally mount the agentic
// chat against a non-agentic project (whose path is `/project/{id}`, no `/agent`).
import { useMemo } from "react";
import { useProjectsData } from "@/lib/context/ProjectsContext";

export const useAgenticProjects = () => {
  const { projects, isLoading } = useProjectsData();
  const agenticProjects = useMemo(
    () => projects.filter((p) => p.is_agentic),
    [projects],
  );
  return { projects: agenticProjects, isLoading };
};
