"use client";

import { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfilerTableSelector } from "../routes/Profiler/components/ProfilerTableSelector";
import { ProfilerEmptyState } from "./ProfilerEmptyState";
import { ProfilerBatchPanel } from "./ProfilerBatchPanel";
import { useProfileData } from "../hooks/useProfileData";

type ProfilerPageWrapperProps = Readonly<{
  skeleton: ReactNode;
  renderHeader: (props: { showProfile: boolean }) => ReactNode;
  renderContent: (props: {
    currentProfile: NonNullable<
      ReturnType<typeof useProfileData>["currentProfile"]
    >;
    database: ReturnType<typeof useProfileData>["database"];
    databaseId: ReturnType<typeof useProfileData>["databaseId"];
    isDBConnection: boolean;
  }) => ReactNode;
  translationPrefix: string;
  id?: string;
}>;

export const ProfilerPageWrapper = ({
  skeleton,
  renderHeader,
  renderContent,
  translationPrefix,
  id,
}: ProfilerPageWrapperProps) => {
  const { t } = useTranslation("database");

  const {
    currentProfile,
    isLoading,
    isDBConnection,
    isMultiCSV,
    isProfileNotFound,
    hasError,
    profileError,
    profiledTables,
    selectedProfileTable,
    database,
    databaseId,
    allTables,
    batchProfileStatus,
    isBatchProfiling,
    handleTableSelect,
    handleGenerateProfile,
    handleRetry,
    handleGenerateAll,
    handleRetriggerTable,
  } = useProfileData();

  if (isLoading) return <>{skeleton}</>;

  const showProfile = !hasError && !isProfileNotFound && !!currentProfile;

  const showTableSelector = isDBConnection || isMultiCSV;
  const showBatchPanel = showTableSelector && allTables.length > 1;

  const renderBody = () => {
    if (hasError) {
      return (
        <ProfilerEmptyState
          title={t(`${translationPrefix}.error.title`)}
          subtitle={profileError || t(`${translationPrefix}.error.description`)}
          buttonLabel={t("common.retry")}
          onButtonClick={handleRetry}
          buttonVariant="outline"
        />
      );
    }

    if (isProfileNotFound || !currentProfile) {
      return (
        <ProfilerEmptyState
          title={t(`${translationPrefix}.notGenerated.title`)}
          subtitle={
            isDBConnection
              ? t("profiler.notGenerated.descriptionTable", {
                  tableName: selectedProfileTable,
                })
              : t(`${translationPrefix}.notGenerated.description`)
          }
          buttonLabel={t(`${translationPrefix}.notGenerated.generateButton`)}
          onButtonClick={handleGenerateProfile}
        />
      );
    }

    return renderContent({
      currentProfile,
      database,
      databaseId,
      isDBConnection,
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ScrollArea className="flex-1">
        <div
          id={id}
          className="mx-auto w-full max-w-7xl px-4 py-4 pb-10 sm:px-6 sm:py-6"
        >
          <div className="space-y-6">
            {renderHeader({ showProfile })}

            {showTableSelector && (
              <ProfilerTableSelector
                value={selectedProfileTable}
                onValueChange={handleTableSelect}
                profiledTables={profiledTables}
                batchStatus={batchProfileStatus}
                isBatchProfiling={isBatchProfiling}
              />
            )}

            {showBatchPanel && (
              <ProfilerBatchPanel
                tables={allTables}
                batchStatus={batchProfileStatus}
                isBatchProfiling={isBatchProfiling}
                onGenerateAll={() => handleGenerateAll(false)}
                onRetrigger={handleRetriggerTable}
                onSelectTable={handleTableSelect}
                selectedTable={selectedProfileTable}
              />
            )}

            {renderBody()}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
