import { simple, standardFields, stdParseUrl } from "./shared";
import type { Connector } from "./types";

export const relationalConnectors: Connector[] = [
  simple({
    id: "postgresql",
    name: "PostgreSQL",
    logoSrc: "/logos/databases/postgresql.png",
    logoHeight: "h-8",
    status: "live",
    description: "Open-source relational database",
    category: "relational",
    dialect: "postgresql",
    port: "5432",
    withSchema: true,
  }),
  simple({
    id: "mysql",
    name: "MySQL",
    logoSrc: "/logos/databases/mysql.svg",
    logoHeight: "h-8",
    status: "live",
    description: "Popular open-source RDBMS",
    category: "relational",
    dialect: "mysql",
    port: "3306",
  }),
  simple({
    id: "mariadb",
    name: "MariaDB",
    logoSrc: "/logos/databases/mariadb.png",
    logoHeight: "h-8",
    status: "live",
    description: "MySQL-compatible fork",
    category: "relational",
    dialect: "mysql",
    port: "3306",
  }),
  {
    id: "mssql",
    name: "SQL Server",
    logoSrc: "/logos/databases/msssqlserver.png",
    logoHeight: "h-7",
    status: "live",
    description: "Microsoft enterprise database",
    category: "relational",
    dialect: "mssql",
    fields: [
      {
        fields: [
          {
            name: "host",
            label: "Host",
            type: "text",
            required: true,
            placeholder: "db.example.com",
          },
          {
            name: "port",
            label: "Port",
            type: "text",
            required: true,
            defaultValue: "1433",
          },
        ],
        gridCols: "grid-cols-[1fr_100px]",
      },
      {
        name: "database",
        label: "Database name",
        type: "text",
        required: true,
        placeholder: "mydb",
      },
      {
        name: "authType",
        label: "Authentication",
        type: "select",
        required: true,
        defaultValue: "sql",
        options: [
          { value: "sql", label: "SQL Server Authentication" },
          { value: "azure_ad", label: "Azure AD (Service Principal)" },
        ],
      },
      {
        fields: [
          {
            name: "username",
            label: "Username / Client ID",
            type: "text",
            required: true,
            placeholder: "sa",
          },
          {
            name: "password",
            label: "Password / Client Secret",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    buildUrl: (d) => {
      const user = encodeURIComponent(d.username);
      const pass = encodeURIComponent(d.password);

      if (d.authType === "azure_ad") {
        const driver = encodeURIComponent("ODBC Driver 18 for SQL Server");
        return `mssql+pyodbc://${user}:${pass}@${d.host}:${d.port}/${d.database}?driver=${driver}&authentication=ActiveDirectoryServicePrincipal&Encrypt=yes&TrustServerCertificate=no`;
      }
      return `mssql://${user}:${pass}@${d.host}:${d.port}/${d.database}`;
    },
    buildDisplayUrl: (d) => {
      if (d.authType === "azure_ad") {
        return `mssql+pyodbc://${d.username}:***@${d.host}:${d.port}/${d.database}?authentication=ActiveDirectoryServicePrincipal`;
      }
      return `mssql://${d.username}:***@${d.host}:${d.port}/${d.database}`;
    },
    pasteModePlaceholder: "mssql://user:password@host:1433/mydb",
    parseUrl: stdParseUrl,
  },
  {
    id: "oracle",
    name: "Oracle",
    logoSrc: "/logos/databases/oracle.png",
    logoHeight: "h-6",
    status: "live",
    description: "Enterprise-grade RDBMS",
    category: "enterprise",
    dialect: "oracle",
    fields: standardFields("1521", false, {
      label: "Service Name / SID",
      placeholder: "ORCL",
    }),
    buildUrl: (d) =>
      `oracle://${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}@${d.host}:${d.port}/${d.database}`,
    buildDisplayUrl: (d) =>
      `oracle://${d.username}:***@${d.host}:${d.port}/${d.database}`,
    pasteModePlaceholder: "oracle://user:password@host:1521/ORCL",
    parseUrl: stdParseUrl,
  },
  {
    id: "sqlite",
    name: "SQLite",
    logoSrc: "/logos/databases/sqlite.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Embedded file-based SQL database",
    category: "relational",
    dialect: "sqlite",
    template: "file",
    fields: [
      {
        name: "dbPath",
        label: "Database File Path",
        type: "text",
        required: true,
        placeholder: "/path/to/database.db",
        defaultValue: ":memory:",
      },
    ],
    buildUrl: (d) => `sqlite:///${d.dbPath}`,
    buildDisplayUrl: (d) => `sqlite:///${d.dbPath}`,
    pasteModePlaceholder: "sqlite:///path/to/database.db",
  },
  simple({
    id: "cockroachdb",
    name: "CockroachDB",
    logoSrc: "/logos/databases/cockroachdb.png",
    logoHeight: "h-7",
    status: "live",
    description: "Distributed SQL database",
    category: "relational",
    dialect: "cockroachdb",
    port: "26257",
    withSchema: true,
  }),
  simple({
    id: "tidb",
    name: "TiDB",
    logoSrc: "/logos/databases/tidb.svg",
    logoHeight: "h-7",
    status: "live",
    description: "MySQL-compatible distributed SQL",
    category: "relational",
    dialect: "tidb",
    port: "4000",
  }),
  simple({
    id: "yugabytedb",
    name: "YugabyteDB",
    logoSrc: "/logos/databases/yugabytedb.svg",
    logoHeight: "h-7",
    status: "live",
    description: "PostgreSQL-compatible distributed SQL",
    category: "relational",
    dialect: "yugabytedb",
    port: "5433",
    withSchema: true,
  }),
  simple({
    id: "db2",
    name: "IBM Db2",
    logoSrc: "/logos/databases/db2.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "IBM enterprise relational database",
    category: "enterprise",
    dialect: "db2+ibm_db",
    port: "50000",
  }),
  simple({
    id: "hana",
    name: "SAP HANA",
    logoSrc: "/logos/databases/hana.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "SAP in-memory enterprise database",
    category: "enterprise",
    dialect: "hana",
    port: "39015",
  }),
  simple({
    id: "greenplum",
    name: "Greenplum",
    logoSrc: "/logos/databases/greenplum.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Open-source MPP data warehouse",
    category: "warehouse",
    dialect: "greenplum",
    port: "5432",
    withSchema: true,
  }),
  simple({
    id: "singlestore",
    name: "SingleStore",
    logoSrc: "/logos/databases/singlestore.svg",
    logoHeight: "h-7",
    status: "live",
    description: "Distributed relational and JSON database",
    category: "relational",
    dialect: "singlestore",
    port: "3306",
  }),
];
