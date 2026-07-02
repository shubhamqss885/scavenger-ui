import { OrganizationDb } from "@/lib/services/organizationDbService";

/**
 * Validates a database selection and returns the corrected ID.
 *
 * Business Rules:
 * - Any database in the list is valid for selection
 * - Empty string "" is valid (means no database selected)
 * - Deleted databases fallback to organization default or ""
 *
 * @param currentDbId - Current selected database ID (can be null, undefined, or string)
 * @param organizationDbs - All available databases in the organization
 * @param defaultDb - Organization's default database (can be null)
 * @returns Valid database ID to use (either current, default, or empty string)
 *
 * @example
 * ```typescript
 * const validId = getValidDatabaseSelection(
 *   project.selected_org_db,
 *   organizationDbs,
 *   defaultDb
 * );
 * ```
 */
export const getValidDatabaseSelection = (
  currentDbId: string | null | undefined,
  organizationDbs: OrganizationDb[],
  defaultDb: OrganizationDb | null,
): string => {
  // Empty/null/undefined is valid (means no database selected)
  if (!currentDbId) return "";

  // Check if database exists in available databases
  const database = organizationDbs.find((db) => db.orgdb_id === currentDbId);

  if (database) {
    return currentDbId; // Current selection exists, keep it
  }

  // Current selection is invalid (deleted)
  // Try to fallback to organization's default database
  if (defaultDb?.orgdb_id) {
    return defaultDb.orgdb_id;
  }

  // No valid option available, return empty string
  return "";
};
