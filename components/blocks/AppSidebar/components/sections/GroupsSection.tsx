"use client";

import { memo } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { Badge } from "@/components/ui/badge";
import { SidebarContentCollapsibleGroup } from "../shared/SidebarContentCollapsibleGroup";
import { SidebarLinkItem } from "../shared/SidebarLinkItem";

// Minimal structural type — the real group object is a superset.
type GroupItem = Readonly<{
  group_id: string;
  group_name: string;
  user_role?: string;
}>;

type GroupsSectionProps = Readonly<{
  groups: readonly GroupItem[];
  pathname: string;
  renamingGroupId: string | null;
  renameGroupValue: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: (groupId: string, currentName: string) => void;
  onRenameCancel: () => void;
  onRenameStart: (groupId: string, currentName: string) => void;
  onDelete: (groupId: string) => void;
  searchActive: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchClick: (scope: "groups") => void;
  onSearchClear: () => void;
  collapsed: boolean;
  onToggleCollapse: (section: "groups") => void;
}>;

const GroupsSection = memo(function GroupsSection({
  groups,
  pathname,
  renamingGroupId,
  renameGroupValue,
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
}: GroupsSectionProps) {
  const { t } = useTranslation("home");

  return (
    <SidebarContentCollapsibleGroup
      title={t("sidebar.groups.title", "Groups")}
      icon="Users"
      badge={
        <Badge variant="secondary" className="px-1 py-0 text-[9px]">
          Beta
        </Badge>
      }
      searchActive={searchActive}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onSearchClick={() => onSearchClick("groups")}
      onSearchClear={onSearchClear}
      searchPlaceholder={t("sidebar.search.placeholder", "Search...")}
      collapsed={collapsed}
      onToggleCollapse={() => onToggleCollapse("groups")}
    >
      {groups.map((g) => (
        <SidebarLinkItem
          key={g.group_id}
          href={`/groups/${g.group_id}`}
          label={g.group_name}
          active={pathname.startsWith(`/groups/${g.group_id}`)}
          isRenaming={renamingGroupId === g.group_id}
          renameValue={renamingGroupId === g.group_id ? renameGroupValue : ""}
          onRenameChange={onRenameChange}
          onRenameSubmit={() => onRenameSubmit(g.group_id, g.group_name)}
          onRenameCancel={onRenameCancel}
          actions={
            g.user_role === "admin"
              ? [
                  {
                    label: t("sidebar.projectActions.rename", "Rename"),
                    onClick: () => onRenameStart(g.group_id, g.group_name),
                  },
                  {
                    label: t("sidebar.projectActions.delete", "Delete"),
                    onClick: () => onDelete(g.group_id),
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

export default GroupsSection;
