export const FETCH_DATABASE = "FETCH_DATABASE" as const;

export const UPDATE_COLUMN_SUGGESTION = "UPDATE_COLUMN_SUGGESTION" as const;

export const FETCH_TABLE_DATA = "FETCH_TABLE_DATA" as const;

export const FETCH_CSV_PROFILE = "FETCH_CSV_PROFILE" as const;

// Multi-table profiling actions (for connected DBs)
export const SET_TABLE_PROFILE = "SET_TABLE_PROFILE" as const;

export const SET_SELECTED_PROFILE_TABLE = "SET_SELECTED_PROFILE_TABLE" as const;

export const SET_TABLE_PROFILE_GENERATING =
  "SET_TABLE_PROFILE_GENERATING" as const;

// Batch profiling — tracks per-table status for Generate All flow
export const SET_BATCH_PROFILE_STATUS = "SET_BATCH_PROFILE_STATUS" as const;

export const RESET_BATCH_PROFILE_STATUS = "RESET_BATCH_PROFILE_STATUS" as const;
