"use client";

import { memo } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { SidebarContentCollapsibleGroup } from "../shared/SidebarContentCollapsibleGroup";
import { SidebarLinkItem } from "../shared/SidebarLinkItem";

const INGEST_STATUS_MAP: Record<
  string,
  "connected" | "connecting" | "not_connected"
> = {
  COMPLETED: "connected",
  IN_PROGRESS: "connecting",
  FAILED: "not_connected",
  NOT_STARTED: "not_connected",
};

// Minimal structural type — the real org-db object is a superset.
type DbItem = Readonly<{
  orgdb_id: string;
  display_name?: string;
  orgdb_name_decrypted?: string;
  is_default?: boolean;
  has_data_source?: boolean;
  unified_status: string;
  is_connected?: boolean;
}>;

type DatabasesSectionProps = Readonly<{
  databases: readonly DbItem[];
  pathname: string;
  demoMode: boolean;
  editEnabled: boolean;
  renamingDbId: string | null;
  renameDbValue: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: (dbId: string, currentName: string) => void;
  onRenameCancel: () => void;
  onRenameStart: (dbId: string, currentName: string) => void;
  onSetDefault: (dbId: string) => void;
  onDelete: (dbId: string) => void;
  searchActive: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchClick: (scope: "data") => void;
  onSearchClear: () => void;
  collapsed: boolean;
  onToggleCollapse: (section: "data") => void;
}>;

const DatabasesSection = memo(function DatabasesSection({
  databases,
  pathname,
  demoMode,
  editEnabled,
  renamingDbId,
  renameDbValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onRenameStart,
  onSetDefault,
  onDelete,
  searchActive,
  searchQuery,
  onSearchChange,
  onSearchClick,
  onSearchClear,
  collapsed,
  onToggleCollapse,
}: DatabasesSectionProps) {
  const { t } = useTranslation("home");

  return (
    <div data-tour="datasources-section">
      <SidebarContentCollapsibleGroup
        title={t("sidebar.data.title", "Data")}
        icon="Database"
        searchActive={searchActive}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchClick={() => onSearchClick("data")}
        onSearchClear={onSearchClear}
        searchPlaceholder={t("sidebar.search.placeholder", "Search...")}
        collapsed={collapsed}
        onToggleCollapse={() => onToggleCollapse("data")}
      >
        {databases.map((db) => {
          const dbStatus = db.has_data_source
            ? INGEST_STATUS_MAP[db.unified_status]
            : db.is_connected
              ? "connected"
              : "not_connected";
          const dbName = db.display_name || db.orgdb_name_decrypted || "";

          return (
            <SidebarLinkItem
              key={db.orgdb_id}
              href={`/data-sources/${db.orgdb_id}/data`}
              label={dbName || "Database"}
              active={pathname.startsWith(`/data-sources/${db.orgdb_id}`)}
              badge={db.is_default ? "default" : undefined}
              status={dbStatus}
              statusLabel={t(`sidebar.dataSources.status.${dbStatus}`)}
              isRenaming={renamingDbId === db.orgdb_id}
              renameValue={renamingDbId === db.orgdb_id ? renameDbValue : ""}
              onRenameChange={onRenameChange}
              onRenameSubmit={() => onRenameSubmit(db.orgdb_id, dbName)}
              onRenameCancel={onRenameCancel}
              actions={
                demoMode
                  ? undefined
                  : [
                      ...(db.is_default
                        ? []
                        : [
                            {
                              label: t(
                                "sidebar.dataSources.actions.setDefault",
                                "Set as default",
                              ),
                              onClick: () => onSetDefault(db.orgdb_id),
                            },
                          ]),
                      ...(editEnabled
                        ? [
                            {
                              label: t(
                                "sidebar.dataSources.actions.rename",
                                "Rename",
                              ),
                              onClick: () => onRenameStart(db.orgdb_id, dbName),
                            },
                          ]
                        : []),
                      {
                        label: t(
                          "sidebar.dataSources.actions.delete",
                          "Delete",
                        ),
                        onClick: () => onDelete(db.orgdb_id),
                        variant: "destructive" as const,
                      },
                    ]
              }
            />
          );
        })}
      </SidebarContentCollapsibleGroup>
    </div>
  );
});

export default DatabasesSection;
