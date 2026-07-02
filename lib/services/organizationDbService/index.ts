import { getAxiosInstance } from "@/lib/services/axiosInstances";

export const SCHEMA_DESCRIPTION_STATUS = {
  COMPLETED: "COMPLETED",
  PENDING: "PENDING",
  FAILED: "FAILED",
  NONE: "NONE",
} as const;

export type SchemaDescriptionStatus =
  (typeof SCHEMA_DESCRIPTION_STATUS)[keyof typeof SCHEMA_DESCRIPTION_STATUS];

export const EDA_STATUS = {
  COMPLETED: "COMPLETED",
  PENDING: "PENDING",
  FAILED: "FAILED",
  NONE: "NONE",
} as const;

export type EDAStatus = (typeof EDA_STATUS)[keyof typeof EDA_STATUS];

export const UNIFIED_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type UnifiedStatus =
  (typeof UNIFIED_STATUS)[keyof typeof UNIFIED_STATUS];

// New Rules API Types
export interface OrgDbRule {
  orgdb_rule_id: string;
  orgdb_id: string;
  category: string;
  title: string;
  rule: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgDbRuleParams {
  category: string;
  title: string;
  rule: string;
  is_active: boolean;
}

interface OrgDbRuleResponse {
  status_code: number;
  message: string;
  data: OrgDbRule;
}

interface OrgDbRulesListResponse {
  status_code: number;
  message: string;
  data: {
    orgdb_id: string;
    rules: OrgDbRule[];
    total_count: number;
  };
}

// New Examples API Types
export interface OrgDbExample {
  orgdb_example_id: string;
  orgdb_id: string;
  category: string;
  title: string;
  example: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgDbExampleParams {
  category: string;
  title: string;
  example: string;
  is_active: boolean;
}

interface OrgDbExampleResponse {
  status_code: number;
  message: string;
  data: OrgDbExample;
}

interface OrgDbExamplesListResponse {
  status_code: number;
  message: string;
  data: {
    orgdb_id: string;
    examples: OrgDbExample[];
    total_count: number;
  };
}

export interface OrganizationDb {
  orgdb_id: string;
  orgdb_hostname_encrypted: string | null;
  orgdb_hostname_decrypted: string;
  orgdb_username_encrypted: string | null;
  orgdb_username_decrypted: string;
  orgdb_port: number | null;
  orgdb_schema: string | null;
  org_id: string;
  is_deleted: boolean;
  orgdb_name_encrypted: string | null;
  orgdb_name_decrypted: string;
  db_type: string;
  is_text2sql: boolean;
  is_default: boolean;
  is_connected: boolean;
  is_decrypted: boolean;
  has_data_source: boolean;
  display_name: string;
  unified_status: UnifiedStatus;
  updated_at?: string;
  schema_description_status?: SchemaDescriptionStatus;
  eda_status?: EDAStatus;
  data_source_id?: string;
  orgdb_username_ro_enc?: string;
  orgdb_password_ro_enc?: string;
  orgdb_username_ro_decrypted?: string;
  orgdb_password_ro_decrypted?: string;
  orgdb_connection_url_encrypted?: string | null;
}

interface OrganizationDbResponse {
  status_code: number;
  message: string;
  data: OrganizationDb[];
}

interface SingleOrganizationDbResponse {
  data: OrganizationDb;
  status_code: number;
  message: string;
  connection_valid: boolean;
  has_create_permissions: boolean;
  has_select_permissions: boolean;
}

export interface CreateOrganizationDbDecryptedParams {
  org_id: string;
  orgdb_hostname_decrypted: string;
  orgdb_username_decrypted: string;
  orgdb_password_decrypted: string;
  orgdb_name_decrypted: string;
  orgdb_port: number;
  orgdb_schema: string;
  is_text2sql?: boolean;
  db_type: string;
  orgdb_username_ro_decrypted?: string;
  orgdb_password_ro_decrypted?: string;
}

export interface CreateOrganizationDbEncryptedParams {
  org_id: string;
  orgdb_hostname_encrypted: string;
  orgdb_username_encrypted: string;
  orgdb_password_encrypted: string;
  orgdb_name_encrypted: string;
  orgdb_port: number;
  orgdb_schema: string;
  is_text2sql?: boolean;
  db_type: string;
  orgdb_username_ro_enc?: string;
  orgdb_password_ro_enc?: string;
}

export interface UpdateOrganizationDbDecryptedParams {
  orgdb_hostname_decrypted: string;
  orgdb_username_decrypted: string;
  orgdb_password_decrypted: string;
  orgdb_name_decrypted: string;
  orgdb_port: number;
  orgdb_schema: string;
  is_text2sql?: boolean;
  db_type: string;
  orgdb_username_ro_decrypted?: string;
  orgdb_password_ro_decrypted?: string;
}

export interface UpdateOrganizationDbEncryptedParams {
  orgdb_hostname_encrypted?: string;
  orgdb_username_encrypted?: string;
  orgdb_password_encrypted?: string;
  orgdb_name_encrypted?: string;
  orgdb_port?: number;
  orgdb_schema?: string;
  is_text2sql?: boolean;
  db_type?: string;
  orgdb_username_ro_enc?: string;
  orgdb_password_ro_enc?: string;
  orgdb_connection_url_encrypted?: string;
  is_agentic?: boolean;
  display_name?: string;
}

interface SetDefaultDbResponse {
  status_code: number;
  message: string;
  data: string;
}

export interface DatabaseColumn {
  column_name: string;
  column_uuid: string;
  column_type: string;
  column_description: string;
  column_confidence: number;
  column_user_suggestion: string | null;
  suggestion_resolve_status: "pending" | "resolved" | "approved";
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  foreign_key_table?: string;
  foreign_key_column?: string;
}

export type DatabaseTable = Readonly<{
  table_name: string;
  object_type: "table" | "view";
  row_count?: number;
  row_count_approx?: boolean;
  // table_description?: string;
  table_columns: DatabaseColumn[];
}>;

interface GetDescriptionResponse {
  status_code: number;
  message: string;
  data: DatabaseTable[];
}

interface UpdateColumnDescriptionResponse {
  status_code: number;
  message: string;
  data: string;
}

interface SuggestColumnDescriptionResponse {
  status_code: number;
  message: string;
  data: string;
}

interface EdaReportResponse {
  eda_report: string;
}

// Table Data Types
export interface TableDataRequest {
  orgdb_id: string;
  table_name: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  filters?: Record<string, any>;
}

export interface TableDataPagination {
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TableDataResponse {
  records: Record<string, any>[];
  total_rows: number;
  total_columns: number;
  latency: string;
  pagination: TableDataPagination;
}

interface GetTableDataApiResponse {
  status: string;
  data: TableDataResponse;
}

// SQL Validation Types
interface ValidateSqlExampleRequest {
  orgdb_id: string;
  sql_query: string;
}

export interface ValidateSqlExampleResponse {
  valid: boolean;
  error_message: string | null;
  execution_plan?: any;
}

interface ValidateSqlExampleApiResponse {
  status_code: number;
  message: string;
  data: ValidateSqlExampleResponse;
}

// Delete Organization Database Types
interface DeletedItems {
  organization_db: number;
  data_sources: number;
  schema_descriptions: number;
  projects_updated: number;
}

export interface DeleteOrganizationDbResponse {
  status_code: number;
  message: string;
  data: {
    deleted_items: DeletedItems;
    new_default_orgdb_id?: string;
  };
}

// ***************
// APIs start here
// ***************

export const getOrganizationDbs = async (
  orgId: string,
): Promise<OrganizationDb[]> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<OrganizationDbResponse>(
    `/text2sql/get_organization_dbs/${orgId}`,
  );
  return response.data.data;
};

export const createOrganizationDb = async (
  params: CreateOrganizationDbEncryptedParams,
): Promise<OrganizationDb> => {
  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.post<SingleOrganizationDbResponse>(
    `/text2sql/create_organization_dbs`,
    params,
  );

  return response.data.data;
};

export const updateOrganizationDb = async (
  dbId: string,
  params: UpdateOrganizationDbEncryptedParams,
): Promise<OrganizationDb> => {
  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.put<SingleOrganizationDbResponse>(
    `/text2sql/update_organization_dbs/${dbId}`,
    params,
  );

  return response.data.data;
};

export const deleteOrganizationDb = async (
  dbId: string,
): Promise<DeleteOrganizationDbResponse> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete<DeleteOrganizationDbResponse>(
    `/text2sql/delete_organization_db/${dbId}`,
  );
  return response.data;
};

export const setDefaultDb = async (
  orgId: string,
  dbId: string,
): Promise<string> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put<SetDefaultDbResponse>(
    `/text2sql/update_default_orgdb`,
    null,
    {
      params: {
        org_uuid: orgId,
        org_db_uuid: dbId,
      },
    },
  );
  return response.data.data;
};

