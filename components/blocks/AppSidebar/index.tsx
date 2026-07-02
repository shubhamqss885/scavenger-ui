"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { OrgDashboardsContext } from "@/lib/context/OrgDashboardContext";
import { useContextSelector } from "use-context-selector";
import {
  useProjectsData,
  useProjectsActions,
  getProjectActivityMap,
} from "@/lib/context/ProjectsContext";
import type { Project } from "@/lib/context/ProjectsContext/types";
import { useGroups } from "@/lib/context/GroupsContext";
import {
  useOrganizationDbData,
  useOrganizationDbActions,
} from "@/lib/context/OrganizationDbProvider";
import { useUIState } from "@/lib/context/UIStateContext";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react";
import { useTranslation } from "@/lib/i18n/client";
import { toUtcMs } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { SidebarLogo } from "./components/header/SidebarLogo";
import { SidebarFooterContent } from "./components/footer/SidebarFooterContent";
import { SidebarContentCollapsibleGroup } from "./components/shared/SidebarContentCollapsibleGroup";
import { SidebarLinkItem } from "./components/shared/SidebarLinkItem";
import {
  useProjectUnreadStatus,
  useStreamingProjectIds,
} from "@/components/modules/AgenticChat/chatSession";
import {
  CtaButton,
  SelectionBar,
  CollapsedCtaItem,
  CollapsedActionItem,
} from "./components/shared/SidebarActions";
import DashboardsSection from "./components/sections/DashboardsSection";
import GroupsSection from "./components/sections/GroupsSection";
import DatabasesSection from "./components/sections/DatabasesSection";
import { convertProjectToGroup } from "@/lib/services/projectService";

// --- Main Component ---

