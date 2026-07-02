"use client";

import {
  getProjectList,
  updateProject,
  deleteproject,
  addNewProject,
  pinUnpinProject,
  updateProjectOrgDB,
} from "@/lib/services/projectService";
import { chatSessionStore } from "@/components/modules/AgenticChat/chatSession";

// localStorage key for project activity timestamps
const PROJECT_ACTIVITY_KEY = "project_last_activity";

// Get activity map from localStorage
export const getProjectActivityMap = (): Record<string, string> => {
  if (typeof globalThis.window === "undefined") return {};
  try {
    const stored = localStorage.getItem(PROJECT_ACTIVITY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save activity timestamp for a project
export const saveProjectActivity = (projectId: string) => {
  if (typeof globalThis.window === "undefined") return;
  try {
    const map = getProjectActivityMap();
    map[projectId] = new Date().toISOString();
    localStorage.setItem(PROJECT_ACTIVITY_KEY, JSON.stringify(map));
    // Dispatch event to notify sidebar
    globalThis.window.dispatchEvent(new CustomEvent("projectActivityUpdated"));
  } catch {
    // Ignore localStorage errors
  }
};

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOrgFeatures } from "../OrgFeatureContext";
import { toast } from "sonner";
import { INewProjectResponse, IProjectDetails, Project } from "./types";
import { useDashboardStats } from "../DashboardStatsProvider";
import { useTranslation } from "@/lib/i18n/client";

// Split into Data and Actions types
type ProjectsDataState = {
  projects: Project[];
  isLoading: boolean;
  unseenPinnedmsg: boolean;
};

type ProjectsActionsState = {
  setProjects: (projects: Project[]) => void;
  addProject: (
    project_name: string,
    selected_org_db: string | null,
    is_agentic?: boolean,
    linkedWidgetId?: string,
  ) => Promise<IProjectDetails | null>;
  renameProject: (
    projectId: string,
    newName: string,
    newDatabaseId?: string,
  ) => Promise<void>;
  // State-only rename — no API call, no toast. Used by the auto-naming flow
  // where the BE has already persisted the name via /agentic/infer_name.
  updateProjectNameLocal: (projectId: string, newName: string) => void;
  updateProjectDatabase: (
    projectId: string,
    databaseId: string,
  ) => Promise<void>;
  deleteProject: (projectId: string, options?: { hidden?: boolean }) => void;
  pinProject: (projectId: string, is_pinned: boolean) => Promise<void>;
  unpinProject: (projectId: string, is_pinned: boolean) => Promise<void>;
  getProjectDetailById: (projectId: string) => Project | undefined;
  setLoading: (loading: boolean) => void;
  setunseenPinnedmsgs: (pinstatus: any, projectId: any) => void;
};

// Two separate contexts
const ProjectsDataContext = createContext<ProjectsDataState | undefined>(
  undefined,
);
const ProjectsActionsContext = createContext<ProjectsActionsState | undefined>(
  undefined,
);

// Hook for data (triggers re-render when data changes)
export const useProjectsData = () => {
  const context = useContext(ProjectsDataContext);

  if (!context) {
    throw new Error("useProjectsData must be used within a ProjectsProvider");
  }
  return context;
};

// Hook for actions (NEVER triggers re-render - actions are stable)
export const useProjectsActions = () => {
  const context = useContext(ProjectsActionsContext);

  if (!context) {
    throw new Error(
      "useProjectsActions must be used within a ProjectsProvider",
    );
  }
  return context;
};

export const ProjectsProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { t } = useTranslation("project");
  const {
    userOrganizationProfile,
    isFeatureEnabled,
    FEATURE_FLAGS,
    isLoading: isOrgFeaturesLoading,
  } = useOrgFeatures();
  const canViewChats = isFeatureEnabled(FEATURE_FLAGS.VIEW_CHATS);
  const { incrementProject, decrementProject, enforceLimit } =
    useDashboardStats();
  const [projects, setProjects] = useState<Project[]>([]);

  // Ref for stable getProjectDetailById function
  const projectsRef = useRef<Project[]>([]);
  projectsRef.current = projects; // Sync on every render

  const [isLoading, setLoading] = useState(true);
  const [unseenPinnedmsg, setunseenPinnedmsg] = useState(false);
  const hasFetchedRef = useRef(false);
  const orgId = userOrganizationProfile?.current_organization;

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [orgId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!hasFetchedRef.current) setLoading(true);
        const response = await getProjectList();

        if (response.status_code !== 200) {
          throw new Error(response.message);
        }
        const updatedProjects = response.project_detail.map(
          (project: Project) => ({
            ...project,
            path: project.is_agentic
              ? `/project/${project.project_id}/agent`
              : `/project/${project.project_id}`,
          }),
        );
        setProjects(updatedProjects);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOrgFeaturesLoading) return;

    // Roles without chat access (org-viewer) get a 403 from list_projects.
    // Skip the call entirely instead of firing a request that always fails.
    if (!canViewChats) {
      setProjects([]);
      setLoading(false);
      hasFetchedRef.current = false;
      return;
    }
    if (orgId) {
      fetchProjects();
    }
  }, [orgId, canViewChats, isOrgFeaturesLoading]);

  const addProject = useCallback(
    async (
      project_name: string,
      selected_org_db: string | null,
      is_agentic: boolean = false,
      linkedWidgetId?: string,
    ) => {
      // A widget edit chat is hidden + quota-exempt: skip limit/increment/activity.
      // Still added to `projects` (tagged) so the chat resolves its details; the
      // sidebar filters tagged ones out.
      const isWidgetEdit = !!linkedWidgetId;
      try {
        if (!isWidgetEdit && enforceLimit("project")) {
          return null;
        }

        const response: INewProjectResponse = await addNewProject(
          project_name,
          selected_org_db,
          is_agentic,
          linkedWidgetId,
        );

        if (response.data.status_code === 200) {
          if (!isWidgetEdit) incrementProject();
        } else {
          toast.error(
            String(
              t(
                `serverMessages.${response.data.message}`,
                response.data.message,
              ),
            ),
          );
        }

        const { id, ...rest } = response.data.project_detail;
        const backendIsAgentic = Boolean(
          response.data.project_detail.is_agentic,
        );

        const newProject = {
          ...rest,
          path: backendIsAgentic ? `/project/${id}/agent` : `/project/${id}`,
          project_id: id,
          is_agentic: backendIsAgentic,
          linked_widget_id: linkedWidgetId ?? null,
        };

        if (!isWidgetEdit) saveProjectActivity(id);
        // Dedupe by id so resuming an existing edit chat doesn't double-insert.
        setProjects((prevProjects) => [
          newProject,
          ...prevProjects.filter((p) => p.project_id !== id),
        ]);

        return response.data.project_detail;
      } catch (error) {
        console.error("Failed to add new project:", error);
        toast.error(t("actions.addFailed"));
        return null;
      }
    },
    [enforceLimit, incrementProject, t],
  );

  const renameProject = useCallback(
    async (projectId: string, newName: string) => {
      try {
        const response = await updateProject(projectId, newName);

        if (response.data.status_code === 200) {
          setProjects((prevProjects) =>
            prevProjects.map((project) =>
              project.project_id === projectId
                ? { ...project, project_name: newName }
                : project,
            ),
          );
          toast.success(t("actions.renameSuccess"));
          return response.data;
        } else {
          toast.error(
            String(
              t(
                `serverMessages.${response.data?.message}`,
                response.data?.message,
              ),
            ),
          );
        }
      } catch (error) {
        toast.error(t("actions.renameFailed"));
        console.error("Failed to update project name:", error);
        throw error;
      }
    },
    [t],
  );

  // State-only rename for the auto-name flow — BE has already persisted.
  // Distinct from `renameProject` (which hits the rename endpoint + toasts).
  const updateProjectNameLocal = useCallback(
    (projectId: string, newName: string) => {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === projectId
            ? { ...project, project_name: newName }
            : project,
        ),
      );
    },
    [],
  );

  const deleteProject = useCallback(
    async (projectId: string, options?: { hidden?: boolean }) => {
      // Hidden edit chats never counted/listed, so skip the decrement + toast.
      const hidden = options?.hidden;
      try {
        const response = await deleteproject(projectId);

        if (response.status_code === 200) {
          if (!hidden) {
            decrementProject();
            toast.success(
              String(t(`serverMessages.${response.message}`, response.message)),
            );
          }
        } else {
          toast.error(
            String(t(`serverMessages.${response.message}`, response.message)),
          );
        }
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.project_id !== projectId),
        );
        // Close any in-flight agentic chat session for this project so the
        // socket is released and store memory doesn't leak.
        chatSessionStore.teardown(projectId);
      } catch (error) {
        console.error("Failed to delete project:", error);
        toast.error(t("actions.deleteFailed"));
      }
    },
    [decrementProject, t],
  );

  const pinProject = useCallback(
    async (projectId: string, is_pinned: boolean) => {
      try {
        const response = await pinUnpinProject(projectId, is_pinned);

        if (response?.status_code === 200) {
          toast.success(t("actions.pinSuccess"));
        } else {
          toast.error(
            String(t(`serverMessages.${response?.message}`, response?.message)),
          );
        }
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? { ...project, is_pinned: true }
              : project,
          ),
        );
      } catch (error) {
        console.error("Failed to pin project:", error);
        toast.error(t("actions.pinFailed"));
      }
    },
    [t],
  );

  const unpinProject = useCallback(
    async (projectId: string, is_pinned: boolean) => {
      try {
        const response = await pinUnpinProject(projectId, is_pinned);

        if (response?.status_code === 200) {
          toast.success(t("actions.unpinSuccess"));
        } else {
          toast.error(
            String(t(`serverMessages.${response?.message}`, response?.message)),
          );
        }

        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? { ...project, is_pinned: false }
              : project,
          ),
        );
      } catch (error) {
        console.error("Failed to unpin project:", error);
        toast.error(t("actions.unpinFailed"));
      }
    },
    [t],
  );

  // Stable function - reads from ref, NEVER recreates
  const getProjectDetailById = useCallback(
    (projectId: string) => {
      return projectsRef.current.find(
        (project) => project.project_id === projectId,
      );
    },
    [], // Empty deps - stable forever
  );

  const setunseenPinnedmsgs = useCallback((pinstatus: any, projectId: any) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.project_id === projectId
          ? { ...project, unseenPinnedmsg: pinstatus }
          : project,
      ),
    );
  }, []);

  const updateProjectDatabase = useCallback(
    async (projectId: string, databaseId: string) => {
      try {
        const dbResponse = await updateProjectOrgDB(projectId, databaseId);

        if (dbResponse.status_code === 200) {
          setProjects((prevProjects) =>
            prevProjects.map((project) =>
              project.project_id === projectId
                ? { ...project, selected_org_db: databaseId }
                : project,
            ),
          );
          toast.success(t("database.updateSuccess"));
          return dbResponse;
        } else {
          toast.error(t("database.updateFailed"));
        }
      } catch (error) {
        console.error("Failed to update project database:", error);
        toast.error("Failed to update database");
        throw error;
      }
    },
    [t],
  );

  // Data value - changes when data changes
  const dataValue = useMemo(
    () => ({
      projects,
      isLoading,
      unseenPinnedmsg,
    }),
    [projects, isLoading, unseenPinnedmsg],
  );

  // Actions value - stable, NEVER changes (all functions are useCallback-wrapped with empty or stable deps)
  const actionsValue = useMemo(
    () => ({
      setProjects,
      addProject,
      renameProject,
      updateProjectNameLocal,
      updateProjectDatabase,
      deleteProject,
      pinProject,
      unpinProject,
      getProjectDetailById,
      setLoading,
      setunseenPinnedmsgs,
    }),
    [
      addProject,
      renameProject,
      updateProjectNameLocal,
      updateProjectDatabase,
      deleteProject,
      pinProject,
      unpinProject,
      getProjectDetailById,
      setunseenPinnedmsgs,
    ],
  );

  return (
    <ProjectsActionsContext.Provider value={actionsValue}>
      <ProjectsDataContext.Provider value={dataValue}>
        {children}
      </ProjectsDataContext.Provider>
    </ProjectsActionsContext.Provider>
  );
};
