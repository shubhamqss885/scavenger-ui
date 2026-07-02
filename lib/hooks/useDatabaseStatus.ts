import {
  EDA_STATUS,
  SCHEMA_DESCRIPTION_STATUS,
  type EDAStatus,
  type SchemaDescriptionStatus,
} from "@/lib/services/organizationDbService";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";

// Define unified database status constants
// Note: Uses IN_PROGRESS (not PENDING) to match backend terminology
export const UNIFIED_DB_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  FAILED: "FAILED",
  COMPLETED: "COMPLETED",
  LOADING: "LOADING",
} as const;

export type UnifiedDbStatusKey = keyof typeof UNIFIED_DB_STATUS;

type UnifiedDbStatus = (typeof UNIFIED_DB_STATUS)[UnifiedDbStatusKey];

interface DatabaseStatusResult {
  status: UnifiedDbStatus;
  edaStatus: EDAStatus;
  schemaDescriptionStatus: SchemaDescriptionStatus;
}

/**
 * This hook provides convenient access when you have databaseId but not the db object.
 * For array operations (filter/map), use direct property access: db.unified_status
 */
export function useDatabaseStatus(databaseId: string): DatabaseStatusResult {
  const { getDbById } = useOrganizationDbData();
  const db = getDbById(databaseId);

  // Return stored values (no computation!)
  return {
    status: db?.unified_status || UNIFIED_DB_STATUS.LOADING,
    edaStatus: db?.eda_status || EDA_STATUS.NONE,
    schemaDescriptionStatus:
      db?.schema_description_status || SCHEMA_DESCRIPTION_STATUS.NONE,
  };
}
