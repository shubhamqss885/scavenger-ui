"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  listTables,
  updateColumnDescription,
  generateEdaReport,
  generateSchemaDescription as generateSchemaDescriptionService,
  getTableData,
  TableDataRequest,
  ListTablesResult,
} from "@/lib/services/organizationDbService";
import {
  getStoredCSVProfileData,
  generateCSVProfileData,
  isRejectedProfile,
} from "@/lib/services/externalDataSourceService";
import {
  useOrganizationDbData,
  useOrganizationDbActions,
} from "@/lib/context/OrganizationDbProvider";
import { reducer, initialState } from "./reducer";
import * as actionTypes from "./actionTypes";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { IDatabaseDescriptionState } from "@/components/modules/DataSources/types";
import { useDataSourceEvents } from "@/lib/context/EventsContext/hooks/useDataSourceEvents";

interface DatabaseDescriptionContextType extends IDatabaseDescriptionState {
  databaseId: string;
  updateColumnSuggestion: (
    columnUuid: string,
    suggestion: string,
  ) => Promise<void>;
  fetchDatabaseDetails: () => Promise<void>;
  generateEdaReport: () => Promise<void>;
  generateSchemaDescription: () => Promise<void>;
  fetchTableData: (params: Omit<TableDataRequest, "orgdb_id">) => Promise<void>;
  fetchCSVProfile: (force?: boolean) => Promise<void>;
  generateCSVProfile: () => Promise<void>;
  // Multi-table profiling methods (for connected DBs)
  generateTableProfile: (tableName: string) => Promise<void>;
  setSelectedProfileTable: (tableName: string) => void;
  fetchStoredTableProfile: () => Promise<void>;
  // Batch profiling
  generateAllProfiles: (
    tableNames: string[],
    concurrency?: number,
  ) => Promise<void>;
  resetBatchStatus: (tableNames?: string[]) => void;
}

const BATCH_CONCURRENCY = 4;

const DatabaseDescriptionContext = createContext<
  DatabaseDescriptionContextType | undefined
>(undefined);

export const useDatabaseDescription = () => {
  const context = useContext(DatabaseDescriptionContext);

  if (!context) {
    throw new Error(
      "useDatabaseDescription must be used within a DatabaseDescriptionProvider",
    );
  }
  return context;
};

