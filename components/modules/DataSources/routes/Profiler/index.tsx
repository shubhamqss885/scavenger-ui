"use client";

import { useTranslation } from "@/lib/i18n/client";
import { H4 } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icon";
import { DatasetOverview } from "./components/DatasetOverview";
import { DataQuality } from "./components/DataQuality";
import { TopCorrelations } from "./components/TopCorrelations";
import { ColumnAnalysis } from "./components/ColumnAnalysis";
import { DataQualityScore } from "./components/DataQualityScore";
import { ProfilerSkeleton } from "./components/ProfilerSkeleton";
import { ExportProfilerButton } from "./components/ExportProfilerButton";
import { DataQualityAlertsSection } from "./components/DataQualityAlertsSection";
import { ProfilerPageWrapper } from "../../components/ProfilerPageWrapper";
import { EmptyState as DataEmptyState } from "@/components/modules/DataSources/routes/Data/components/EmptyState";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import {
  useDatabaseStatus,
  UNIFIED_DB_STATUS,
} from "@/lib/hooks/useDatabaseStatus";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";

export const DataSourceProfilerModule = () => {
  const { t } = useTranslation("database");
  const { databaseId } = useDatabaseDescription();
  const { status } = useDatabaseStatus(databaseId);
  const { getDbById } = useOrganizationDbData();
  const hasDataSource = getDbById(databaseId)?.has_data_source === true;

  // Status-based gating only applies to file-based ingest (CSV/Excel/Sheets).
  // SQL connectors come in ready and don't go through the ingest pipeline that drives status.
  if (hasDataSource) {
    if (status === UNIFIED_DB_STATUS.NOT_STARTED) {
      return <DataEmptyState type="setup-required" />;
    }
    if (status === UNIFIED_DB_STATUS.IN_PROGRESS) {
      return <DataEmptyState type="processing" />;
    }
    if (status === UNIFIED_DB_STATUS.FAILED) {
      return <DataEmptyState type="setup-failed" />;
    }
  }

  return (
    <ProfilerPageWrapper
      id="profiler-content"
      translationPrefix="profiler"
      skeleton={<ProfilerSkeleton />}
      renderHeader={({ showProfile }) => (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FileBarChart" size="md" variant="primary" />
            <H4 className="text-lg">{t("profiler.title")}</H4>
          </div>
          {showProfile && <ExportProfilerButton filename="profiler-export" />}
        </div>
      )}
      renderContent={({
        currentProfile,
        database,
        databaseId,
        isDBConnection,
      }) => {
        const tableName = isDBConnection
          ? (currentProfile.meta?.file_name ?? "")
          : (database?.tables?.[0]?.table_name ??
            currentProfile.meta?.file_name ??
            "");

        return (
          <div className="space-y-6">
            <DataQualityScore data={currentProfile} />
            <DatasetOverview data={currentProfile} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DataQuality
                data={currentProfile}
                databaseId={databaseId}
                tableName={tableName}
              />
              <TopCorrelations
                data={currentProfile}
                databaseId={databaseId}
                tableName={tableName}
              />
            </div>
            <ColumnAnalysis data={currentProfile} />
            <DataQualityAlertsSection alerts={currentProfile.alerts || []} />
          </div>
        );
      }}
    />
  );
};
