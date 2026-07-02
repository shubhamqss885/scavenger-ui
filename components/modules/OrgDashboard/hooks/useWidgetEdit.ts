"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import {
  useProjectsData,
  useProjectsActions,
} from "@/lib/context/ProjectsContext";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useTranslation } from "@/lib/i18n/client";
import { generateProjectName } from "@/lib/utils/projectNameGenerator";
import type {
  DashboardDetail,
  DashboardWidget,
} from "@/lib/services/orgDashboardService";
import type { WidgetEditContext } from "@/components/modules/AgenticChat/types";

type ActiveEdit = { projectId: string; widget: DashboardWidget };

// Orchestrates editing a widget in a chat sheet: open (find-or-create the hidden
// linked chat), feed the edit context, apply live Update/Add, tear down.
export const useWidgetEdit = (
  dashboardId: string,
  setDashboard: Dispatch<SetStateAction<DashboardDetail | null>>,
) => {
  const { t } = useTranslation("dashboard");
  const { t: tHome } = useTranslation("home");
  const { projects } = useProjectsData();
  const { addProject, deleteProject } = useProjectsActions();
  const { getDbById } = useOrganizationDbData();

  const [editing, setEditing] = useState<ActiveEdit | null>(null);
  // Mirror of `editing` so handleEdit can guard duplicate edits without
  // depending on it (which would recreate onEdit on every sheet open).
  const editingRef = useRef<ActiveEdit | null>(null);
  // Synchronous guard against a double-click creating two chats (open is async).
  const startingEditRef = useRef(false);

  const setActiveEdit = useCallback((next: ActiveEdit | null) => {
    editingRef.current = next;
    setEditing(next);
  }, []);

  const handleEdit = useCallback(
    async (widget: DashboardWidget) => {
      if (editingRef.current?.widget.widget_id === widget.widget_id) return;
      if (startingEditRef.current) return;
      if (!getDbById(widget.orgdb_id)) {
        toast.error(t("orgDashboard.widget.datasourceUnavailable"));
        return;
      }
      startingEditRef.current = true;
      try {
        const name = generateProjectName(
          projects ?? [],
          tHome("page.newProject"),
        );
        // find-or-create the hidden chat for this widget (resumes if it exists).
        // Opens empty; the SQL rides the user's first message (see sendQuery).
        const project = await addProject(
          name,
          widget.orgdb_id,
          true,
          widget.widget_id,
        );

        if (!project) return; // failed — addProject surfaces its own UI
        // Arm the SQL context prefix. sendQuery only fires it on the first
        // message of an *empty* chat, so re-arming when resuming a chat that
        // already has history is harmless (it's discarded, not re-injected).
        sessionStorage.setItem(
          `project_${project.id}_editPrefix`,
          t("orgDashboard.widget.editContextSuffix", {
            title: widget.title,
            sql: widget.sql_query,
          }),
        );
        setActiveEdit({ projectId: project.id, widget });
      } catch (err) {
        console.error("Failed to start widget edit:", err);
        toast.error(t("orgDashboard.widget.editFailed"));
      } finally {
        startingEditRef.current = false;
      }
    },
    [getDbById, projects, addProject, t, tHome, setActiveEdit],
  );

  const closeEdit = useCallback(() => setActiveEdit(null), [setActiveEdit]);

  const deleteEditChat = useCallback(() => {
    const current = editingRef.current;

    if (current) deleteProject(current.projectId, { hidden: true });
    setActiveEdit(null);
  }, [deleteProject, setActiveEdit]);

  // Live dashboard updates from the sheet (no refetch); sheet stays open.
  const onWidgetUpdated = useCallback(
    (updated: DashboardWidget) => {
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              widgets: prev.widgets.map((w) =>
                w.widget_id === updated.widget_id ? updated : w,
              ),
            }
          : prev,
      );
    },
    [setDashboard],
  );

  const onWidgetAdded = useCallback(
    (added: DashboardWidget) => {
      // Summary count reconciles on the next fetch.
      setDashboard((prev) =>
        prev ? { ...prev, widgets: [...prev.widgets, added] } : prev,
      );
    },
    [setDashboard],
  );

  const editContext = useMemo<WidgetEditContext | null>(
    () =>
      editing
        ? {
            dashboardId,
            widgetId: editing.widget.widget_id,
            onWidgetUpdated,
            onWidgetAdded,
          }
        : null,
    [editing, dashboardId, onWidgetUpdated, onWidgetAdded],
  );

  return { editing, editContext, handleEdit, closeEdit, deleteEditChat };
};
