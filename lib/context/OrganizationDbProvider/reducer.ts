import {
  OrganizationDb,
  SchemaDescriptionStatus,
  EDAStatus,
  UnifiedStatus,
} from "@/lib/services/organizationDbService";
import * as actionTypes from "./actionTypes";

export interface OrganizationDbState {
  organizationDbs: OrganizationDb[];
  loading: boolean;
  error: string | null;
}

export const initialState: OrganizationDbState = {
  organizationDbs: [],
  loading: true,
  error: null,
};

type Action =
  | { type: typeof actionTypes.SET_ORGANIZATION_DBS; payload: OrganizationDb[] }
  | { type: typeof actionTypes.ADD_ORGANIZATION_DB; payload: OrganizationDb }
  | { type: typeof actionTypes.UPDATE_ORGANIZATION_DB; payload: OrganizationDb }
  | { type: typeof actionTypes.DELETE_ORGANIZATION_DB; payload: string }
  | { type: typeof actionTypes.SET_DEFAULT_DB; payload: string }
  | {
      type: typeof actionTypes.FETCH_ORGANIZATION_DBS;
      payload: {
        loading: boolean;
        data?: OrganizationDb[];
        error?: string;
      };
    }
  | {
      type: typeof actionTypes.SET_DECRYPTED_DBS;
      payload: {
        id: string;
        data: {
          name: string;
          host: string;
          username: string;
          port?: string;
          schema?: string;
          username_ro?: string;
          password_ro?: string;
        };
      };
    }
  | {
      type: typeof actionTypes.UPDATE_UNIFIED_STATUS;
      payload: {
        dbId: string;
        unifiedStatus: UnifiedStatus;
        schemaDescriptionStatus?: SchemaDescriptionStatus;
        edaStatus?: EDAStatus;
      };
    };

export const reducer = (
  state: OrganizationDbState,
  action: Action,
): OrganizationDbState => {
  switch (action.type) {
    case actionTypes.SET_ORGANIZATION_DBS:
      return {
        ...state,
        organizationDbs: action.payload,
      };
    case actionTypes.ADD_ORGANIZATION_DB:
      return {
        ...state,
        organizationDbs: [...state.organizationDbs, action.payload],
      };
    case actionTypes.UPDATE_ORGANIZATION_DB:
      return {
        ...state,
        organizationDbs: state.organizationDbs.map((db) =>
          db.orgdb_id === action.payload.orgdb_id ? action.payload : db,
        ),
      };
    case actionTypes.DELETE_ORGANIZATION_DB:
      return {
        ...state,
        organizationDbs: state.organizationDbs.filter(
          (db) => db.orgdb_id !== action.payload,
        ),
      };
    case actionTypes.SET_DEFAULT_DB:
      return {
        ...state,
        organizationDbs: state.organizationDbs.map((db) => ({
          ...db,
          is_default: false,
          ...(db.orgdb_id === action.payload && { is_default: true }),
        })),
      };
    case actionTypes.FETCH_ORGANIZATION_DBS:
      return {
        ...state,
        loading: action.payload.loading,
        organizationDbs: action.payload.data || state.organizationDbs,
        error: action.payload.error || null,
      };

    case actionTypes.SET_DECRYPTED_DBS:
      return {
        ...state,
        organizationDbs: state.organizationDbs.map((db) => {
          if (db.orgdb_id === action.payload.id && !db.is_decrypted) {
            const { data } = action.payload;
            return {
              ...db,
              orgdb_name_decrypted: data.name,
              orgdb_hostname_decrypted: data.host,
              orgdb_username_decrypted: data.username,
              // Override port/schema if parsed from connection URL
              ...(data.port && { orgdb_port: parseInt(data.port, 10) }),
              ...(data.schema && { orgdb_schema: data.schema }),
              ...(data.username_ro && {
                orgdb_username_ro_decrypted: data.username_ro,
              }),
              ...(data.password_ro && {
                orgdb_password_ro_decrypted: data.password_ro,
              }),
              is_decrypted: true,
            };
          }
          return db;
        }),
      };

    case actionTypes.UPDATE_UNIFIED_STATUS:
      return {
        ...state,
        organizationDbs: state.organizationDbs.map((db) =>
          db.orgdb_id === action.payload.dbId
            ? {
                ...db,
                unified_status: action.payload.unifiedStatus,
                ...(action.payload.schemaDescriptionStatus !== undefined && {
                  schema_description_status:
                    action.payload.schemaDescriptionStatus,
                }),
                ...(action.payload.edaStatus !== undefined && {
                  eda_status: action.payload.edaStatus,
                }),
              }
            : db,
        ),
      };

    default:
      return state;
  }
};