export const AppSidebar = () => {
  const { open, isMobile, setOpenMobile } = useSidebar();
  const {
    isFeatureEnabled,
    FEATURE_FLAGS,
    userOrganizationProfile,
    homeRoute,
  } = useOrgFeatures();
  const { isTopBarActive } = useUIState();
  const { projects } = useProjectsData();
  const { deleteProject, renameProject } = useProjectsActions();
  const { organizationDbs } = useOrganizationDbData();
  const { deleteDb, renameDb, setDefaultDatabase } = useOrganizationDbActions();
  const { groups, deleteGroup, createGroup, updateGroup, refreshGroups } =
    useGroups();
  const orgDashboards = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.orgDashboards ?? [],
  );
  const addOrgDashboard = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.addOrgDashboard,
  )!;
  const renameOrgDashboard = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.renameOrgDashboard,
  )!;
  const deleteOrgDashboard = useContextSelector(
    OrgDashboardsContext,
    (ctx) => ctx?.deleteOrgDashboard,
  )!;
  const pathname = usePathname();
  const router = useTransitionRouter();
  const { t } = useTranslation("home");
  const { t: tDash } = useTranslation("dashboard");

  const VIEW_DATABASES_ENABLED = isFeatureEnabled(
    FEATURE_FLAGS.VIEW_DATASOURCES,
  );
  const EDIT_DATASOURCES_ENABLED = isFeatureEnabled(
    FEATURE_FLAGS.EDIT_DATASOURCES,
  );
  const IS_DEMO_MODE = isFeatureEnabled(FEATURE_FLAGS.DEMO_MODE);
  const ORG_DASHBOARD_ENABLED = isFeatureEnabled(
    FEATURE_FLAGS.VIEW_ORG_DASHBOARDS,
  );
  const EDIT_DASHBOARDS_ENABLED = isFeatureEnabled(
    FEATURE_FLAGS.EDIT_ORG_DASHBOARDS,
  );
  const VIEW_CHATS_ENABLED = isFeatureEnabled(FEATURE_FLAGS.VIEW_CHATS);
  const ADD_DATASOURCE_ENABLED = isFeatureEnabled(
    FEATURE_FLAGS.ADD_DATASOURCE_BUTTON,
  );
  const VIEW_GROUPS_ENABLED = isFeatureEnabled(FEATURE_FLAGS.VIEW_GROUPS);

  const [createDashboardOpen, setCreateDashboardOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupOrgdbId, setNewGroupOrgdbId] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const streamingProjectIds = useStreamingProjectIds();
  const unreadProjectStatus = useProjectUnreadStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<
    "chats" | "data" | "dashboards" | "groups" | null
  >(null);
  // Filtering reads the deferred value so typing stays responsive on large
  // orgs; the input itself still shows `searchQuery` (instant feedback).
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activityKey, setActivityKey] = useState(0);
  const [clickedCta, setClickedCta] = useState<"chat" | "data" | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [renamingDbId, setRenamingDbId] = useState<string | null>(null);
  const [renameDbValue, setRenameDbValue] = useState("");
  const [renamingDashId, setRenamingDashId] = useState<string | null>(null);
  const [renameDashValue, setRenameDashValue] = useState("");
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameGroupValue, setRenameGroupValue] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [convertingProject, setConvertingProject] = useState<Project | null>(
    null,
  );
  const [convertGroupName, setConvertGroupName] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const isSelecting = selectedProjects.size > 0;

  // Listen for project activity updates
  useEffect(() => {
    const handler = () => setActivityKey((k) => k + 1);
    globalThis.window.addEventListener("projectActivityUpdated", handler);
    return () =>
      globalThis.window.removeEventListener("projectActivityUpdated", handler);
  }, []);

  // Auto-close the mobile slide-out sheet whenever the route changes so a tap
  // on a nav item doesn't leave the user staring at the open sidebar.
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  // --- Callbacks ---

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((s) => ({ ...s, [section]: !s[section] }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchScope(null);
  }, []);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);

      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedProjects(new Set()), []);

  const deleteSelectedProjects = useCallback(async () => {
    const projectIds = Array.from(selectedProjects);
    for (const projectId of projectIds) {
      await deleteProject(projectId);
    }
    clearSelection();
  }, [selectedProjects, deleteProject, clearSelection]);

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      deleteProject(projectId);
      if (pathname.startsWith(`/project/${projectId}`)) {
        router.push(homeRoute);
      }
    },
    [deleteProject, pathname, router, homeRoute],
  );

  const handleAddChat = useCallback(() => {
    router.push(homeRoute);
  }, [router, homeRoute]);

  const handleAddDataSource = useCallback(() => {
    router.push("/connectors");
  }, [router]);

  const handleCtaClick = useCallback(
    (type: "chat" | "data") => {
      setClickedCta(null);
      requestAnimationFrame(() => setClickedCta(type));
      window.setTimeout(() => setClickedCta(null), 300);
      if (type === "chat") handleAddChat();
      else handleAddDataSource();
    },
    [handleAddChat, handleAddDataSource],
  );

  const handleCreateDashboard = useCallback(async () => {
    const orgId = userOrganizationProfile?.current_organization;

    if (!newDashboardName.trim() || !orgId) return;
    setIsCreatingDashboard(true);
    try {
      const created = await addOrgDashboard(newDashboardName.trim(), orgId);

      if (created) {
        router.push(`/dashboard/${created.dashboard_id}`);
      }
      setNewDashboardName("");
      setCreateDashboardOpen(false);
    } finally {
      setIsCreatingDashboard(false);
    }
  }, [newDashboardName, userOrganizationProfile, addOrgDashboard, router]);

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim() || !newGroupOrgdbId) return;
    setIsCreatingGroup(true);
    try {
      const created = await createGroup({
        group_name: newGroupName.trim(),
        orgdb_id: newGroupOrgdbId,
      });

      if (created) {
        router.push(`/groups/${created.group_id}`);
      }
      setNewGroupName("");
      setNewGroupOrgdbId("");
      setCreateGroupOpen(false);
    } finally {
      setIsCreatingGroup(false);
    }
  }, [newGroupName, newGroupOrgdbId, createGroup, router]);

  const startConvertToGroup = useCallback((project: Project) => {
    setConvertingProject(project);
    setConvertGroupName(project.project_name || "");
  }, []);

  const handleConvertToGroup = useCallback(async () => {
    if (!convertingProject || !convertGroupName.trim()) return;

    if (!convertingProject.selected_org_db) {
      toast.error(
        t(
          "sidebar.projectActions.convertNoDatabase",
          "Project must have a database selected to convert to group",
        ),
      );
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertProjectToGroup({
        project_id: convertingProject.project_id,
        group_name: convertGroupName.trim(),
      });

      if (result.status_code === 200) {
        toast.success(
          t(
            "sidebar.projectActions.convertSuccess",
            "Project converted to group",
          ),
        );
        await refreshGroups();
        router.push(`/groups/${result.group.group_id}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to convert to group";
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
      setConvertingProject(null);
      setConvertGroupName("");
    }
  }, [convertingProject, convertGroupName, t, refreshGroups, router]);

  const cancelConvertToGroup = useCallback(() => {
    setConvertingProject(null);
    setConvertGroupName("");
  }, []);

  const startRenameDash = useCallback((id: string, currentName: string) => {
    setRenamingDashId(id);
    setRenameDashValue(currentName);
  }, []);

  const submitRenameDash = useCallback(
    async (dashId: string, currentName: string) => {
      const trimmed = renameDashValue.trim();

      if (!trimmed || trimmed === currentName) {
        setRenamingDashId(null);
        setRenameDashValue("");
        return;
      }
      try {
        await renameOrgDashboard(dashId, trimmed);
      } finally {
        setRenamingDashId(null);
        setRenameDashValue("");
      }
    },
    [renameDashValue, renameOrgDashboard],
  );

  const cancelRenameDash = useCallback(() => {
    setRenamingDashId(null);
    setRenameDashValue("");
  }, []);

  const handleDeleteDashboard = useCallback(
    async (dashId: string) => {
      await deleteOrgDashboard(dashId);
      if (pathname.startsWith(`/dashboard/${dashId}`)) {
        router.push(homeRoute);
      }
    },
    [deleteOrgDashboard, pathname, router, homeRoute],
  );

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setOriginalName(currentName);
  }, []);

  const submitRename = useCallback(
    async (projectId: string) => {
      const trimmed = renameValue.trim();

      if (!trimmed || trimmed === originalName) {
        setRenamingId(null);
        setRenameValue("");
        setOriginalName("");
        return;
      }

      try {
        await renameProject(projectId, trimmed);
      } finally {
        setRenamingId(null);
        setRenameValue("");
        setOriginalName("");
      }
    },
    [renameValue, originalName, renameProject],
  );

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
    setOriginalName("");
  }, []);

  const handleDeleteDb = useCallback(
    async (orgdbId: string) => {
      await deleteDb(orgdbId);
      if (pathname.startsWith(`/data-sources/${orgdbId}`)) {
        router.push(homeRoute);
      }
    },
    [deleteDb, pathname, router, homeRoute],
  );

  const confirmDeleteGroup = useCallback(async () => {
    if (!deletingGroupId) return;
    await deleteGroup(deletingGroupId);
    if (pathname.startsWith(`/groups/${deletingGroupId}`)) {
      router.push(homeRoute);
    }
    setDeletingGroupId(null);
  }, [deleteGroup, deletingGroupId, pathname, router, homeRoute]);

  const startRenameGroup = useCallback(
    (groupId: string, currentName: string) => {
      setRenamingGroupId(groupId);
      setRenameGroupValue(currentName);
    },
    [],
  );

  const submitRenameGroup = useCallback(
    async (groupId: string, currentName: string) => {
      const trimmed = renameGroupValue.trim();

      if (!trimmed || trimmed === currentName) {
        setRenamingGroupId(null);
        setRenameGroupValue("");
        return;
      }
      try {
        await updateGroup(groupId, { group_name: trimmed });
      } finally {
        setRenamingGroupId(null);
        setRenameGroupValue("");
      }
    },
    [renameGroupValue, updateGroup],
  );

  const cancelRenameGroup = useCallback(() => {
    setRenamingGroupId(null);
    setRenameGroupValue("");
  }, []);

  const startRenameDb = useCallback((dbId: string, currentName: string) => {
    setRenamingDbId(dbId);
    setRenameDbValue(currentName);
  }, []);

  const submitRenameDb = useCallback(
    (dbId: string, currentName: string) => {
      const trimmed = renameDbValue.trim();

      // Exit edit mode immediately; renameDb updates the name optimistically
      // and handles rollback + error toast on failure.
      setRenamingDbId(null);
      setRenameDbValue("");

      if (!trimmed || trimmed === currentName) return;

      void renameDb(dbId, trimmed).catch(() => {
        // Error is surfaced by renameDb (toast + rollback); nothing to do here.
      });
    },
    [renameDbValue, renameDb],
  );

  const cancelRenameDb = useCallback(() => {
    setRenamingDbId(null);
    setRenameDbValue("");
  }, []);

  const handleSearchClick = useCallback(
    (scope: "chats" | "data" | "dashboards" | "groups") => {
      setSearchScope(scope);
      // Auto-expand the section when searching
      setCollapsedSections((s) => ({ ...s, [scope]: false }));
    },
    [],
  );

  // --- Memoized data ---

  const sortedProjects = useMemo(() => {
    const activityMap = getProjectActivityMap();
    // Hidden widget edit chats never appear in the sidebar.
    return [...projects]
      .filter((p) => !p.linked_widget_id)
      .sort((a, b) => {
        const aTime = toUtcMs(activityMap[a.project_id] || a.created_at || 0);
        const bTime = toUtcMs(activityMap[b.project_id] || b.created_at || 0);
        return bTime - aTime;
      });
  }, [projects, activityKey]);

  const sortedDashboards = useMemo(
    () =>
      [...orgDashboards].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      ),
    [orgDashboards],
  );

  const sortedDatabases = useMemo(
    () =>
      [...organizationDbs].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (b.is_default && !a.is_default) return 1;
        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      }),
    [organizationDbs],
  );

  const filteredProjects = useMemo(() => {
    if (!deferredSearchQuery || searchScope !== "chats") return sortedProjects;
    const q = deferredSearchQuery.toLowerCase();
    return sortedProjects.filter((p) =>
      (p.project_name || "").toLowerCase().includes(q),
    );
  }, [sortedProjects, deferredSearchQuery, searchScope]);

  const filteredDashboards = useMemo(() => {
    if (!deferredSearchQuery || searchScope !== "dashboards")
      return sortedDashboards;
    const q = deferredSearchQuery.toLowerCase();
    return sortedDashboards.filter((d) =>
      (d.name || "").toLowerCase().includes(q),
    );
  }, [sortedDashboards, deferredSearchQuery, searchScope]);

  const filteredDatabases = useMemo(() => {
    if (!deferredSearchQuery || searchScope !== "data") return sortedDatabases;
    const q = deferredSearchQuery.toLowerCase();
    return sortedDatabases.filter((db) =>
      (db.display_name || db.orgdb_name_decrypted || "")
        .toLowerCase()
        .includes(q),
    );
  }, [sortedDatabases, deferredSearchQuery, searchScope]);

  const sortedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime(),
      ),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    if (!deferredSearchQuery || searchScope !== "groups") return sortedGroups;
    const q = deferredSearchQuery.toLowerCase();
    return sortedGroups.filter((g) =>
      (g.group_name || "").toLowerCase().includes(q),
    );
  }, [sortedGroups, deferredSearchQuery, searchScope]);

  // --- Collapsed Sidebar ---

  if (!open) {
    return (
      <>
        <Sidebar
          collapsible="icon"
          className={
            isTopBarActive
              ? "top-[calc(var(--top-bar-height))] h-[calc(100dvh-var(--top-bar-height))]"
              : ""
          }
        >
          <SidebarLogo />
          <SidebarContent className="py-3">
            <div className="flex flex-col items-center gap-1">
              {EDIT_DASHBOARDS_ENABLED && (
                <CollapsedActionItem
                  icon="PieChart"
                  tooltip={t("sidebar.dashboards.create", "Create a dashboard")}
                  onClick={() => setCreateDashboardOpen(true)}
                />
              )}
              {VIEW_CHATS_ENABLED && (
                <CollapsedCtaItem
                  href="/home"
                  icon="MessagesSquare"
                  tooltip={t("sidebar.chats.title", "Chats")}
                  ctaTooltip={t(
                    "sidebar.addProject.tooltips.addNew",
                    "New chat",
                  )}
                  isAnimating={clickedCta === "chat"}
                  onCtaClick={() => handleCtaClick("chat")}
                />
              )}
              {VIEW_DATABASES_ENABLED && (
                <CollapsedCtaItem
                  href="/data-sources"
                  icon="Database"
                  tooltip={t("sidebar.data.title", "Data")}
                  ctaTooltip={t(
                    "sidebar.dataSources.addNew.tooltip",
                    "Add data source",
                  )}
                  isAnimating={clickedCta === "data"}
                  onCtaClick={() => handleCtaClick("data")}
                />
              )}
            </div>
          </SidebarContent>
          <div className="flex-1" />
          <SidebarFooter className="border-t py-2">
            <SidebarFooterContent />
          </SidebarFooter>
        </Sidebar>
        <Dialog
          open={createDashboardOpen}
          onOpenChange={setCreateDashboardOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tDash("orgDashboard.list.createDialogTitle")}
              </DialogTitle>
            </DialogHeader>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                {tDash("orgDashboard.list.createStep1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                {tDash("orgDashboard.list.createStep2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                {tDash("orgDashboard.list.createStep3")}
              </li>
            </ol>
            <Input
              placeholder={tDash("orgDashboard.form.namePlaceholder")}
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateDashboard()}
              autoFocus
            />
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setCreateDashboardOpen(false)}
              >
                {tDash("orgDashboard.actions.cancel")}
              </Button>
              <Button
                onClick={handleCreateDashboard}
                disabled={!newDashboardName.trim() || isCreatingDashboard}
              >
                {tDash("orgDashboard.list.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // --- Expanded Sidebar ---

  return (
    <Sidebar
      collapsible="icon"
      className={
        isTopBarActive
          ? "top-[calc(var(--top-bar-height))] h-[calc(100dvh-var(--top-bar-height))]"
          : ""
      }
    >
      <SidebarLogo />
      <SidebarContent className="pt-2">
        {/* CTAs */}
        <div className="flex flex-col pb-1">
          {EDIT_DASHBOARDS_ENABLED && (
            <CtaButton
              label={t("sidebar.dashboards.create", "Create a dashboard")}
              isAnimating={false}
              onClick={() => setCreateDashboardOpen(true)}
            />
          )}
          {VIEW_CHATS_ENABLED && (
            <CtaButton
              label={t("sidebar.addProject.tooltips.addNew", "Start a chat")}
              isAnimating={clickedCta === "chat"}
              onClick={() => handleCtaClick("chat")}
            />
          )}
          {ADD_DATASOURCE_ENABLED && (
            <div data-tour="add-datasource-button">
              <CtaButton
                label={t("sidebar.dataSources.addNew.tooltip", "Add new data")}
                isAnimating={clickedCta === "data"}
                onClick={() => handleCtaClick("data")}
              />
            </div>
          )}
          {VIEW_GROUPS_ENABLED && (
            <CtaButton
              label={t("sidebar.groups.create", "Create a group")}
              isAnimating={false}
              onClick={() => setCreateGroupOpen(true)}
            />
          )}
        </div>

        {/* Dashboards */}
        {ORG_DASHBOARD_ENABLED && (
          <DashboardsSection
            dashboards={filteredDashboards}
            pathname={pathname}
            editEnabled={EDIT_DASHBOARDS_ENABLED}
            renamingDashId={renamingDashId}
            renameDashValue={renameDashValue}
            onRenameChange={setRenameDashValue}
            onRenameSubmit={submitRenameDash}
            onRenameCancel={cancelRenameDash}
            onRenameStart={startRenameDash}
            onDelete={handleDeleteDashboard}
            searchActive={searchScope === "dashboards"}
            searchQuery={searchScope === "dashboards" ? searchQuery : ""}
            onSearchChange={setSearchQuery}
            onSearchClick={handleSearchClick}
            onSearchClear={clearSearch}
            collapsed={collapsedSections["dashboards"] ?? false}
            onToggleCollapse={toggleSection}
          />
        )}

        {/* Chats */}
        {isSelecting && (
          <SelectionBar
            count={selectedProjects.size}
            onDelete={deleteSelectedProjects}
            onCancel={clearSelection}
          />
        )}
        {VIEW_CHATS_ENABLED && (
          <SidebarContentCollapsibleGroup
            title={t("sidebar.chats.title", "Chats")}
            icon="MessagesSquare"
            searchActive={searchScope === "chats"}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClick={() => handleSearchClick("chats")}
            onSearchClear={clearSearch}
            searchPlaceholder={t("sidebar.search.placeholder", "Search...")}
            collapsed={collapsedSections["chats"] ?? false}
            onToggleCollapse={() => toggleSection("chats")}
          >
            {filteredProjects.map((p) => {
              const unreadStatus = unreadProjectStatus.get(p.project_id);

              return (
                <SidebarLinkItem
                  key={p.project_id}
                  href={p.path || "#"}
                  label={p.project_name || "Untitled"}
                  active={pathname === p.path}
                  selected={selectedProjects.has(p.project_id)}
                  onSelect={() => toggleProjectSelection(p.project_id)}
                  selectionMode={isSelecting}
                  isRenaming={renamingId === p.project_id}
                  renameValue={renamingId === p.project_id ? renameValue : ""}
                  onRenameChange={setRenameValue}
                  onRenameSubmit={() => submitRename(p.project_id)}
                  onRenameCancel={cancelRename}
                  streaming={streamingProjectIds.has(p.project_id)}
                  streamingLabel={t("sidebar.streamingIndicator")}
                  unreadStatus={unreadStatus}
                  unreadLabel={
                    unreadStatus &&
                    t(
                      unreadStatus === "error"
                        ? "sidebar.unreadError"
                        : "sidebar.unreadComplete",
                    )
                  }
                  actions={
                    IS_DEMO_MODE
                      ? undefined
                      : [
                          {
                            label: t("sidebar.projectActions.files"),
                            onClick: () => {
                              sessionStorage.setItem(
                                `project_${p.project_id}_openFilesPanel`,
                                "true",
                              );
                              router.push(p.path || `/project/${p.project_id}`);
                            },
                          },
                          {
                            label: t("sidebar.projectActions.rename"),
                            onClick: () =>
                              startRename(p.project_id, p.project_name || ""),
                          },
                          ...(VIEW_GROUPS_ENABLED && p.selected_org_db
                            ? [
                                {
                                  label: t(
                                    "sidebar.projectActions.convertToGroup",
                                    "Convert to group",
                                  ),
                                  onClick: () => startConvertToGroup(p),
                                },
                              ]
                            : []),
                          {
                            label: t("sidebar.projectActions.delete"),
                            onClick: () => handleDeleteProject(p.project_id),
                            variant: "destructive" as const,
                          },
                        ]
                  }
                />
              );
            })}
          </SidebarContentCollapsibleGroup>
        )}

        {/* Groups */}
        {VIEW_GROUPS_ENABLED && (
          <GroupsSection
            groups={filteredGroups}
            pathname={pathname}
            renamingGroupId={renamingGroupId}
            renameGroupValue={renameGroupValue}
            onRenameChange={setRenameGroupValue}
            onRenameSubmit={submitRenameGroup}
            onRenameCancel={cancelRenameGroup}
            onRenameStart={startRenameGroup}
            onDelete={setDeletingGroupId}
            searchActive={searchScope === "groups"}
            searchQuery={searchScope === "groups" ? searchQuery : ""}
            onSearchChange={setSearchQuery}
            onSearchClick={handleSearchClick}
            onSearchClear={clearSearch}
            collapsed={collapsedSections["groups"] ?? false}
            onToggleCollapse={toggleSection}
          />
        )}

        {/* Data */}
        {VIEW_DATABASES_ENABLED && (
          <DatabasesSection
            databases={filteredDatabases}
            pathname={pathname}
            demoMode={IS_DEMO_MODE}
            editEnabled={EDIT_DATASOURCES_ENABLED}
            renamingDbId={renamingDbId}
            renameDbValue={renameDbValue}
            onRenameChange={setRenameDbValue}
            onRenameSubmit={submitRenameDb}
            onRenameCancel={cancelRenameDb}
            onRenameStart={startRenameDb}
            onSetDefault={setDefaultDatabase}
            onDelete={handleDeleteDb}
            searchActive={searchScope === "data"}
            searchQuery={searchScope === "data" ? searchQuery : ""}
            onSearchChange={setSearchQuery}
            onSearchClick={handleSearchClick}
            onSearchClear={clearSearch}
            collapsed={collapsedSections["data"] ?? false}
            onToggleCollapse={toggleSection}
          />
        )}
      </SidebarContent>

      <div className="flex-1" />
      <div className="border-t" />

      <SidebarFooter className="p-0">
        <SidebarFooterContent />
      </SidebarFooter>

      <Dialog open={createDashboardOpen} onOpenChange={setCreateDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tDash("orgDashboard.list.createDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              {tDash("orgDashboard.list.createStep1")}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              {tDash("orgDashboard.list.createStep2")}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </span>
              {tDash("orgDashboard.list.createStep3")}
            </li>
          </ol>
          <Input
            placeholder={tDash("orgDashboard.form.namePlaceholder")}
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateDashboard()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDashboardOpen(false)}
            >
              {tDash("orgDashboard.actions.cancel")}
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={!newDashboardName.trim() || isCreatingDashboard}
            >
              {tDash("orgDashboard.list.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("sidebar.groups.createDialogTitle", "Create a group")}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Beta
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder={t("sidebar.groups.namePlaceholder", "Group name")}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
            />
            <Select value={newGroupOrgdbId} onValueChange={setNewGroupOrgdbId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    "sidebar.groups.selectDatabase",
                    "Select a database",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {organizationDbs.map((db) => (
                  <SelectItem key={db.orgdb_id} value={db.orgdb_id}>
                    {db.display_name || db.orgdb_name_decrypted || "Database"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateGroupOpen(false);
                setNewGroupName("");
                setNewGroupOrgdbId("");
              }}
            >
              {t("sidebar.groups.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={
                !newGroupName.trim() || !newGroupOrgdbId || isCreatingGroup
              }
            >
              {t("sidebar.groups.create", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog
        open={!!deletingGroupId}
        onOpenChange={(open) => !open && setDeletingGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("sidebar.groups.deleteTitle", "Delete Group")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "sidebar.groups.deleteDescription",
                "Are you sure you want to delete this group? This action cannot be undone and all messages will be lost.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Project to Group */}
      <Dialog
        open={!!convertingProject}
        onOpenChange={(open) => !open && cancelConvertToGroup()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t(
                "sidebar.projectActions.convertToGroupTitle",
                "Convert to Group",
              )}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                Beta
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(
              "sidebar.projectActions.convertToGroupDescription",
              "Convert this chat to a group so you can invite others to collaborate. The chat history will be preserved.",
            )}
          </p>
          <Input
            placeholder={t("sidebar.groups.namePlaceholder", "Group name")}
            value={convertGroupName}
            onChange={(e) => setConvertGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConvertToGroup()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={cancelConvertToGroup}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleConvertToGroup}
              disabled={!convertGroupName.trim() || isConverting}
            >
              {isConverting
                ? t("common.converting", "Converting...")
                : t("sidebar.projectActions.convert", "Convert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
};