export function DatabaseDescriptionProvider({
  children,
  databaseId,
}: {
  readonly children: React.ReactNode;
  readonly databaseId: string;
}) {
  const { t } = useTranslation("database");
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading: orgDbLoading, getDbById } = useOrganizationDbData();
  const { ensureDbDecrypted } = useOrganizationDbActions();
  const dbDetails = getDbById(databaseId);
  const { events: dataSourceEvents } = useDataSourceEvents();

  // Decrypt this db's secret fields once the list is loaded. Decryption is
  // lazy now (no bulk decrypt on list fetch), so the detail page is what
  // triggers it. Depends on the whole `dbDetails` object — after an agentic
  // URL edit the db reverts to un-decrypted, and this re-fires to decrypt the
  // new connection URL. The guard + reducer flag keep it idempotent.
  useEffect(() => {
    if (!orgDbLoading && dbDetails && !dbDetails.is_decrypted) {
      ensureDbDecrypted(databaseId);
    }
  }, [orgDbLoading, dbDetails, databaseId, ensureDbDecrypted]);

  // Handle table_names_received WebSocket event
  // This updates tables immediately when backend discovers table names
  // Always overwrites existing tables - event is sent during connect/refresh
  useEffect(() => {
    if (dataSourceEvents.length === 0) return;
    if (!state.database) return; // Wait for database to be initialized

    const event = dataSourceEvents[0];

    if (event.type !== "table_names_received") return;
    if (event.data.orgdb_id !== databaseId) return;

    // Compare only table-type entries against the event (event has no views)
    const currentTableNames = state.database.tables
      .filter((t) => t.object_type !== "view")
      .map((t) => t.table_name)
      .sort((a, b) => a.localeCompare(b))
      .join(",");
    const eventTableNames = [...event.data.table_names]
      .sort((a, b) => a.localeCompare(b))
      .join(",");

    if (currentTableNames === eventTableNames) return; // Already processed

    // Preserve existing view entries; only replace tables from the event
    const existingViews = state.database.tables.filter(
      (t) => t.object_type === "view",
    );
    const tables = [
      ...event.data.table_names.map((name) => ({
        table_name: name,
        object_type: "table" as const,
        table_columns: [],
      })),
      ...existingViews,
    ];

    dispatch({
      type: actionTypes.FETCH_DATABASE,
      payload: {
        loading: false,
        data: { ...state.database, tables },
      },
    });
  }, [dataSourceEvents, databaseId, state.database]);

  const fetchDatabaseDetails = async () => {
    if (!databaseId || orgDbLoading) {
      return;
    }

    // Wait for dbDetails to be available (org databases still loading/decrypting)
    if (!dbDetails) {
      return;
    }

    // For file-based DBs (CSV/Excel/Sheets) skip the schema/tables fetch until ingestion is done.
    // Data/Profiler tabs render status-based EmptyStates while pending/failed; firing listTables
    // here would be wasted. Effect refires once unified_status flips to COMPLETED.
    // SQL connectors come in ready and have no ingestion pipeline — always fetch tables for them.
    const hasDataSource = dbDetails.has_data_source === true;

    if (hasDataSource && dbDetails.unified_status !== "COMPLETED") {
      dispatch({
        type: actionTypes.FETCH_DATABASE,
        payload: {
          loading: false,
          data: {
            id: databaseId,
            name: dbDetails.display_name || dbDetails.orgdb_name_decrypted,
            host: dbDetails.orgdb_hostname_decrypted,
            tables: [],
            schema_description_status: dbDetails.schema_description_status,
          },
        },
      });
      return;
    }

    // Only show loading spinner on initial load or database switch. Skip loading state on status refreshes to prevent UI flicker
    const isInitialLoadOrSwitch =
      !state.database || state.database.id !== databaseId;

    if (isInitialLoadOrSwitch) {
      dispatch({
        type: actionTypes.FETCH_DATABASE,
        payload: { loading: true },
      });
    }

    try {
      const schemaDescriptionStatus = dbDetails.schema_description_status;

      let listTablesError = false;
      const listTablesResult = await listTables(databaseId).catch(() => {
        listTablesError = true;
        return { tables: [], views: [] } as ListTablesResult;
      });

      const tables = [
        ...listTablesResult.tables.map((item) => ({
          table_name: item.name,
          object_type: "table" as const,
          row_count: item.row_count,
          row_count_approx: item.row_count_approx,
          table_columns: [],
        })),
        ...listTablesResult.views.map((item) => ({
          table_name: item.name,
          object_type: "view" as const,
          row_count: item.row_count,
          row_count_approx: item.row_count_approx,
          table_columns: [],
        })),
      ];

      const transformedData = {
        id: databaseId,
        name: dbDetails.display_name || dbDetails.orgdb_name_decrypted,
        host: dbDetails.orgdb_hostname_decrypted,
        tables,
        schema_description_status: schemaDescriptionStatus,
      };

      dispatch({
        type: actionTypes.FETCH_DATABASE,
        payload: { loading: false, data: transformedData, listTablesError },
      });
    } catch (err) {
      console.error("[REFRESH DEBUG] Error fetching database:", err);
      dispatch({
        type: actionTypes.FETCH_DATABASE,
        payload: {
          loading: false,
          error: t("provider.messages.error.loadFailed"),
        },
      });
    }
  };

  const updateColumnSuggestion = useCallback(
    async (columnUuid: string, suggestion: string) => {
      try {
        await updateColumnDescription(columnUuid, suggestion);

        dispatch({
          type: actionTypes.UPDATE_COLUMN_SUGGESTION,
          payload: { columnUuid, suggestion },
        });

        toast.success(t("provider.messages.success.columnDescriptionUpdated"));
      } catch (error) {
        console.error("Failed to update column description:", error);
        toast.error(t("provider.messages.error.columnDescriptionFailed"));
        throw error;
      }
    },
    [],
  );

  // @deprecated Refresh now uses /agentic/orgdb_schema_refresh via DataSourceHeader.handleRefresh; this provider action has no callers
  const handleGenerateSchemaDescription = useCallback(async () => {
    if (!state.database) {
      return;
    }

    try {
      await generateSchemaDescriptionService(state.database.id);

      // No need to manually fetch - WebSocket event will update unifiedStatus,
      // which triggers the useEffect to call fetchDatabaseDetails automatically
      toast.success(t("provider.messages.success.databaseDescriptionsStarted"));
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.info("Schema description generation already in progress (409)");
      } else {
        toast.error(t("provider.messages.error.databaseDescriptionsFailed"));
        console.error("Schema description generation error:", error);
      }
      throw error;
    }
  }, [state.database]);

  const handleGenerateEda = useCallback(async () => {
    if (!state.database) return;

    try {
      const response = await generateEdaReport(state.database.id);

      const reportText = response.eda_report;
      const blob = new Blob([reportText], { type: "text/plain" });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eda-report-${state.database.name}.txt`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      toast.success(t("provider.messages.success.edaReportGenerated"));
    } catch (error) {
      toast.error(t("provider.messages.error.edaReportFailed"));
      console.error("EDA generation error:", error);
      throw error;
    }
  }, [state.database]);

  const fetchTableData = useCallback(
    async (params: Omit<TableDataRequest, "orgdb_id">) => {
      dispatch({
        type: actionTypes.FETCH_TABLE_DATA,
        payload: { loading: true },
      });

      try {
        const data = await getTableData({
          ...params,
          orgdb_id: databaseId,
        });
        dispatch({
          type: actionTypes.FETCH_TABLE_DATA,
          payload: { data, loading: false },
        });
      } catch (error: any) {
        console.error("Table data fetch error:", error);

        let errorMessage = "Failed to fetch table data";

        // Provide more specific error messages based on error type
        if (error.response?.status === 500) {
          errorMessage =
            "Database connection error. Please check your database connection.";
        } else if (error.response?.status === 404) {
          errorMessage =
            "Table not found. The selected table may have been deleted or renamed.";
        } else if (error.response?.status === 403) {
          errorMessage =
            "Access denied. You don't have permission to view this table.";
        } else if (
          error.response?.status >= 400 &&
          error.response?.status < 500
        ) {
          errorMessage = `Request error: ${error.response?.data?.message || error.message || "Bad request"}`;
        } else if (error.code === "ECONNABORTED") {
          errorMessage =
            "The database is taking too long to respond. Please try again.";
        } else if (
          error.code === "NETWORK_ERROR" ||
          error.message?.includes("Network")
        ) {
          errorMessage =
            "Network connection failed. Please check your internet connection.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        dispatch({
          type: actionTypes.FETCH_TABLE_DATA,
          payload: {
            error: errorMessage,
            loading: false,
          },
        });

        toast.error(errorMessage);
      }
    },
    [databaseId],
  );

  const fetchCSVProfile = useCallback(
    async (force = false) => {
      // Skip fetch if we already have data (unless force refresh requested)
      if (state.csvProfile && !force) {
        return;
      }

      dispatch({
        type: actionTypes.FETCH_CSV_PROFILE,
        payload: { loading: true },
      });

      try {
        const data = await getStoredCSVProfileData(databaseId);

        // Guard: Skip rejected profiles
        if (isRejectedProfile(data)) {
          dispatch({
            type: actionTypes.FETCH_CSV_PROFILE,
            payload: { loading: false },
          });
          return;
        }

        dispatch({
          type: actionTypes.FETCH_CSV_PROFILE,
          payload: { data, loading: false },
        });
      } catch (error: any) {
        console.error("CSV profile fetch error:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch CSV profile";

        dispatch({
          type: actionTypes.FETCH_CSV_PROFILE,
          payload: {
            error: errorMessage,
            loading: false,
          },
        });
      }
    },
    [databaseId, state.csvProfile],
  );

  const generateCSVProfile = useCallback(async () => {
    dispatch({
      type: actionTypes.FETCH_CSV_PROFILE,
      payload: { loading: true },
    });

    try {
      const data = await generateCSVProfileData(databaseId);

      // Guard: Handle rejected profile (e.g., exceeds row threshold)
      if (isRejectedProfile(data)) {
        dispatch({
          type: actionTypes.FETCH_CSV_PROFILE,
          payload: { loading: false },
        });
        toast.error(data.message);
        return;
      }

      dispatch({
        type: actionTypes.FETCH_CSV_PROFILE,
        payload: { data, loading: false },
      });
      toast.success(t("profiler.generateSuccess"));
    } catch (error: any) {
      console.error("CSV profile generation error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate CSV profile";

      dispatch({
        type: actionTypes.FETCH_CSV_PROFILE,
        payload: {
          error: errorMessage,
          loading: false,
        },
      });
      toast.error(t("profiler.generateError"));
      throw error;
    }
  }, [databaseId, t]);

  // Generate profile for a specific table (connected DB flow)
  const generateTableProfile = useCallback(
    async (tableName: string) => {
      dispatch({
        type: actionTypes.SET_TABLE_PROFILE_GENERATING,
        payload: tableName,
      });

      try {
        const data = await generateCSVProfileData(databaseId, tableName);

        // Guard: Handle rejected profile (e.g., table exceeds row threshold)
        if (isRejectedProfile(data)) {
          throw new Error(data.message);
        }

        dispatch({
          type: actionTypes.SET_TABLE_PROFILE,
          payload: { tableName, data },
        });
        toast.success(t("profiler.generateSuccess"));
      } catch (error: any) {
        console.error("Table profile generation error:", error);
        dispatch({
          type: actionTypes.SET_TABLE_PROFILE,
          payload: {
            tableName,
            error: error?.message || t("profiler.generateError"),
          },
        });
      }
    },
    [databaseId, t],
  );

  // Set the currently selected table for profiling
  const setSelectedProfileTable = useCallback((tableName: string) => {
    dispatch({
      type: actionTypes.SET_SELECTED_PROFILE_TABLE,
      payload: tableName,
    });
  }, []);

  const generateAllProfiles = useCallback(
    async (tableNames: string[], concurrency = BATCH_CONCURRENCY) => {
      if (tableNames.length === 0) return;

      for (const name of tableNames) {
        dispatch({
          type: actionTypes.SET_BATCH_PROFILE_STATUS,
          payload: {
            tableName: name,
            status: { status: "pending" },
            isBatchProfiling: true,
          },
        });
      }

      const queue = [...tableNames];

      const runOne = async (tableName: string) => {
        dispatch({
          type: actionTypes.SET_BATCH_PROFILE_STATUS,
          payload: { tableName, status: { status: "running" } },
        });

        try {
          const data = await generateCSVProfileData(databaseId, tableName);

          if (isRejectedProfile(data)) {
            dispatch({
              type: actionTypes.SET_BATCH_PROFILE_STATUS,
              payload: {
                tableName,
                status: { status: "skipped", errorMessage: data.message },
              },
            });
            return;
          }

          dispatch({
            type: actionTypes.SET_TABLE_PROFILE,
            payload: { tableName, data },
          });
          dispatch({
            type: actionTypes.SET_BATCH_PROFILE_STATUS,
            payload: { tableName, status: { status: "done" } },
          });
        } catch (error: any) {
          dispatch({
            type: actionTypes.SET_BATCH_PROFILE_STATUS,
            payload: {
              tableName,
              status: {
                status: "error",
                errorMessage: error?.message || t("profiler.generateError"),
              },
            },
          });
        }
      };

      const worker = async () => {
        while (queue.length > 0) {
          await runOne(queue.shift()!);
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(concurrency, tableNames.length) },
          worker,
        ),
      );
    },
    [databaseId, t],
  );

  const resetBatchStatus = useCallback((tableNames?: string[]) => {
    dispatch({
      type: actionTypes.RESET_BATCH_PROFILE_STATUS,
      payload: tableNames ? { tableNames } : undefined,
    });
  }, []);

  // Fetch stored table profile from backend (for DB connections on mount/refresh)
  // GET endpoint returns the LATEST profiled table, so we extract table name from meta.file_name
  const fetchStoredTableProfile = useCallback(async () => {
    dispatch({
      type: actionTypes.SET_TABLE_PROFILE_GENERATING,
      payload: "__fetching__",
    });

    try {
      const data = await getStoredCSVProfileData(databaseId);

      // Guard: Skip rejected profiles
      if (isRejectedProfile(data)) {
        dispatch({
          type: actionTypes.SET_TABLE_PROFILE_GENERATING,
          payload: null,
        });
        return;
      }

      // meta.file_name contains the table name for DB connections
      const tableName = data.meta.file_name;

      if (tableName) {
        dispatch({
          type: actionTypes.SET_TABLE_PROFILE,
          payload: { tableName, data },
        });
        dispatch({
          type: actionTypes.SET_SELECTED_PROFILE_TABLE,
          payload: tableName,
        });
      } else {
        dispatch({
          type: actionTypes.SET_TABLE_PROFILE_GENERATING,
          payload: null,
        });
      }
    } catch {
      dispatch({
        type: actionTypes.SET_TABLE_PROFILE_GENERATING,
        payload: null,
      });
      console.info("No existing table profile found");
    }
  }, [databaseId]);

  useEffect(() => {
    fetchDatabaseDetails();
  }, [
    databaseId,
    orgDbLoading,
    dbDetails?.orgdb_id,
    dbDetails?.unified_status,
    // Rebuild `database` (name/host come from decrypted fields) once decryption lands.
    dbDetails?.is_decrypted,
  ]);

  const value = useMemo(
    () => ({
      ...state,
      databaseId,
      loading: state.loading || orgDbLoading,
      updateColumnSuggestion,
      fetchDatabaseDetails,
      generateEdaReport: handleGenerateEda,
      generateSchemaDescription: handleGenerateSchemaDescription,
      fetchTableData,
      fetchCSVProfile,
      generateCSVProfile,
      // Multi-table profiling methods
      generateTableProfile,
      setSelectedProfileTable,
      fetchStoredTableProfile,
      generateAllProfiles,
      resetBatchStatus,
    }),
    [
      state,
      databaseId,
      orgDbLoading,
      updateColumnSuggestion,
      handleGenerateEda,
      handleGenerateSchemaDescription,
      fetchTableData,
      fetchCSVProfile,
      generateCSVProfile,
      generateTableProfile,
      setSelectedProfileTable,
      fetchStoredTableProfile,
      generateAllProfiles,
      resetBatchStatus,
    ],
  );

  return (
    <DatabaseDescriptionContext.Provider value={value}>
      {children}
    </DatabaseDescriptionContext.Provider>
  );
}
