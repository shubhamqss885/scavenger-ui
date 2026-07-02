import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { reducer, initialState, OrganizationDbState } from "./reducer";
import * as actionTypes from "./actionTypes";
import {
  OrganizationDb,
  getOrganizationDbs,
  createOrganizationDb,
  updateOrganizationDb,
  deleteOrganizationDb,
  setDefaultDb,
  CreateOrganizationDbDecryptedParams,
  UpdateOrganizationDbDecryptedParams,
  UnifiedStatus,
  SchemaDescriptionStatus,
  EDAStatus,
} from "@/lib/services/organizationDbService";
import { useOrgDbStatusEvents } from "@/lib/context/EventsContext/hooks/useStatusEvents";
import { useIngestionEvents } from "@/lib/context/EventsContext/hooks/useIngestionEvents";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { toast } from "sonner";
import { encrypt, decrypt, parseConnectionUrl } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { isAxiosError } from "axios";
import { handleDbOperationError } from "@/lib/utils/errorUtils";

// DATA context type - for components that only read data
interface OrganizationDbDataContextType {
  organizationDbs: OrganizationDb[];
  loading: boolean;
  error: string | null;
  defaultDb: OrganizationDb | null;
  getDbById: (dbId: string) => OrganizationDb | null;
  /** True while an add-data-source request is in flight. */
  isAddingDb: boolean;
}

/** Params for URL-based connection update (agentic connectors) */
interface UpdateOrganizationDbUrlParams {
  orgdb_connection_url_encrypted: string;
  db_type: string;
  is_agentic?: boolean;
}

// ACTIONS context type - for components that only need to trigger actions
interface OrganizationDbActionsContextType {
  fetchOrganizationDbs: (orgId: string) => Promise<void>;
  addOrganizationDb: (
    params: CreateOrganizationDbDecryptedParams,
  ) => Promise<string>;
  updateDb: (
    dbId: string,
    params: UpdateOrganizationDbDecryptedParams,
  ) => Promise<void>;
  /** Update a database using an encrypted connection URL (for agentic connectors) */
  updateDbByUrl: (
    dbId: string,
    params: UpdateOrganizationDbUrlParams,
  ) => Promise<void>;
  deleteDb: (dbId: string, options?: { silent?: boolean }) => Promise<void>;
  renameDb: (dbId: string, displayName: string) => Promise<void>;
  setDefaultDatabase: (dbId: string) => Promise<void>;
  updateDbStateById: (dbId: string, updates: Partial<OrganizationDb>) => void;
  /**
   * Decrypt a single database's secret fields on demand (idempotent). Call when
   * its detail page opens; lists never need it.
   */
  ensureDbDecrypted: (dbId: string) => void;
  /**
   * Mark the start of an add-data-source request. Reference-counted, so
   * overlapping adds don't clear each other early. Pair with `endAddingDb`
   * and bind both to the request lifetime (a promise's `finally` or a
   * socket's `onclose`), not a component effect, so the lock outlives a form
   * that unmounts mid-request.
   */
  beginAddingDb: () => void;
  /** Mark the end of an add-data-source request (pair with `beginAddingDb`). */
  endAddingDb: () => void;
}

// Create separate contexts
const OrganizationDbDataContext = createContext<
  OrganizationDbDataContextType | undefined
>(undefined);

const OrganizationDbActionsContext = createContext<
  OrganizationDbActionsContextType | undefined
>(undefined);

// Specialized hooks
export const useOrganizationDbData = () => {
  const context = useContext(OrganizationDbDataContext);

  if (!context) {
    throw new Error(
      "useOrganizationDbData must be used within an OrganizationDbProvider",
    );
  }
  return context;
};

export const useOrganizationDbActions = () => {
  const context = useContext(OrganizationDbActionsContext);

  if (!context) {
    throw new Error(
      "useOrganizationDbActions must be used within an OrganizationDbProvider",
    );
  }
  return context;
};

// Compute unified status from individual task statuses.
function computeUnifiedStatus(
  schemaStatus: SchemaDescriptionStatus | undefined,
  edaStatus: EDAStatus | undefined,
): UnifiedStatus {
  // Schema status is PRIMARY indicator
  if (schemaStatus === "FAILED") return "FAILED";
  if (schemaStatus === "COMPLETED") return "COMPLETED"; // Regardless of EDA!
  if (schemaStatus === "PENDING") return "IN_PROGRESS";

  // Schema is NONE - check EDA as SECONDARY indicator
  if (edaStatus === "FAILED") return "FAILED";
  if (edaStatus === "PENDING" || edaStatus === "COMPLETED")
    return "IN_PROGRESS";

  // Both NONE
  return "NOT_STARTED";
}

