// All supported connector identifiers — one entry per database
export type ConnectorId =
  // relational
  | "postgresql"
  | "mysql"
  | "mariadb"
  | "mssql"
  | "oracle"
  | "sqlite"
  | "cockroachdb"
  | "tidb"
  | "yugabytedb"
  | "db2"
  | "hana"
  | "greenplum"
  | "singlestore"
  // cloud / warehouse / lakehouse
  | "snowflake"
  | "bigquery"
  | "redshift"
  | "databricks"
  | "fabric"
  | "athena"
  | "dynamodb"
  | "firestore"
  | "firebolt"
  | "databend"
  | "spanner"
  // analytics
  | "clickhouse"
  | "trino"
  | "cratedb"
  | "teradata"
  | "monetdb"
  | "druid"
  | "impala"
  | "drill"
  | "elasticsearch"
  | "duckdb"
  | "hive"
  | "dremio"
  | "pinot"
  | "solr"
  // nosql
  | "mongodb"
  // specialty / legacy
  | "sybase"
  | "sqlany"
  | "access"
  | "mimer"
  | "firebird"
  | "actian"
  | "neon"
  | "oceanbase"
  | "exasol"
  | "openGauss"
  // files & spreadsheets
  | "gsheets"
  | "csv"
  | "json"
  | "parquet"
  // bi & visualization tools
  | "tableau"
  | "powerbi"
  | "looker"
  | "metabase"
  | "superset"
  | "grafana";

/**
 * Controls which form component ConnectorForm renders.
 *
 * standard     — host/port/db/user/pass; Form + Connection String tabs (default)
 * oauth-only   — single OAuth button; no form, no tabs (e.g. Google Sheets)
 * file         — single file/path input; form only, no connection-string tab
 * file-upload  — drag-and-drop file upload (e.g. CSV, Excel)
 * service      — URL + API credentials; form only, no connection-string tab
 *                (cloud services, BI tools)
 */
export type ConnectorTemplate =
  | "standard"
  | "oauth-only"
  | "file"
  | "file-upload"
  | "service";

export type FieldConfig = {
  name: string;
  label: string;
  /**
   * text      — standard Input
   * password  — Input with show/hide toggle
   * textarea  — Textarea (raw text, e.g. paste-mode connection strings)
   * gcp-oauth — "Sign in with Google" OAuth popup button.
   * select    — Dropdown select with options
   */
  type: "text" | "password" | "textarea" | "gcp-oauth" | "select";
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  /** Options for select field type */
  options?: { value: string; label: string }[];
};

/** Group of fields rendered side-by-side with optional grid template. */
export type FieldGroup = {
  fields: FieldConfig[];
  /** Tailwind grid-cols class. Defaults to "grid-cols-2". */
  gridCols?: string;
};

/** A single field (full-width) or a group of fields rendered side-by-side. */
export type FieldRow = FieldConfig | FieldGroup;

export type ConnectorCategory =
  | "relational"
  | "warehouse"
  | "nosql"
  | "analytics"
  | "enterprise"
  | "files"
  | "bi-tools";

export type Connector = {
  id: ConnectorId;
  name: string;
  logoSrc: string;
  logoHeight: string;
  status: "live" | "coming_soon";
  description: string;
  category: ConnectorCategory;
  dialect: string;
  /**
   * Determines which form component is rendered.
   * Defaults to "standard" when omitted.
   */
  template?: ConnectorTemplate;
  fields: FieldRow[];
  /**
   * Optional i18n key for setup prerequisites shown in a popover next to the
   * connector name on the form's left panel. Resolves to an HTML string.
   */
  setupInstructions?: string;
  buildUrl: (data: Record<string, string>) => string;
  buildDisplayUrl: (data: Record<string, string>) => string;
  pasteModePlaceholder: string;
  /**
   * Optional: Parses a connection URL back into form field values.
   * Used when editing an existing connection.
   */
  parseUrl?: (url: string) => Record<string, string>;
};
