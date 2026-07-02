"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useTranslation } from "@/lib/i18n/client";
import { refreshOrgDbSchema } from "@/lib/services/agenticChatService";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import {
  useDatabaseStatus,
  UNIFIED_DB_STATUS,
} from "@/lib/hooks/useDatabaseStatus";
import { cn, isProductionDatabase, maskHostname } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Subtle } from "@/components/ui/typography";
import { DataSourceHeaderTabs } from "./DataSourceHeaderTabs";
import { ConnectionStatusBadge } from "@/components/blocks/ConnectionStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionDetailsModal } from "./ConnectionDetailsModal";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { useState } from "react";
import ToggleSidebar from "@/components/blocks/ToggleSidebar";
import { StartChatFloatingButton } from "./StartChatFloatingButton";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { toast } from "sonner";

export function DataSourceHeader() {
  const { database, databaseId } = useDatabaseDescription();
  const { getDbById } = useOrganizationDbData();
  const orgDb = getDbById(databaseId);
  const { t } = useTranslation("database");
  const { status } = useDatabaseStatus(databaseId);
  const [connectionDetailsOpen, setConnectionDetailsOpen] = useState(false);
  const [editConnectionOpen, setEditConnectionOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isDemoUser = isFeatureEnabled(FEATURE_FLAGS.DEMO_MODE);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const result = await refreshOrgDbSchema(databaseId);

      if (result.ok) {
        if (result.changed) {
          toast.success(t("actions.schemaUpdated"));
        } else {
          toast.info(t("actions.schemaUpToDate"));
        }
      } else {
        toast.error(result.error || t("actions.schemaRefreshError"));
      }
    } catch {
      toast.error(t("actions.schemaRefreshError"));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Only disable refresh when actively processing or refreshing
  const isRefreshDisabled =
    status === UNIFIED_DB_STATUS.IN_PROGRESS || isRefreshing;
  const isCSVUploadDataSource = orgDb?.has_data_source;

  const showDatabaseDetails = !!orgDb && !isDemoUser && !isCSVUploadDataSource;
  const isProduction = isProductionDatabase(orgDb?.orgdb_hostname_decrypted);

  const isConnected = orgDb?.is_connected;

  // Header chrome (toggle, db icon, tab strip) renders unconditionally so the
  // page never feels emptier than the tab content. Prefer the live OrganizationDb
  // value (which rename updates) over `database.name`, a snapshot taken when the
  // description was last fetched — otherwise a rename wouldn't reflect here. Fall
  // back to `database.name` while OrganizationDbProvider is still decrypting.
  const displayName =
    orgDb?.display_name || database?.name || orgDb?.orgdb_name_decrypted;

  return (
    <>
      {/* Database Info */}
      <div className="flex items-center justify-between border-b px-4 pb-2.5 pt-4 sm:px-6">
        {/* Left Section - Name & Actions */}
        <div className="flex items-center">
          <ToggleSidebar />
          <Icon name="Database" size="md" variant="foreground" />
          {displayName ? (
            <h1
              className="mx-3 max-w-[160px] truncate text-lg font-semibold sm:max-w-none"
              title={displayName}
            >
              {displayName}
            </h1>
          ) : (
            <Skeleton className="mx-3 h-5 w-32" />
          )}
          {isCSVUploadDataSource && <Subtle>CSV</Subtle>}
          {showDatabaseDetails && (
            <div className="hidden items-center gap-2 sm:flex">
              <Subtle>•</Subtle>
              <Subtle>
                {isProduction
                  ? maskHostname(orgDb.orgdb_hostname_decrypted || "")
                  : orgDb.orgdb_hostname_decrypted ||
                    database?.host ||
                    "hostname"}
              </Subtle>
              <Subtle>•</Subtle>
              <Subtle>{orgDb.db_type}</Subtle>
            </div>
          )}
          {showDatabaseDetails && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Icon name="MoreHorizontal" size="sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleRefresh}
                  disabled={isRefreshDisabled}
                >
                  <Icon
                    name="RefreshCw"
                    size="xs"
                    className={cn(
                      "mr-2",
                      (isRefreshing ||
                        status === UNIFIED_DB_STATUS.IN_PROGRESS) &&
                        "animate-spin",
                    )}
                  />
                  {isRefreshing
                    ? t("actions.refreshing")
                    : t("actions.refresh")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConnectionDetailsOpen(true)}
                >
                  <Icon name="Settings" size="xs" className="mr-2" />
                  {t("actions.connectionDetails")}
                </DropdownMenuItem>
                {!isProduction && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setEditConnectionOpen(true)}
                    >
                      <Icon name="Edit2" size="xs" className="mr-2" />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Center Section - DB Info */}

        {/* Right Section - Status Badges (only shown when not connected) */}
        {orgDb && !isConnected && (
          <div className="flex items-center gap-2">
            <ConnectionStatusBadge isConnected={false} className="text-xs" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <DataSourceHeaderTabs />

      {/* Connection Details Modal */}
      {orgDb && (
        <ConnectionDetailsModal
          open={connectionDetailsOpen}
          onOpenChange={setConnectionDetailsOpen}
          database={orgDb}
          databaseName={displayName ?? ""}
        />
      )}

      {/* Edit Connection Dialog */}
      {orgDb && (
        <EditConnectionDialog
          open={editConnectionOpen}
          onOpenChange={setEditConnectionOpen}
          database={orgDb}
        />
      )}

      {/* Floating Chat Button */}
      <StartChatFloatingButton databaseId={databaseId} />
    </>
  );
}