export const OrganizationDbProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { t } = useTranslation("database");
  const [state, dispatch] = useReducer(reducer, initialState);
  // Counter (not a boolean) so overlapping adds don't clear each other early.
  const [addingDbCount, setAddingDbCount] = React.useState(0);
  const beginAddingDb = useCallback(() => {
    setAddingDbCount((count) => count + 1);
  }, []);
  const endAddingDb = useCallback(() => {
    setAddingDbCount((count) => Math.max(0, count - 1));
  }, []);
  const isAddingDb = addingDbCount > 0;
  const { organizationDetails, isFeatureEnabled, FEATURE_FLAGS } =
    useOrgFeatures();
  // The org DB list backs both the datasources management UI *and* the chat
  // input bar (which picks `selectedDatabaseId` for chat queries). Fetch when
  // either feature needs it. Only true blockers (org-viewer with neither flag)
  // skip the call to avoid the 403.
  const canViewDatasources = isFeatureEnabled(FEATURE_FLAGS.VIEW_DATASOURCES);
  const canViewChats = isFeatureEnabled(FEATURE_FLAGS.VIEW_CHATS);
  const needsOrgDbs = canViewDatasources || canViewChats;
  // Listen for WebSocket status events
  const { events: statusEvents } = useOrgDbStatusEvents();
  const { events: ingestionEvents } = useIngestionEvents();

  // Ref for stable access to current state without causing re-renders
  const stateRef = useRef<OrganizationDbState>(state);
  stateRef.current = state;

  // Ref for organizationDetails to avoid dependency changes
  const organizationDetailsRef = useRef(organizationDetails);
  organizationDetailsRef.current = organizationDetails;

  useEffect(() => {
    if (statusEvents.length === 0) return;

    const event = statusEvents[0];
    const { orgdb_id, task_type, status } = event.data;

    // Find database in current state
    const db = stateRef.current.organizationDbs.find(
      (d) => d.orgdb_id === orgdb_id,
    );

    if (!db) return; // Database not in our list

    // Map event task_type to status fields
    const newSchemaStatus =
      task_type === "SCHEMA_DESCRIPTION"
        ? (status as SchemaDescriptionStatus)
        : db.schema_description_status;
    const newEdaStatus =
      task_type === "EDA" ? (status as EDAStatus) : db.eda_status;

    // Compute unified status from both task statuses
    const newUnifiedStatus = computeUnifiedStatus(
      newSchemaStatus,
      newEdaStatus,
    );

    // Dispatch update
    dispatch({
      type: actionTypes.UPDATE_UNIFIED_STATUS,
      payload: {
        dbId: orgdb_id,
        unifiedStatus: newUnifiedStatus,
        ...(task_type === "SCHEMA_DESCRIPTION" && {
          schemaDescriptionStatus: status as SchemaDescriptionStatus,
        }),
        ...(task_type === "EDA" && { edaStatus: status as EDAStatus }),
      },
    });
  }, [statusEvents]);

  // Drives unified_status transitions for newly-connected DBs via
  // /llm/notifications/stream. etl.completed is the COMPLETED trigger;
  // ingestion.failed flips to FAILED.
  useEffect(() => {
    if (ingestionEvents.length === 0) return;

    const event = ingestionEvents[0];

    if (event.type === "etl.completed") {
      const { orgdb_id } = event.data;
      const db = stateRef.current.organizationDbs.find(
        (d) => d.orgdb_id === orgdb_id,
      );

      if (!db) return;

      dispatch({
        type: actionTypes.UPDATE_UNIFIED_STATUS,
        payload: { dbId: orgdb_id, unifiedStatus: "COMPLETED" },
      });
      return;
    }

    if (event.type === "ingestion.failed") {
      // ingestion.failed is keyed by data_source_id (not orgdb_id) — look up the DB
      const { data_source_id } = event.data;
      const db = stateRef.current.organizationDbs.find(
        (d) => d.data_source_id === data_source_id,
      );

      if (!db) return;

      dispatch({
        type: actionTypes.UPDATE_UNIFIED_STATUS,
        payload: {
          dbId: db.orgdb_id,
          unifiedStatus: "FAILED",
        },
      });
    }
  }, [ingestionEvents]);

  // Decrypt a single db's secret fields synchronously, on demand. Only invoked
  // when a db's detail page is opened (via `ensureDbDecrypted`), so the cost is
  // one db's worth of PBKDF2 — no main-thread storm, no worker/batching needed.
  const decryptDbData = useCallback((db: OrganizationDb) => {
    if (db.is_decrypted) return;

    try {
      // Prefer connection URL when individual fields are null (agentic connectors)
      const hasConnectionUrl = db.orgdb_connection_url_encrypted;
      const hasIndividualFields = db.orgdb_hostname_encrypted;

      let decryptedData: {
        name: string;
        host: string;
        username: string;
        port?: string;
        schema?: string;
        username_ro?: string;
        password_ro?: string;
      };

      if (hasConnectionUrl && !hasIndividualFields) {
        const decryptedUrl = decrypt(db.orgdb_connection_url_encrypted!);
        const parsed = parseConnectionUrl(decryptedUrl);
        decryptedData = {
          name: db.orgdb_name_encrypted
            ? decrypt(db.orgdb_name_encrypted)
            : parsed.database,
          host: parsed.host,
          username: parsed.username,
          port: parsed.port,
          schema: parsed.schema,
        };
      } else {
        decryptedData = {
          name: decrypt(db.orgdb_name_encrypted || ""),
          host: decrypt(db.orgdb_hostname_encrypted || ""),
          username: decrypt(db.orgdb_username_encrypted || ""),
        };
      }

      if (db.orgdb_username_ro_enc) {
        decryptedData.username_ro = decrypt(db.orgdb_username_ro_enc);
      }
      if (db.orgdb_password_ro_enc) {
        decryptedData.password_ro = decrypt(db.orgdb_password_ro_enc);
      }

      dispatch({
        type: actionTypes.SET_DECRYPTED_DBS,
        payload: {
          id: db.orgdb_id,
          data: decryptedData,
        },
      });
    } catch (error) {
      console.error("Decryption failed:", error);
      toast.error(t("errors.decryptionFailed"));
    }
  }, []);

  const fetchOrganizationDbs = useCallback(async (orgId: string) => {
    try {
      const dbs = await getOrganizationDbs(orgId);

      // Decryption is lazy now (per-db, when a detail page opens), so the
      // list is ready the moment it arrives — flip loading off immediately
      // for both empty and non-empty results.
      dispatch({
        type: actionTypes.FETCH_ORGANIZATION_DBS,
        payload: { loading: false, data: dbs },
      });
    } catch (error) {
      console.error("Failed to fetch organization DBs:", error);
      dispatch({
        type: actionTypes.FETCH_ORGANIZATION_DBS,
        payload: {
          loading: false,
          error: t("errors.fetchFailed"),
        },
      });
      toast.error(t("errors.loadFailed"));
    }
  }, []);

  // Ensure a single db is decrypted on demand. Called when a db's detail page
  // opens; no-op if the db is missing or already decrypted (idempotent).
  const ensureDbDecrypted = useCallback(
    (dbId: string) => {
      const db = stateRef.current.organizationDbs.find(
        (d) => d.orgdb_id === dbId,
      );

      if (db && !db.is_decrypted) {
        decryptDbData(db);
      }
    },
    [decryptDbData],
  );

  const addOrganizationDb = useCallback(
    async (params: CreateOrganizationDbDecryptedParams) => {
      try {
        const encryptedParams = {
          org_id: params.org_id,
          orgdb_hostname_encrypted: encrypt(params.orgdb_hostname_decrypted),
          orgdb_username_encrypted: encrypt(params.orgdb_username_decrypted),
          orgdb_password_encrypted: encrypt(params.orgdb_password_decrypted),
          orgdb_name_encrypted: encrypt(params.orgdb_name_decrypted),
          orgdb_port: params.orgdb_port,
          orgdb_schema: params.orgdb_schema,
          db_type: params.db_type,
          is_text2sql: params.is_text2sql,
          ...(params.orgdb_username_ro_decrypted && {
            orgdb_username_ro_enc: encrypt(params.orgdb_username_ro_decrypted),
          }),
          ...(params.orgdb_password_ro_decrypted && {
            orgdb_password_ro_enc: encrypt(params.orgdb_password_ro_decrypted),
          }),
        };

        const newDb = await createOrganizationDb(encryptedParams);

        const decryptedDb = {
          ...newDb,
          orgdb_name_decrypted: params.orgdb_name_decrypted,
          orgdb_hostname_decrypted: params.orgdb_hostname_decrypted,
          orgdb_username_decrypted: params.orgdb_username_decrypted,
          // Values came from the user, so they're already plaintext — trust them
          // and skip the on-demand re-decrypt when the detail page opens.
          is_decrypted: true,
        };

        dispatch({
          type: actionTypes.ADD_ORGANIZATION_DB,
          payload: decryptedDb,
        });
        toast.success(t("actions.addSuccess"));

        // Return the new database ID for navigation
        // Note: Status updates now come via WebSocket events
        return newDb.orgdb_id;
      } catch (error) {
        console.error("Failed to add organization DB:", error);
        handleDbOperationError(
          error,
          "actions.addFailed",
          t,
          toast,
          isAxiosError,
        );
        throw error;
      }
    },
    [],
  );

  const updateDb = useCallback(
    async (dbId: string, params: UpdateOrganizationDbDecryptedParams) => {
      try {
        const encryptedParams = {
          orgdb_hostname_encrypted: encrypt(params.orgdb_hostname_decrypted),
          orgdb_username_encrypted: encrypt(params.orgdb_username_decrypted),
          orgdb_password_encrypted: encrypt(params.orgdb_password_decrypted),
          orgdb_name_encrypted: encrypt(params.orgdb_name_decrypted),
          orgdb_port: params.orgdb_port,
          orgdb_schema: params.orgdb_schema,
          db_type: params.db_type,
          ...(params.orgdb_username_ro_decrypted && {
            orgdb_username_ro_enc: encrypt(params.orgdb_username_ro_decrypted),
          }),
          ...(params.orgdb_password_ro_decrypted && {
            orgdb_password_ro_enc: encrypt(params.orgdb_password_ro_decrypted),
          }),
        };

        const updatedDb = await updateOrganizationDb(dbId, encryptedParams);

        const decryptedDb = {
          ...updatedDb,
          orgdb_name_decrypted: params.orgdb_name_decrypted,
          orgdb_hostname_decrypted: params.orgdb_hostname_decrypted,
          orgdb_username_decrypted: params.orgdb_username_decrypted,
          ...(params.orgdb_username_ro_decrypted && {
            orgdb_username_ro_decrypted: params.orgdb_username_ro_decrypted,
          }),
          ...(params.orgdb_password_ro_decrypted && {
            orgdb_password_ro_decrypted: params.orgdb_password_ro_decrypted,
          }),
          // Values came from the user — already plaintext, so trust them and
          // skip the on-demand re-decrypt.
          is_decrypted: true,
        };
        dispatch({
          type: actionTypes.UPDATE_ORGANIZATION_DB,
          payload: decryptedDb,
        });
        toast.success(t("actions.updateSuccess"));
      } catch (error) {
        console.error("Failed to update organization DB:", error);
        handleDbOperationError(
          error,
          "actions.updateFailed",
          t,
          toast,
          isAxiosError,
        );
        throw error;
      }
    },
    [],
  );

  const updateDbByUrl = useCallback(
    async (dbId: string, params: UpdateOrganizationDbUrlParams) => {
      try {
        const updatedDb = await updateOrganizationDb(dbId, {
          orgdb_connection_url_encrypted: params.orgdb_connection_url_encrypted,
          db_type: params.db_type,
          is_agentic: params.is_agentic,
        });

        dispatch({
          type: actionTypes.UPDATE_ORGANIZATION_DB,
          payload: updatedDb,
        });
        toast.success(t("actions.updateSuccess"));
      } catch (error) {
        console.error("Failed to update organization DB:", error);
        handleDbOperationError(
          error,
          "actions.updateFailed",
          t,
          toast,
          isAxiosError,
        );
        throw error;
      }
    },
    [],
  );

  const deleteDb = useCallback(
    async (dbId: string, options?: { silent?: boolean }) => {
      try {
        const response = await deleteOrganizationDb(dbId);
        dispatch({ type: actionTypes.DELETE_ORGANIZATION_DB, payload: dbId });

        // If a new default database was assigned, update the state
        if (response.data.new_default_orgdb_id) {
          dispatch({
            type: actionTypes.SET_DEFAULT_DB,
            payload: response.data.new_default_orgdb_id,
          });
        }

        if (!options?.silent) toast.success(t("actions.deleteSuccess"));
      } catch (error) {
        console.error("Failed to delete organization DB:", error);
        if (!options?.silent) toast.error(t("actions.deleteFailed"));
        throw error;
      }
    },
    [],
  );

  const renameDb = useCallback(async (dbId: string, displayName: string) => {
    const existingDb = stateRef.current.organizationDbs.find(
      (db) => db.orgdb_id === dbId,
    );

    if (!existingDb) return;

    // Optimistically update the name so the UI reflects it immediately.
    dispatch({
      type: actionTypes.UPDATE_ORGANIZATION_DB,
      payload: {
        ...existingDb,
        display_name: displayName,
      },
    });

    try {
      const updatedDb = await updateOrganizationDb(dbId, {
        display_name: displayName,
      });
      dispatch({
        type: actionTypes.UPDATE_ORGANIZATION_DB,
        payload: {
          ...existingDb,
          ...updatedDb,
          display_name: displayName,
        },
      });
      toast.success(t("actions.updateSuccess"));
    } catch (error) {
      console.error("Failed to rename organization DB:", error);
      // Roll back to the previous name on failure.
      dispatch({
        type: actionTypes.UPDATE_ORGANIZATION_DB,
        payload: existingDb,
      });
      handleDbOperationError(
        error,
        "actions.updateFailed",
        t,
        toast,
        isAxiosError,
      );
      throw error;
    }
  }, []);

  const setDefaultDatabase = useCallback(async (dbId: string) => {
    const orgDetails = organizationDetailsRef.current;

    if (!orgDetails?.org_id) {
      toast.error(t("validation.orgIdRequired"));
      return;
    }

    try {
      await setDefaultDb(orgDetails.org_id, dbId);

      // Update local state optimistically
      dispatch({
        type: actionTypes.SET_DEFAULT_DB,
        payload: dbId,
      });

      toast.success(t("actions.defaultUpdateSuccess"));
    } catch (error) {
      console.error("Failed to set default DB:", error);
      toast.error(t("actions.defaultUpdateFailed"));
      throw error;
    }
  }, []); // Empty deps - uses ref for orgDetails

  // STABLE getDbById using ref pattern - doesn't recreate on state changes
  const getDbById = useCallback((dbId: string) => {
    return (
      stateRef.current.organizationDbs.find((db) => db.orgdb_id === dbId) ||
      null
    );
  }, []); // Empty deps = stable forever

  // STABLE updateDbStateById using ref pattern
  const updateDbStateById = useCallback(
    (dbId: string, updates: Partial<OrganizationDb>) => {
      const existingDb = stateRef.current.organizationDbs.find(
        (db) => db.orgdb_id === dbId,
      );

      if (!existingDb) return;

      dispatch({
        type: actionTypes.UPDATE_ORGANIZATION_DB,
        payload: { ...existingDb, ...updates },
      });
    },
    [],
  ); // Empty deps = stable forever

  // Fetch DBs when organization changes
  useEffect(() => {
    // Roles that need DB data for neither chat nor datasources (org-viewer)
    // get a 403 from get_organization_dbs. Skip the call entirely.
    if (!needsOrgDbs) {
      dispatch({
        type: actionTypes.FETCH_ORGANIZATION_DBS,
        payload: { loading: false },
      });
      return;
    }
    if (organizationDetails?.org_id) {
      fetchOrganizationDbs(organizationDetails.org_id);
    }
  }, [organizationDetails?.org_id, needsOrgDbs]);

  // Get default DB from state
  const defaultDb = useMemo(
    () => state.organizationDbs.find((db) => db.is_default) || null,
    [state.organizationDbs],
  );

  // Memoize DATA context value - changes when state changes
  const dataValue = useMemo<OrganizationDbDataContextType>(
    () => ({
      organizationDbs: state.organizationDbs,
      loading: state.loading,
      error: state.error,
      defaultDb,
      getDbById,
      isAddingDb,
    }),
    [
      state.organizationDbs,
      state.loading,
      state.error,
      defaultDb,
      getDbById,
      isAddingDb,
    ],
  );

  // Memoize ACTIONS context value - stable, rarely changes
  const actionsValue = useMemo<OrganizationDbActionsContextType>(
    () => ({
      fetchOrganizationDbs,
      addOrganizationDb,
      updateDb,
      updateDbByUrl,
      deleteDb,
      renameDb,
      setDefaultDatabase,
      updateDbStateById,
      ensureDbDecrypted,
      beginAddingDb,
      endAddingDb,
    }),
    [
      fetchOrganizationDbs,
      addOrganizationDb,
      updateDb,
      updateDbByUrl,
      deleteDb,
      renameDb,
      setDefaultDatabase,
      updateDbStateById,
      ensureDbDecrypted,
      beginAddingDb,
      endAddingDb,
    ],
  );

  // Nest providers: Actions (outer) -> Data (inner)
  // Components using only actions won't re-render when data changes
  return (
    <OrganizationDbActionsContext.Provider value={actionsValue}>
      <OrganizationDbDataContext.Provider value={dataValue}>
        {children}
      </OrganizationDbDataContext.Provider>
    </OrganizationDbActionsContext.Provider>
  );
};