// @deprecated FE no longer fetches schema_descriptions; tables come from listTables only
export const getDbDescription = async (
  dbId: string,
): Promise<DatabaseTable[]> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<GetDescriptionResponse>(
    `/text2sql/get_description`,
    {
      params: {
        orgdb_uuid: dbId,
      },
    },
  );
  return response.data.data;
};

export const updateColumnDescription = async (
  columnUuid: string,
  description: string,
): Promise<string> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put<UpdateColumnDescriptionResponse>(
    `/text2sql/update_column_description`,
    null,
    {
      params: {
        column_uuid: columnUuid,
        final_description: description,
      },
    },
  );
  return response.data.data;
};

export const suggestColumnDescription = async (
  columnUuid: string,
  suggestedDescription: string,
): Promise<string> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put<SuggestColumnDescriptionResponse>(
    `/text2sql/suggest_column_description`,
    null,
    {
      params: {
        column_uuid: columnUuid,
        suggested_description: suggestedDescription,
      },
    },
  );
  return response.data.data;
};

export const generateEdaReport = async (
  orgDbId: string,
): Promise<EdaReportResponse> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<EdaReportResponse>(
    `/text2sql/eda_report`,
    null,
    {
      params: {
        orgdb_id: orgDbId,
      },
    },
  );
  return response.data;
};

