"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { TOP_BAR_HEIGHT } from "@/lib/constants";

type TopBarMode = "maintenance" | "demo" | null;

interface UIStateContextType {
  // Top Bar
  isTopBarActive: boolean; // Computed value that includes feature flag check
  topBarMode: TopBarMode; // Which bar to show: maintenance, demo, or null
  maintenanceFromTime: string | null; // ISO datetime when maintenance starts
  maintenanceUntilTime: string | null; // ISO datetime when maintenance ends
  toggleTopBar: () => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider = ({ children }: { children: ReactNode }) => {
  // Top Bar State (internal)
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);

  // Get feature flags from OrgFeatureContext
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isTopBarFeatureEnabled = isFeatureEnabled(FEATURE_FLAGS.TOP_BAR);

  // Maintenance banner state
  // FROM is for display only, UNTIL controls when banner hides
  const maintenanceFrom = process.env.NEXT_PUBLIC_MAINTENANCE_FROM || null;
  const maintenanceUntil = process.env.NEXT_PUBLIC_MAINTENANCE_UNTIL || null;
  const isMaintenanceScheduled = useMemo(() => {
    if (!maintenanceUntil) return false;
    return new Date() < new Date(maintenanceUntil);
  }, [maintenanceUntil]);

  // Priority: maintenance > demo
  const topBarMode: TopBarMode = useMemo(() => {
    if (isMaintenanceScheduled) return "maintenance";
    if (isTopBarFeatureEnabled && isTopBarVisible) return "demo";
    return null;
  }, [isMaintenanceScheduled, isTopBarFeatureEnabled, isTopBarVisible]);

  const isTopBarActive = topBarMode !== null;

  const toggleTopBar = useCallback(() => {
    setIsTopBarVisible((prev) => !prev);
  }, []);

  // Handle top bar CSS variables based on isTopBarActive
  useEffect(() => {
    document.body.dataset.topBar = isTopBarActive ? "visible" : "hidden";
    document.documentElement.style.setProperty(
      "--top-bar-height",
      isTopBarActive ? `${TOP_BAR_HEIGHT}px` : "0px",
    );
  }, [isTopBarActive]);

  const contextValue = useMemo(
    () => ({
      isTopBarActive,
      topBarMode,
      maintenanceFromTime: maintenanceFrom,
      maintenanceUntilTime: maintenanceUntil,
      toggleTopBar,
    }),
    [
      isTopBarActive,
      topBarMode,
      maintenanceFrom,
      maintenanceUntil,
      toggleTopBar,
    ],
  );

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);

  if (context === undefined) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
};
