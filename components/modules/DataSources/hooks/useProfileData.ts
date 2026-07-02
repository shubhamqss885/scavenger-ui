"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";

const BATCH_CONCURRENCY = 4;

export const useProfileData = () => {
  const { getDbById } = useOrganizationDbData();

  const {
    database,
    databaseId,
    loading,
    // CSV profile (existing)
    csvProfile,
    csvProfileLoading,
    csvProfileError,
    fetchCSVProfile,
    generateCSVProfile,
    // Table profiles (for connected DBs)
    tableProfiles,
    tableProfileError,
    selectedProfileTable,
    tableProfileGenerating,
    generateTableProfile,
    setSelectedProfileTable,
    fetchStoredTableProfile,
    // Batch profiling
    batchProfileStatus,
    isBatchProfiling,
    generateAllProfiles,
    resetBatchStatus,
  } = useDatabaseDescription();

  const dbDetails = getDbById(databaseId);

  const isCSVUpload = dbDetails?.has_data_source === true;
  const isMultiCSV = isCSVUpload && (database?.tables?.length ?? 0) > 1;
  const isDBConnection = !isCSVUpload && (database?.tables?.length ?? 0) > 0;

  const currentProfile = useMemo(() => {
    if (isMultiCSV)
      return selectedProfileTable ? tableProfiles[selectedProfileTable] : null;
    if (isCSVUpload) return csvProfile;
    return selectedProfileTable ? tableProfiles[selectedProfileTable] : null;
  }, [
    isMultiCSV,
    isCSVUpload,
    csvProfile,
    selectedProfileTable,
    tableProfiles,
  ]);

  const profiledTables = useMemo(
    () => new Set(Object.keys(tableProfiles)),
    [tableProfiles],
  );

  // All tables sorted — used by batch panel
  const allTables = useMemo(
    () =>
      (database?.tables ?? [])
        .filter((t) => !!t.table_name)
        .sort((a, b) => a.table_name.localeCompare(b.table_name)),
    [database?.tables],
  );

  const isLoading = useMemo(() => {
    if (isCSVUpload && !isMultiCSV) return csvProfileLoading;
    if (loading || !!tableProfileGenerating) return true;
    if (
      (isDBConnection || isMultiCSV) &&
      Object.keys(tableProfiles).length === 0 &&
      !selectedProfileTable
    ) {
      return true;
    }
    return false;
  }, [
    isCSVUpload,
    isMultiCSV,
    csvProfileLoading,
    loading,
    tableProfileGenerating,
    isDBConnection,
    tableProfiles,
    selectedProfileTable,
  ]);

  // Auto-select first table for DB connections and multi-file CSV
  useEffect(() => {
    if (
      (isDBConnection || isMultiCSV) &&
      !selectedProfileTable &&
      database?.tables?.length
    ) {
      const sorted = [...database.tables]
        .filter((t) => !!t.table_name)
        .sort((a, b) => a.table_name.localeCompare(b.table_name));
      setSelectedProfileTable(sorted[0].table_name);
    }
  }, [
    isDBConnection,
    isMultiCSV,
    selectedProfileTable,
    database?.tables,
    setSelectedProfileTable,
  ]);

  // Fetch CSV profile on mount (single-file only)
  useEffect(() => {
    if (isCSVUpload && !isMultiCSV) fetchCSVProfile();
  }, [isCSVUpload, isMultiCSV, fetchCSVProfile]);

  // Fetch stored table profile on mount for DB connections and multi-file CSV
  useEffect(() => {
    if (
      (isDBConnection || isMultiCSV) &&
      Object.keys(tableProfiles).length === 0
    ) {
      fetchStoredTableProfile();
    }
  }, [isDBConnection, isMultiCSV, tableProfiles, fetchStoredTableProfile]);

  const handleTableSelect = useCallback(
    (tableName: string) => setSelectedProfileTable(tableName),
    [setSelectedProfileTable],
  );

  const handleGenerateProfile = useCallback(() => {
    if (isCSVUpload && !isMultiCSV) {
      generateCSVProfile();
    } else if (selectedProfileTable) {
      generateTableProfile(selectedProfileTable);
    }
  }, [
    isCSVUpload,
    isMultiCSV,
    selectedProfileTable,
    generateCSVProfile,
    generateTableProfile,
  ]);

  const handleRetry = useCallback(() => {
    if (isCSVUpload && !isMultiCSV) {
      fetchCSVProfile(true);
    } else if (selectedProfileTable) {
      generateTableProfile(selectedProfileTable);
    }
  }, [
    isCSVUpload,
    isMultiCSV,
    selectedProfileTable,
    fetchCSVProfile,
    generateTableProfile,
  ]);

  // Generate all — only ungenerated tables by default; pass all to force-regenerate
  const handleGenerateAll = useCallback(
    (forceAll = false) => {
      const targets = forceAll
        ? allTables
            .filter(
              (t) => batchProfileStatus[t.table_name]?.status !== "skipped",
            )
            .map((t) => t.table_name)
        : allTables
            .filter((t) => !tableProfiles[t.table_name])
            .map((t) => t.table_name);

      if (targets.length > 0) {
        generateAllProfiles(targets, BATCH_CONCURRENCY);
      }
    },
    [allTables, tableProfiles, batchProfileStatus, generateAllProfiles],
  );

  const handleRetriggerTable = useCallback(
    (tableName: string) => {
      resetBatchStatus([tableName]);
      generateAllProfiles([tableName], 1);
    },
    [resetBatchStatus, generateAllProfiles],
  );

  const isProfileNotFound = useMemo(() => {
    if (isCSVUpload && !isMultiCSV) {
      return (
        !csvProfile ||
        (csvProfileError &&
          (csvProfileError.includes("404") ||
            csvProfileError.toLowerCase().includes("not found")))
      );
    }
    return !currentProfile && !isLoading;
  }, [
    isCSVUpload,
    isMultiCSV,
    csvProfile,
    csvProfileError,
    currentProfile,
    isLoading,
  ]);

  const hasError = useMemo(() => {
    if (isCSVUpload && !isMultiCSV)
      return csvProfileError && !isProfileNotFound;
    return !!tableProfileError;
  }, [
    isCSVUpload,
    isMultiCSV,
    csvProfileError,
    isProfileNotFound,
    tableProfileError,
  ]);

  const profileError =
    isCSVUpload && !isMultiCSV ? csvProfileError : tableProfileError;

  return {
    currentProfile,
    isLoading,
    isDBConnection,
    isCSVUpload,
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
  };
};
