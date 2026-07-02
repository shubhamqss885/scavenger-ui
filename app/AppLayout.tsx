"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/blocks/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/blocks/TopBar";
import { GlobalShortcuts } from "@/components/blocks/GlobalShortcuts";
import { SettingsModal } from "@/components/blocks/SettingsModal";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import { PaymentUpdateDialog } from "@/components/blocks/PaymentUpdateDialog";
import OnboardingTour from "@/components/modules/OnboardingTour";
import { chatSessionStore } from "@/components/modules/AgenticChat/chatSession";
import { GroupsProvider } from "@/lib/context/GroupsContext";

export const AppLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathName = usePathname();
  const { showSettings, activeTab, handleClose, handleTabChange } =
    useSettingsModal();

  // Close all open agentic chat sockets on tab close / hard navigation.
  // Logout in this app is also a full page navigation (/api/auth/logout),
  // so this covers both. Best-effort — browsers may not always fire it.
  useEffect(() => {
    const handler = () => {
      chatSessionStore.teardownAll();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  const hideSidebar =
    pathName.includes("/onboarding") || pathName.includes("/verify");
  const isProjectPage = pathName.includes("/project");
  const isDataSourcePage = pathName.includes("/data-sources");
  const isConnectorsPage = pathName.includes("/connectors");
  const isDashboardPage = pathName.includes("/dashboard");
  const isGroupsPage = pathName.includes("/groups");
  const isFullWidth =
    isDataSourcePage ||
    isProjectPage ||
    isConnectorsPage ||
    isDashboardPage ||
    isGroupsPage;

  return (
    <div className="fixed left-0 top-0 h-dvh w-full">
      <TopBar />
      <GroupsProvider>
        <SidebarProvider>
          {!hideSidebar && <AppSidebar />}
          <SidebarInset>
            <div
              className={`${
                isFullWidth ? "" : "max-w-7xl"
              } mx-auto flex max-h-dvh w-full min-w-0 flex-1 flex-col`}
            >
              {children}
            </div>
          </SidebarInset>
          {/* Onboarding tour for new users */}
          <OnboardingTour />
        </SidebarProvider>
      </GroupsProvider>
      <GlobalShortcuts />
      {showSettings && (
        // activeTab / onTabChange are unused by SettingsModal right now (tabs
        // were removed). Kept wired up so the plumbing can be reinstated when
        // paywall is re-enabled.
        <SettingsModal
          isOpen={showSettings}
          onClose={handleClose}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
      <PaymentUpdateDialog />
    </div>
  );
};
