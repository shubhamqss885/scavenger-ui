"use client";

// The chat workspace: the chats sidebar next to the chat. The active project is
// held in state, so a sidebar click switches chats IN-element (re-keying
// AgenticChatProvider) instead of navigating a URL. Mounted by ChatBoot inside
// the real ProjectsProvider, so it reads the real projects list/actions. Provides
// WidgetRouterContext so the imported sidebar's next-view-transitions Links route
// through `navigate` → setActiveProjectId.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgenticChatProvider } from "@/components/modules/AgenticChat/AgenticChatContext";
import AgenticChatLayout from "@/components/modules/AgenticChat/components/layout/AgenticChatLayout";
import { useProjectsActions } from "@/lib/context/ProjectsContext";
import { generateProjectName } from "@/lib/utils/projectNameGenerator";
import { Toaster } from "@/components/ui/sonner";
import { Icon } from "@/components/ui/icon";
import { WidgetRouterContext, projectIdFromHref } from "../router";
import { WidgetSidebar } from "./WidgetSidebar";
import { useAgenticProjects } from "./useAgenticProjects";
import { Centered } from "../views";

type Props = Readonly<{
  initialProjectId: string;
  // The org's default DB — new chats are created against it so data questions work
  // (resolved in boot.ts). Null when the org has no usable DB.
  defaultOrgDbId: string | null;
}>;

export const WidgetWorkspace = ({
  initialProjectId,
  defaultOrgDbId,
}: Props) => {
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const { projects, isLoading } = useAgenticProjects();
  const { addProject } = useProjectsActions();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  // Off-canvas overlay open state — only meaningful on a narrow element; on wide
  // the sidebar is always static (CSS @container, see styles.css). Defaults closed.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In-element router for the imported sidebar links: a Link click → switch the
  // active project. Never touches the host page's URL. Also dismiss the overlay
  // (no-op on wide) so picking a chat on narrow closes the sidebar.
  const routerValue = useMemo(
    () => ({
      navigate: (href: string) => {
        const id = projectIdFromHref(href);

        if (id) {
          setActiveProjectId(id);
          setSidebarOpen(false);
        }
      },
    }),
    [],
  );

  // Esc closes the overlay when open (a11y; harmless on wide where it's static).
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  // Stale-active recovery: once the list has loaded, if the active project is no
  // longer present (deleted), fall back to the first remaining project (or none).
  useEffect(() => {
    if (isLoading) return;
    // Don't clear on an empty list: a failed/racing getProjectList (or a list
    // snapshot that predates bootChat's just-created project) reports
    // isLoading=false + projects=[] even though initialProjectId is valid — which
    // would unmount the booted chat and show "Select a chat". Only treat a
    // NON-empty list as authoritative for stale-active recovery.
    if (projects.length === 0) return;
    if (projects.some((p) => p.project_id === activeProjectId)) return;
    setActiveProjectId(projects[0]?.project_id ?? "");
  }, [projects, isLoading, activeProjectId]);

  const handleNewChat = useCallback(async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      // Use the app's default-name generator ("New Project N") so the chat is
      // AUTO-NAME-ELIGIBLE: the store only fires auto-rename for names that
      // isDefaultProjectName() recognizes (lifecycle.ts:180). A custom name like
      // "New chat" would silently disable the infer-name flow.
      const name = generateProjectName(projects, "New Project");
      const created = await addProject(name, defaultOrgDbId, true);

      if (created?.id) setActiveProjectId(created.id);
      setSidebarOpen(false);
    } finally {
      setIsCreatingChat(false);
    }
  }, [isCreatingChat, addProject, projects, defaultOrgDbId]);

  return (
    <WidgetRouterContext.Provider value={routerValue}>
      <div className="wc-workspace relative flex h-full w-full">
        {/* Hamburger toggle — narrow only (CSS hides it on wide via @container). */}
        <button
          type="button"
          data-wc-toggle
          aria-label="Open chats"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute left-2 top-2 z-10 items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Icon name="Menu" size="sm" />
        </button>

        {/* Backdrop — only when open; CSS hides it on wide. Click dismisses. */}
        {sidebarOpen && (
          <div data-wc-backdrop onClick={() => setSidebarOpen(false)} />
        )}

        <div data-wc-sidebar data-open={sidebarOpen}>
          <WidgetSidebar
            activeProjectId={activeProjectId}
            onNewChat={handleNewChat}
          />
        </div>
        <div className="relative min-w-0 flex-1">
          {activeProjectId ? (
            <AgenticChatProvider
              key={activeProjectId}
              projectId={activeProjectId}
            >
              <AgenticChatLayout />
            </AgenticChatProvider>
          ) : (
            <Centered>
              <div className="text-sm text-slate-500">
                Select a chat or start a new one.
              </div>
            </Centered>
          )}
        </div>
      </div>
      <Toaster position="top-right" closeButton />
    </WidgetRouterContext.Provider>
  );
};

export default WidgetWorkspace;
