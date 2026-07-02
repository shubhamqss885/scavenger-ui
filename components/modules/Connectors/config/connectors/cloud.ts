import { encodeBase64, gcpOAuthField, simple, standardFields } from "./shared";
import type { Connector } from "./types";

export const cloudConnectors: Connector[] = [
  {
    id: "snowflake",
    name: "Snowflake",
    logoSrc: "/logos/databases/snowflake.png",
    logoHeight: "h-7",
    status: "live",
    description: "Cloud data warehouse",
    category: "warehouse",
    dialect: "snowflake",
    fields: [
      {
        name: "account",
        label: "Account",
        type: "text",
        required: true,
        placeholder: "xy12345.us-east-1",
      },
      {
        fields: [
          {
            name: "warehouse",
            label: "Warehouse",
            type: "text",
            required: true,
            placeholder: "COMPUTE_WH",
          },
          {
            name: "database",
            label: "Database",
            type: "text",
            required: true,
            placeholder: "MY_DB",
          },
        ],
      },
      {
        fields: [
          {
            name: "schema",
            label: "Schema",
            type: "text",
            required: false,
            placeholder: "PUBLIC",
          },
          {
            name: "role",
            label: "Role",
            type: "text",
            required: false,
            placeholder: "SYSADMIN",
          },
        ],
      },
      {
        fields: [
          { name: "username", label: "Username", type: "text", required: true },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    buildUrl: (d) => {
      const params = new URLSearchParams({ warehouse: d.warehouse });

      if (d.role) params.set("role", d.role);
      const schema = d.schema ? `/${d.schema}` : "";
      return `snowflake://${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}@${d.account}/${d.database}${schema}?${params}`;
    },
    buildDisplayUrl: (d) =>
      `snowflake://${d.username}:***@${d.account}/${d.database}?warehouse=${d.warehouse}`,
    pasteModePlaceholder:
      "snowflake://user:password@account/mydb?warehouse=COMPUTE_WH",
    parseUrl: (url) => {
      const result: Record<string, string> = {};
      try {
        const match = url.match(
          /^snowflake:\/\/([^:]+):([^@]*)@([^/]+)\/([^/?]+)\/?([^?]*)?(?:\?(.*))?$/,
        );

        if (match) {
          result.username = decodeURIComponent(match[1]);
          result.account = match[3];
          result.database = match[4];
          result.schema = match[5] || "";
          const params = new URLSearchParams(match[6] || "");
          result.warehouse = params.get("warehouse") || "";
          result.role = params.get("role") || "";
        }
      } catch {
        /* ignore parse errors */
      }
      return result;
    },
  },
  {
    id: "bigquery",
    name: "BigQuery",
    logoSrc: "/logos/databases/bigquery.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Google Cloud serverless data warehouse",
    category: "warehouse",
    dialect: "bigquery",
    template: "service",
    fields: [
      {
        fields: [
          {
            name: "project",
            label: "Project ID",
            type: "text",
            required: true,
            placeholder: "my-gcp-project",
          },
          {
            name: "dataset",
            label: "Dataset",
            type: "text",
            required: false,
            placeholder: "my_dataset",
          },
        ],
      },
      gcpOAuthField(),
    ],
    buildUrl: (d) => {
      const dataset = d.dataset ? `/${d.dataset}` : "";
      return `bigquery://${d.project}${dataset}?credentials_base64=${encodeURIComponent(encodeBase64(d.credentialsJson))}`;
    },
    buildDisplayUrl: (d) => {
      const dataset = d.dataset ? `/${d.dataset}` : "";
      return `bigquery://${d.project}${dataset}?credentials_base64=***`;
    },
    pasteModePlaceholder:
      "bigquery://project/dataset?credentials_base64=<base64_service_account_json>",
  },
  {
    id: "redshift",
    name: "Redshift",
    logoSrc: "/logos/databases/redshift.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "AWS cloud data warehouse",
    category: "warehouse",
    dialect: "redshift",
    fields: standardFields("5439", true),
    buildUrl: (d) => {
      const schema = d.schema ? `?options=--search_path%3D${d.schema}` : "";
      return `redshift+psycopg2://${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}@${d.host}:${d.port}/${d.database}${schema}`;
    },
    buildDisplayUrl: (d) =>
      `redshift+psycopg2://${d.username}:***@${d.host}:${d.port}/${d.database}`,
    pasteModePlaceholder:
      "redshift+psycopg2://user:password@cluster.region.redshift.amazonaws.com:5439/mydb",
  },
  {
    id: "databricks",
    name: "Databricks",
    logoSrc: "/logos/databases/databricks.png",
    logoHeight: "h-7",
    status: "live",
    description: "Lakehouse platform",
    category: "warehouse",
    dialect: "databricks",
    fields: [
      {
        name: "host",
        label: "Host",
        type: "text",
        required: true,
        placeholder: "dbc-xxxxx.cloud.databricks.com",
      },
      {
        name: "httpPath",
        label: "HTTP Path",
        type: "text",
        required: true,
        placeholder: "/sql/1.0/warehouses/xxxxxxxx",
      },
      {
        fields: [
          {
            name: "catalog",
            label: "Catalog",
            type: "text",
            required: false,
            placeholder: "data_analytics",
          },
          {
            name: "schema",
            label: "Schema",
            type: "text",
            required: false,
            placeholder: "default",
          },
        ],
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
        placeholder: "dapi...",
      },
    ],
    buildUrl: (d) => {
      const params = new URLSearchParams({ http_path: d.httpPath });

      if (d.catalog) params.set("catalog", d.catalog);
      if (d.schema) params.set("schema", d.schema);
      return `databricks://token:${encodeURIComponent(d.accessToken)}@${d.host}:443/default?${params}`;
    },
    buildDisplayUrl: (d) =>
      `databricks://token:***@${d.host}:443/default?http_path=${d.httpPath}`,
    pasteModePlaceholder:
      "databricks://token:<access_token>@<host>:443/default?http_path=...",
    parseUrl: (url) => {
      const result: Record<string, string> = {};
      try {
        // Pattern: databricks://token:TOKEN@host:port/default?http_path=...&catalog=...&schema=...
        const match = url.match(
          /^databricks:\/\/token:([^@]*)@([^:]+):\d+\/[^?]*(?:\?(.*))?$/,
        );

        if (match) {
          result.accessToken = ""; // Don't prefill token for security
          result.host = match[2];
          const params = new URLSearchParams(match[3] || "");
          result.httpPath = params.get("http_path") || "";
          result.catalog = params.get("catalog") || "";
          result.schema = params.get("schema") || "";
        }
      } catch {
        /* ignore parse errors */
      }
      return result;
    },
  },
  {
    id: "fabric",
    name: "Microsoft Fabric",
    logoSrc: "/logos/databases/fabric.svg",
    logoHeight: "h-7",
    status: "live",
    description: "Microsoft Fabric Lakehouse SQL Endpoint",
    category: "warehouse",
    dialect: "mssql",
    template: "service",
    setupInstructions: "setupInstructions.fabric",
    fields: [
      {
        name: "host",
        label: "SQL Endpoint",
        type: "text",
        required: true,
        placeholder: "workspace-lakehouse.datawarehouse.fabric.microsoft.com",
      },
      {
        name: "database",
        label: "Database / Lakehouse Name",
        type: "text",
        required: true,
        placeholder: "my_lakehouse",
      },
      {
        fields: [
          {
            name: "clientId",
            label: "Client ID (App ID)",
            type: "text",
            required: true,
            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          },
          {
            name: "clientSecret",
            label: "Client Secret",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    buildUrl: (d) => {
      const clientId = encodeURIComponent(d.clientId);
      const clientSecret = encodeURIComponent(d.clientSecret);
      const driver = encodeURIComponent("ODBC Driver 18 for SQL Server");
      const params = `driver=${driver}&authentication=ActiveDirectoryServicePrincipal&Encrypt=yes&TrustServerCertificate=no`;
      return `mssql+pyodbc://${clientId}:${clientSecret}@${d.host}:1433/${d.database}?${params}`;
    },
    buildDisplayUrl: (d) =>
      `mssql+pyodbc://${d.clientId}:***@${d.host}:1433/${d.database}?authentication=ActiveDirectoryServicePrincipal`,
    pasteModePlaceholder:
      "mssql+pyodbc://client_id:client_secret@workspace.datawarehouse.fabric.microsoft.com:1433/lakehouse?driver=ODBC+Driver+18...&authentication=ActiveDirectoryServicePrincipal",
    parseUrl: (url) => {
      const result: Record<string, string> = {};
      try {
        const match = url.match(
          /^mssql\+pyodbc:\/\/([^:]+):([^@]*)@([^:]+):\d+\/([^?]+)/,
        );

        if (match) {
          result.clientId = decodeURIComponent(match[1]);
          result.host = match[3];
          result.database = match[4];
        }
      } catch {
        /* ignore parse errors */
      }
      return result;
    },
  },
  {
    id: "athena",
    name: "Athena",
    logoSrc: "/logos/databases/athena.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "AWS serverless query service for S3",
    category: "warehouse",
    dialect: "awsathena",
    template: "service",
    fields: [
      {
        name: "region",
        label: "AWS Region",
        type: "text",
        required: true,
        placeholder: "us-east-1",
      },
      {
        name: "s3StagingDir",
        label: "S3 Staging Directory",
        type: "text",
        required: true,
        placeholder: "s3://my-bucket/athena-results/",
      },
      {
        fields: [
          {
            name: "accessKeyId",
            label: "Access Key ID",
            type: "text",
            required: true,
            placeholder: "AKIAIOSFODNN7EXAMPLE",
          },
          {
            name: "secretAccessKey",
            label: "Secret Access Key",
            type: "password",
            required: true,
          },
        ],
      },
      {
        name: "schema",
        label: "Schema (database)",
        type: "text",
        required: false,
        placeholder: "default",
        defaultValue: "default",
      },
    ],
    buildUrl: (d) =>
      `awsathena+rest://${encodeURIComponent(d.accessKeyId)}:${encodeURIComponent(d.secretAccessKey)}@athena.${d.region}.amazonaws.com:443/${d.schema || "default"}?s3_staging_dir=${encodeURIComponent(d.s3StagingDir)}`,
    buildDisplayUrl: (d) =>
      `awsathena+rest://${d.accessKeyId}:***@athena.${d.region}.amazonaws.com:443/${d.schema || "default"}`,
    pasteModePlaceholder:
      "awsathena+rest://AKID:SECRET@athena.us-east-1.amazonaws.com:443/default?s3_staging_dir=s3%3A%2F%2Fbucket%2Fprefix%2F",
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    logoSrc: "/logos/databases/dynamodb.svg",
    logoHeight: "h-8",
    status: "coming_soon",
    description: "AWS managed NoSQL key-value store",
    category: "nosql",
    dialect: "dynamodb",
    template: "service",
    fields: [
      {
        name: "region",
        label: "AWS Region",
        type: "text",
        required: true,
        placeholder: "us-east-1",
      },
      {
        fields: [
          {
            name: "accessKeyId",
            label: "Access Key ID",
            type: "text",
            required: true,
            placeholder: "AKIAIOSFODNN7EXAMPLE",
          },
          {
            name: "secretAccessKey",
            label: "Secret Access Key",
            type: "password",
            required: true,
          },
        ],
      },
      {
        name: "sessionToken",
        label: "Session Token",
        type: "password",
        required: false,
        placeholder: "Optional — for temporary / assumed-role credentials",
      },
    ],
    buildUrl: (d) => {
      const params = new URLSearchParams();

      if (d.sessionToken) params.set("session_token", d.sessionToken);
      const qs = params.toString() ? `?${params}` : "";
      return `dynamodb://${encodeURIComponent(d.accessKeyId)}:${encodeURIComponent(d.secretAccessKey)}@dynamodb.${d.region}.amazonaws.com${qs}`;
    },
    buildDisplayUrl: (d) =>
      `dynamodb://${d.accessKeyId}:***@dynamodb.${d.region}.amazonaws.com`,
    pasteModePlaceholder:
      "dynamodb://AKID:SECRET@dynamodb.us-east-1.amazonaws.com",
  },
  {
    id: "firestore",
    name: "Firestore",
    logoSrc: "/logos/databases/firestore.svg",
    logoHeight: "h-8",
    status: "coming_soon",
    description: "Google Cloud NoSQL document database",
    category: "nosql",
    dialect: "firestore",
    template: "service",
    fields: [
      {
        name: "project",
        label: "Project ID",
        type: "text",
        required: true,
        placeholder: "my-gcp-project",
      },
      gcpOAuthField(false),
    ],
    buildUrl: (d) => {
      if (!d.credentialsJson?.trim()) return `firestore://${d.project}`;
      return `firestore://${d.project}?credentials_base64=${encodeURIComponent(encodeBase64(d.credentialsJson))}`;
    },
    buildDisplayUrl: (d) =>
      d.credentialsJson?.trim()
        ? `firestore://${d.project}?credentials_base64=***`
        : `firestore://${d.project}`,
    pasteModePlaceholder: "firestore://my-gcp-project",
  },
  simple({
    id: "firebolt",
    name: "Firebolt",
    logoSrc: "/logos/databases/firebolt.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Cloud analytics database",
    category: "warehouse",
    dialect: "firebolt",
    port: "443",
  }),
  simple({
    id: "databend",
    name: "Databend",
    logoSrc: "/logos/databases/databend.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Cloud-native data warehouse",
    category: "warehouse",
    dialect: "databend",
    port: "8000",
  }),
  {
    id: "spanner",
    name: "Spanner",
    logoSrc: "/logos/databases/spanner.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Google Cloud globally distributed SQL",
    category: "warehouse",
    dialect: "spanner",
    template: "service",
    fields: [
      {
        fields: [
          {
            name: "project",
            label: "Project ID",
            type: "text",
            required: true,
            placeholder: "my-gcp-project",
          },
          {
            name: "instance",
            label: "Instance ID",
            type: "text",
            required: true,
            placeholder: "my-instance",
          },
        ],
      },
      {
        name: "database",
        label: "Database",
        type: "text",
        required: true,
        placeholder: "my-database",
      },
      gcpOAuthField(),
    ],
    buildUrl: (d) =>
      `spanner:///projects/${d.project}/instances/${d.instance}/databases/${d.database}?credentials_base64=${encodeURIComponent(encodeBase64(d.credentialsJson))}`,
    buildDisplayUrl: (d) =>
      `spanner:///projects/${d.project}/instances/${d.instance}/databases/${d.database}?credentials_base64=***`,
    pasteModePlaceholder:
      "spanner:///projects/my-project/instances/my-instance/databases/my-db?credentials_base64=<base64_service_account_json>",
  },
];
