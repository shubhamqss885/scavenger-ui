"use client";

import { memo } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { SidebarContentCollapsibleGroup } from "../shared/SidebarContentCollapsibleGroup";
import { SidebarLinkItem } from "../shared/SidebarLinkItem";

// Minimal structural type — the real DashboardSummary is a superset and is
// assignable to this. Only the fields the row needs are declared.
type DashboardItem = Readonly<{
  dashboard_id: string;
  name: string;
}>;

type DashboardsSectionProps = Readonly<{
  dashboards: readonly DashboardItem[];
  pathname: string;
  editEnabled: boolean;
  renamingDashId: string | null;
  renameDashValue: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: (dashId: string, currentName: string) => void;
  onRenameCancel: () => void;
  onRenameStart: (dashId: string, currentName: string) => void;
  onDelete: (dashId: string) => void;
  // Search + collapse (parent-owned, stable)
  searchActive: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchClick: (scope: "dashboards") => void;
  onSearchClear: () => void;
  collapsed: boolean;
  onToggleCollapse: (section: "dashboards") => void;
}>;

// Memoized so unrelated sidebar state changes (chat streaming, other sections'
// rename/search) don't re-render or re-map this section.
const DashboardsSection = memo(function DashboardsSection({
  dashboards,
  pathname,
  editEnabled,
  renamingDashId,
  renameDashValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onRenameStart,
  onDelete,
  searchActive,
  searchQuery,
  onSearchChange,
  onSearchClick,
  onSearchClear,
  collapsed,
  onToggleCollapse,
}: DashboardsSectionProps) {
  const { t } = useTranslation("home");

  return (
    <SidebarContentCollapsibleGroup
      title={t("sidebar.dashboards.title", "Dashboards")}
      icon="PieChart"
      searchActive={searchActive}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onSearchClick={() => onSearchClick("dashboards")}
      onSearchClear={onSearchClear}
      searchPlaceholder={t("sidebar.search.placeholder", "Search...")}
      collapsed={collapsed}
      onToggleCollapse={() => onToggleCollapse("dashboards")}
    >
      {dashboards.map((d) => (
        <SidebarLinkItem
          key={d.dashboard_id}
          href={`/dashboard/${d.dashboard_id}`}
          label={d.name}
          active={pathname === `/dashboard/${d.dashboard_id}`}
          isRenaming={renamingDashId === d.dashboard_id}
          renameValue={renamingDashId === d.dashboard_id ? renameDashValue : ""}
          onRenameChange={onRenameChange}
          onRenameSubmit={() => onRenameSubmit(d.dashboard_id, d.name)}
          onRenameCancel={onRenameCancel}
          actions={
            editEnabled
              ? [
                  {
                    label: t("sidebar.projectActions.rename", "Rename"),
                    onClick: () => onRenameStart(d.dashboard_id, d.name),
                  },
                  {
                    label: t("sidebar.projectActions.delete", "Delete"),
                    onClick: () => onDelete(d.dashboard_id),
                    variant: "destructive" as const,
                  },
                ]
              : undefined
          }
        />
      ))}
    </SidebarContentCollapsibleGroup>
  );
});

export default DashboardsSection;