// @deprecated Imported only by DatabaseDescriptionProvider.handleGenerateSchemaDescription which is itself unused
export const generateSchemaDescription = async (orgdb_id: string) => {
  const axiosInstance = getAxiosInstance();
  const { data } = await axiosInstance.post(
    `/text2sql/generate_schema_description`,
    { orgdb_id },
  );
  return data;
};

type ListTablesApiItem = Readonly<{
  name: string;
  row_count?: number;
  row_count_approx?: boolean;
}>;

type ListTablesApiResponse = Readonly<{
  status: string;
  data: { tables: ListTablesApiItem[]; views: ListTablesApiItem[] };
}>;

export type ListTablesResult = Readonly<{
  tables: ListTablesApiItem[];
  views: ListTablesApiItem[];
}>;

export const listTables = async (
  orgDbId: string,
): Promise<ListTablesResult> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<ListTablesApiResponse>(
    "/text2sql/list_tables",
    { orgdb_id: orgDbId },
    { timeout: 30_000 },
  );
  return {
    tables: response.data.data.tables ?? [],
    views: response.data.data.views ?? [],
  };
};

export const getTableData = async (
  params: TableDataRequest,
): Promise<TableDataResponse> => {
  const axiosInstance = getAxiosInstance();

  // Set defaults for optional parameters
  const requestParams = {
    orgdb_id: params.orgdb_id,
    table_name: params.table_name,
    page: params.page || 1,
    page_size: params.page_size || 10,
    sort_by: params.sort_by,
    sort_order: params.sort_order || "asc",
    filters: params.filters,
  };

  const response = await axiosInstance.post<GetTableDataApiResponse>(
    "/text2sql/get_table_data",
    requestParams,
    { timeout: 60_000 },
  );

  return response.data.data;
};

export const validateSqlExample = async (
  orgdbId: string,
  sqlQuery: string,
): Promise<ValidateSqlExampleResponse> => {
  const axiosInstance = getAxiosInstance();

  const request: ValidateSqlExampleRequest = {
    orgdb_id: orgdbId,
    sql_query: sqlQuery,
  };

  const response = await axiosInstance.post<ValidateSqlExampleApiResponse>(
    "/text2sql/validate_sql_example",
    request,
  );

  return response.data.data;
};

// ***************
// New Rules APIs
// ***************

export const getOrgDbRules = async (
  orgdbId: string,
  activeOnly: boolean = false,
): Promise<OrgDbRule[]> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<OrgDbRulesListResponse>(
    `/text2sql/orgdb_rules/${orgdbId}`,
    {
      params: {
        active_only: activeOnly,
      },
    },
  );
  return response.data.data.rules;
};

export const createOrgDbRule = async (
  orgdbId: string,
  ruleData: OrgDbRuleParams,
): Promise<OrgDbRule> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<OrgDbRuleResponse>(
    `/text2sql/orgdb_rules/${orgdbId}`,
    ruleData,
  );
  return response.data.data;
};

export const updateOrgDbRule = async (
  ruleId: string,
  ruleData: OrgDbRuleParams,
): Promise<OrgDbRule> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put<OrgDbRuleResponse>(
    `/text2sql/orgdb_rules/${ruleId}`,
    ruleData,
  );
  return response.data.data;
};

export const deleteOrgDbRule = async (ruleId: string): Promise<void> => {
  const axiosInstance = getAxiosInstance();
  await axiosInstance.delete(`/text2sql/orgdb_rules/${ruleId}`);
};

// ***************
// New Examples APIs
// ***************

export const getOrgDbExamples = async (
  orgdbId: string,
  activeOnly: boolean = false,
): Promise<OrgDbExample[]> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get<OrgDbExamplesListResponse>(
    `/text2sql/orgdb_examples/${orgdbId}`,
    {
      params: {
        active_only: activeOnly,
      },
    },
  );
  return response.data.data.examples;
};

export const createOrgDbExample = async (
  orgdbId: string,
  exampleData: OrgDbExampleParams,
): Promise<OrgDbExample> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<OrgDbExampleResponse>(
    `/text2sql/orgdb_examples/${orgdbId}`,
    exampleData,
  );
  return response.data.data;
};

export const updateOrgDbExample = async (
  exampleId: string,
  exampleData: OrgDbExampleParams,
): Promise<OrgDbExample> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put<OrgDbExampleResponse>(
    `/text2sql/orgdb_examples/${exampleId}`,
    exampleData,
  );
  return response.data.data;
};

export const deleteOrgDbExample = async (exampleId: string): Promise<void> => {
  const axiosInstance = getAxiosInstance();
  await axiosInstance.delete(`/text2sql/orgdb_examples/${exampleId}`);
};
