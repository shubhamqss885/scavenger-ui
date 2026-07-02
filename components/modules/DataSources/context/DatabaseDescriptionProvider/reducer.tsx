import * as actionTypes from "./actionTypes";
import {
  Database,
  IDatabaseDescriptionState,
  BatchTableStatus,
} from "@/components/modules/DataSources/types";
import { TableDataResponse } from "@/lib/services/organizationDbService";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";

export const initialState: IDatabaseDescriptionState = {
  database: null,
  loading: true,
  error: null,
  listTablesError: false,
  tableData: null,
  tableDataLoading: false,
  tableDataError: null,
  csvProfile: null,
  csvProfileLoading: false,
  csvProfileError: null,
  // Multi-table profiling support (for connected DBs)
  tableProfiles: {},
  tableProfileError: null,
  selectedProfileTable: undefined,
  tableProfileGenerating: null,
  // Batch profiling
  batchProfileStatus: {},
  isBatchProfiling: false,
};

type Action =
  | {
      type: typeof actionTypes.FETCH_DATABASE;
      payload: {
        loading: boolean;
        data?: Database;
        error?: string;
        listTablesError?: boolean;
      };
    }
  | {
      type: typeof actionTypes.UPDATE_COLUMN_SUGGESTION;
      payload: {
        columnUuid: string;
        suggestion: string;
      };
    }
  | {
      type: typeof actionTypes.FETCH_TABLE_DATA;
      payload: {
        loading?: boolean;
        data?: TableDataResponse;
        error?: string;
      };
    }
  | {
      type: typeof actionTypes.FETCH_CSV_PROFILE;
      payload: {
        loading?: boolean;
        data?: CSVProfileResponse;
        error?: string;
      };
    }
  // Multi-table profiling actions
  | {
      type: typeof actionTypes.SET_TABLE_PROFILE;
      payload: {
        tableName: string;
        data?: CSVProfileResponse;
        error?: string;
      };
    }
  | {
      type: typeof actionTypes.SET_SELECTED_PROFILE_TABLE;
      payload: string;
    }
  | {
      type: typeof actionTypes.SET_TABLE_PROFILE_GENERATING;
      payload: string | null;
    }
  // Batch profiling actions
  | {
      type: typeof actionTypes.SET_BATCH_PROFILE_STATUS;
      payload: {
        tableName: string;
        status: BatchTableStatus;
        isBatchProfiling?: boolean;
      };
    }
  | {
      type: typeof actionTypes.RESET_BATCH_PROFILE_STATUS;
      payload?: { tableNames: string[] };
    };

export const reducer = (
  state: IDatabaseDescriptionState,
  action: Action,
): IDatabaseDescriptionState => {
  switch (action.type) {
    case actionTypes.FETCH_DATABASE:
      return {
        ...state,
        loading: action.payload.loading,
        database: action.payload.data || state.database,
        error: action.payload.error ?? null,
        listTablesError: action.payload.listTablesError ?? false,
        tableData:
          action.payload.data?.tables?.length === 0 ? null : state.tableData,
      };

    case actionTypes.UPDATE_COLUMN_SUGGESTION:
      if (!state.database) return state;

      return {
        ...state,
        database: {
          ...state.database,
          tables: state.database.tables.map((table) => {
            const targetColumn = table.table_columns.find(
              (col) => col.column_uuid === action.payload.columnUuid,
            );

            if (!targetColumn) return table;

            return {
              ...table,
              table_columns: table.table_columns.map((column) => {
                if (column.column_uuid !== action.payload.columnUuid)
                  return column;

                return {
                  ...column,
                  column_description: action.payload.suggestion,
                };
              }),
            };
          }),
        },
      };

    case actionTypes.FETCH_TABLE_DATA:
      return {
        ...state,
        tableDataLoading: action.payload.loading ?? false,
        tableData: action.payload.data ?? state.tableData,
        tableDataError: action.payload.error ?? null,
      };

    case actionTypes.FETCH_CSV_PROFILE:
      return {
        ...state,
        csvProfileLoading: action.payload.loading ?? false,
        csvProfile: action.payload.data ?? state.csvProfile,
        csvProfileError: action.payload.error ?? null,
      };

    case actionTypes.SET_TABLE_PROFILE:
      return {
        ...state,
        tableProfiles: action.payload.data
          ? {
              ...state.tableProfiles,
              [action.payload.tableName]: action.payload.data,
            }
          : state.tableProfiles,
        tableProfileError: action.payload.error ?? null,
        tableProfileGenerating: null,
      };

    case actionTypes.SET_SELECTED_PROFILE_TABLE:
      return {
        ...state,
        selectedProfileTable: action.payload,
        tableProfileError: null,
      };

    case actionTypes.SET_TABLE_PROFILE_GENERATING:
      return {
        ...state,
        tableProfileGenerating: action.payload,
      };

    case actionTypes.SET_BATCH_PROFILE_STATUS: {
      const nextBatchStatus = {
        ...state.batchProfileStatus,
        [action.payload.tableName]: action.payload.status,
      };
      const settledStatuses = ["done", "error", "skipped"];
      const allSettled =
        settledStatuses.includes(action.payload.status.status) &&
        Object.values(nextBatchStatus).every((s) =>
          settledStatuses.includes(s.status),
        );
      return {
        ...state,
        batchProfileStatus: nextBatchStatus,
        isBatchProfiling:
          action.payload.isBatchProfiling ??
          (allSettled ? false : state.isBatchProfiling),
      };
    }

    case actionTypes.RESET_BATCH_PROFILE_STATUS: {
      // If tableNames provided, only reset those — otherwise reset all
      if (action.payload?.tableNames) {
        const reset = { ...state.batchProfileStatus };
        for (const name of action.payload.tableNames) {
          delete reset[name];
        }
        return { ...state, batchProfileStatus: reset };
      }
      return { ...state, batchProfileStatus: {}, isBatchProfiling: false };
    }

    default:
      return state;
  }
};
