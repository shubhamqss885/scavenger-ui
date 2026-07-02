"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createContext, useContext } from "use-context-selector";
import { useOrgFeatures } from "../OrgFeatureContext";
import { toast } from "sonner";
import {
  listDashboards,
  listMyDashboards,
  createDashboard,
  deleteDashboard,
  renameDashboard,
  addWidget,
  type AddWidgetPayload,
  type DashboardSummary,
} from "@/lib/services/orgDashboardService";
import { useUserContext } from "@/lib/context/UserDataContext";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

type OrgDashboardsContextState = Readonly<{
  orgDashboards: DashboardSummary[];
  isLoading: boolean;
  fetchOrgDashboards: () => Promise<void>;
  addOrgDashboard: (
    name: string,
    orgId: string,
  ) => Promise<DashboardSummary | null>;
  renameOrgDashboard: (id: string, name: string) => Promise<void>;
  deleteOrgDashboard: (id: string) => Promise<void>;
  pinToDashboard: (
    dashboardId: string,
    payload: AddWidgetPayload,
  ) => Promise<boolean>;
  decrementWidgetCount: (dashboardId: string) => void;
}>;

export const OrgDashboardsContext = createContext<
  OrgDashboardsContextState | undefined
>(undefined);

export const useOrgDashboardsContext = () => {
  const context = useContext(OrgDashboardsContext);

  if (!context) {
    throw new Error("useOrgDashboardsContext must be used within a provider");
  }
  return context;
};

export const OrgDashboardsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userOrganizationProfile } = useOrgFeatures();
  const { userProfile } = useUserContext();
  const { t } = useTranslation("dashboard");
  const [orgDashboards, setOrgDashboards] = useState<DashboardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const orgId = userOrganizationProfile?.current_organization;
  const userRole = userProfile?.user_role_name;
  const isViewerRole = userRole === "org-viewer";

  // Reset the first-load flag whenever the org changes — switching orgs
  // should re-show the loading state since the prior org's data is stale.
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [orgId]);

  const fetchOrgDashboards = useCallback(async () => {
    if (!orgId) return;
    try {
      if (!hasFetchedRef.current) setIsLoading(true);
      // org-viewer users only see dashboards they have explicit access to
      const dashboards = isViewerRole
        ? await listMyDashboards()
        : await listDashboards(orgId);
      setOrgDashboards(dashboards);
      hasFetchedRef.current = true;
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error("Error fetching dashboards:", err?.response?.data || err);
      }
      setOrgDashboards([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, isViewerRole]);

  useEffect(() => {
    if (orgId) {
      fetchOrgDashboards();
    }
  }, [orgId, fetchOrgDashboards]);

  const addOrgDashboard = useCallback(
    async (name: string, orgId: string): Promise<DashboardSummary | null> => {
      try {
        const created = await createDashboard(name, orgId);
        const newDashboard: DashboardSummary = {
          dashboard_id: created.dashboard_id,
          name: created.name,
          widget_count: 0,
          created_at: new Date().toISOString(),
        };
        setOrgDashboards((prev) => [...prev, newDashboard]);
        toast.success(t("orgDashboard.context.success.dashboardCreated"));
        return newDashboard;
      } catch (err: any) {
        console.error("Error creating dashboard:", err?.response?.data || err);
        toast.error(t("orgDashboard.context.error.createDashboardFailed"));
        return null;
      }
    },
    [],
  );

  const renameOrgDashboard = useCallback(async (id: string, name: string) => {
    try {
      await renameDashboard(id, name);
      setOrgDashboards((prev) =>
        prev.map((d) => (d.dashboard_id === id ? { ...d, name } : d)),
      );
    } catch (err: any) {
      console.error("Error renaming dashboard:", err?.response?.data || err);
      toast.error(t("orgDashboard.context.error.updateDashboardFailed"));
    }
  }, []);

  const deleteOrgDashboard = useCallback(async (id: string) => {
    try {
      await deleteDashboard(id);
      setOrgDashboards((prev) => prev.filter((d) => d.dashboard_id !== id));
      toast.success(t("orgDashboard.context.success.dashboardDeleted"));
    } catch (err: any) {
      console.error("Error deleting dashboard:", err?.response?.data || err);
      toast.error(t("orgDashboard.context.error.deleteDashboardFailed"));
    }
  }, []);

  const pinToDashboard = useCallback(
    async (
      dashboardId: string,
      payload: AddWidgetPayload,
    ): Promise<boolean> => {
      try {
        await addWidget(dashboardId, payload);
        toast.success(
          <span>
            {t("orgDashboard.pin.success")}{" "}
            <Link
              href={`/dashboard/${dashboardId}`}
              className="font-medium text-primary underline"
            >
              {t("orgDashboard.pin.view")}
            </Link>
          </span>,
        );
        // Update widget count
        setOrgDashboards((prev) =>
          prev.map((d) =>
            d.dashboard_id === dashboardId
              ? { ...d, widget_count: d.widget_count + 1 }
              : d,
          ),
        );
        return true;
      } catch (err: any) {
        console.error(
          "Error pinning to dashboard:",
          err?.response?.data || err,
        );
        toast.error(t("orgDashboard.pin.failed"));
        return false;
      }
    },
    [],
  );

  const decrementWidgetCount = useCallback((dashboardId: string) => {
    setOrgDashboards((prev) =>
      prev.map((d) =>
        d.dashboard_id === dashboardId
          ? { ...d, widget_count: Math.max(0, d.widget_count - 1) }
          : d,
      ),
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      orgDashboards,
      isLoading,
      fetchOrgDashboards,
      addOrgDashboard,
      renameOrgDashboard,
      deleteOrgDashboard,
      pinToDashboard,
      decrementWidgetCount,
    }),
    [
      orgDashboards,
      isLoading,
      fetchOrgDashboards,
      addOrgDashboard,
      renameOrgDashboard,
      deleteOrgDashboard,
      pinToDashboard,
      decrementWidgetCount,
    ],
  );

  return (
    <OrgDashboardsContext.Provider value={contextValue}>
      {children}
    </OrgDashboardsContext.Provider>
  );
};
