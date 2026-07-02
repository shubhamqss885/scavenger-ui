"use client";

// WEB-COMPONENT: the chats sidebar. A thin composition that REUSES the app's
// presentational sidebar pieces (SidebarLinkItem / SidebarContentCollapsibleGroup
// / CtaButton) over the REAL ProjectsContext, so rename/delete/search/streaming
// behaviour and any future improvements to those components flow through without
// being re-implemented here. Scope = Chats + New chat (no data-sources/dashboards
// /footer). Project selection is in-element STATE (via the next-view-transitions
// Link shim → WidgetRouterContext.navigate), never URL navigation.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarContentCollapsibleGroup } from "@/components/blocks/AppSidebar/components/shared/SidebarContentCollapsibleGroup";
import { SidebarLinkItem } from "@/components/blocks/AppSidebar/components/shared/SidebarLinkItem";
import { CtaButton } from "@/components/blocks/AppSidebar/components/shared/SidebarActions";
import {
  useProjectsActions,
  getProjectActivityMap,
} from "@/lib/context/ProjectsContext";
import { useStreamingProjectIds } from "@/components/modules/AgenticChat/chatSession";
import { useTranslation } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toUtcMs } from "@/lib/utils/date";
import { useAgenticProjects } from "./useAgenticProjects";

type Props = Readonly<{
  activeProjectId: string;
  onNewChat: () => void;
}>;

export const WidgetSidebar = ({ activeProjectId, onNewChat }: Props) => {
  const { t } = useTranslation("home");
  const { projects, isLoading } = useAgenticProjects();
  const { renameProject, deleteProject } = useProjectsActions();
  const streamingProjectIds = useStreamingProjectIds();

  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [activityKey, setActivityKey] = useState(0);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [originalName, setOriginalName] = useState("");
  const submittingRef = useRef(false);

  // Re-sort when a chat records activity (same signal the app sidebar uses).
  useEffect(() => {
    const handler = () => setActivityKey((k) => k + 1);
    globalThis.window.addEventListener("projectActivityUpdated", handler);
    return () =>
      globalThis.window.removeEventListener("projectActivityUpdated", handler);
  }, []);

  const sortedProjects = useMemo(() => {
    const activityMap = getProjectActivityMap();
    return [...projects].sort((a, b) => {
      const aTime = toUtcMs(activityMap[a.project_id] || a.created_at || 0);
      const bTime = toUtcMs(activityMap[b.project_id] || b.created_at || 0);
      return bTime - aTime;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, activityKey]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery || !searchActive) return sortedProjects;
    const q = searchQuery.toLowerCase();
    return sortedProjects.filter((p) =>
      (p.project_name || "").toLowerCase().includes(q),
    );
  }, [sortedProjects, searchQuery, searchActive]);

  const resetRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
    setOriginalName("");
  }, []);

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setOriginalName(currentName);
  }, []);

  const submitRename = useCallback(
    async (projectId: string) => {
      // Guard the blur-after-Enter double fire (onBlur + onKeyDown both submit).
      if (submittingRef.current) return;
      const trimmed = renameValue.trim();

      if (!trimmed || trimmed === originalName) {
        resetRename();
        return;
      }
      submittingRef.current = true;
      try {
        await renameProject(projectId, trimmed);
      } finally {
        submittingRef.current = false;
        resetRename();
      }
    },
    [renameValue, originalName, renameProject, resetRename],
  );

  const clearSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery("");
  }, []);

  return (
    <Sidebar collapsible="none" className="border-r">
      <SidebarContent className="pt-2">
        <div className="flex flex-col pb-1">
          <CtaButton
            label={t("sidebar.addProject.tooltips.addNew", "Start a chat")}
            isAnimating={false}
            onClick={onNewChat}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1 px-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {t("sidebar.chats.empty", "No chats yet")}
          </p>
        ) : (
          <SidebarContentCollapsibleGroup
            title={t("sidebar.chats.title", "Chats")}
            icon="MessagesSquare"
            searchActive={searchActive}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClick={() => setSearchActive(true)}
            onSearchClear={clearSearch}
            searchPlaceholder={t("sidebar.search.placeholder", "Search...")}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          >
            {filteredProjects.map((p) => (
              <SidebarLinkItem
                key={p.project_id}
                href={p.path || "#"}
                label={p.project_name || "Untitled"}
                active={p.project_id === activeProjectId}
                isRenaming={renamingId === p.project_id}
                renameValue={renamingId === p.project_id ? renameValue : ""}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => submitRename(p.project_id)}
                onRenameCancel={resetRename}
                streaming={streamingProjectIds.has(p.project_id)}
                streamingLabel={t("sidebar.streamingIndicator")}
                actions={[
                  {
                    label: t("sidebar.projectActions.rename", "Rename"),
                    onClick: () =>
                      startRename(p.project_id, p.project_name || ""),
                  },
                  {
                    label: t("sidebar.projectActions.delete", "Delete"),
                    onClick: () => deleteProject(p.project_id),
                    variant: "destructive" as const,
                  },
                ]}
              />
            ))}
          </SidebarContentCollapsibleGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default WidgetSidebar;
