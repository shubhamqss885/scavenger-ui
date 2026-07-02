import { encodeBase64, gcpOAuthField } from "./shared";
import type { Connector } from "./types";

export const filesConnectors: Connector[] = [
  {
    id: "gsheets",
    name: "Google Drive",
    logoSrc: "/logos/databases/gdrive.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Query files from Google Drive",
    category: "files",
    dialect: "gsheets",
    template: "oauth-only",
    fields: [gcpOAuthField()],
    buildUrl: (d) =>
      `gsheets://?credentials_base64=${encodeURIComponent(encodeBase64(d.credentialsJson))}&spreadsheet_id=${encodeURIComponent(d.spreadsheetId ?? "")}`,
    buildDisplayUrl: (d) =>
      `gsheets://?credentials_base64=***&spreadsheet_id=${encodeURIComponent(d.spreadsheetId ?? "")}`,
    pasteModePlaceholder:
      "gsheets://?credentials_base64=<base64_service_account_json>",
  },
  {
    id: "csv",
    name: "CSV",
    logoSrc: "/logos/databases/csv.svg",
    logoHeight: "h-7",
    status: "live",
    description: "Upload and query CSV flat files",
    category: "files",
    dialect: "csv",
    template: "file-upload",
    fields: [],
    buildUrl: () => "",
    buildDisplayUrl: () => "",
    pasteModePlaceholder: "",
  },
  {
    id: "json",
    name: "JSON",
    logoSrc: "/logos/databases/json.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Query JSON flat files directly",
    category: "files",
    dialect: "json",
    template: "file",
    fields: [
      {
        name: "filePath",
        label: "File Path or URL",
        type: "text",
        required: true,
        placeholder: "/path/to/data.json or s3://bucket/data.json",
      },
    ],
    buildUrl: (d) => `json:///${d.filePath}`,
    buildDisplayUrl: (d) => `json:///${d.filePath}`,
    pasteModePlaceholder: "json:///path/to/data.json",
  },
  {
    id: "parquet",
    name: "Parquet",
    logoSrc: "/logos/databases/parquet.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Query Apache Parquet columnar files",
    category: "files",
    dialect: "parquet",
    template: "file",
    fields: [
      {
        name: "filePath",
        label: "File Path or URL",
        type: "text",
        required: true,
        placeholder: "/path/to/data.parquet or s3://bucket/data.parquet",
      },
    ],
    buildUrl: (d) => `parquet:///${d.filePath}`,
    buildDisplayUrl: (d) => `parquet:///${d.filePath}`,
    pasteModePlaceholder: "parquet:///path/to/data.parquet",
  },
];
