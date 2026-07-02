import type {
  Connector,
  ConnectorCategory,
  ConnectorId,
  FieldConfig,
  FieldRow,
} from "./types";

// --- Field builders ---

export const standardFields = (
  port: string,
  withSchema = false,
  databaseField?: { label?: string; placeholder?: string },
): FieldRow[] => {
  const rows: FieldRow[] = [
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
          defaultValue: port,
        },
      ],
      gridCols: "grid-cols-[1fr_100px]",
    },
    {
      name: "database",
      label: databaseField?.label ?? "Database name",
      type: "text",
      required: true,
      placeholder: databaseField?.placeholder ?? "mydb",
    },
    {
      fields: [
        {
          name: "username",
          label: "Username",
          type: "text",
          required: true,
          placeholder: "admin",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
      ],
    },
  ];

  if (withSchema) {
    rows.push({
      name: "schema",
      label: "Schema",
      type: "text",
      required: false,
      placeholder: "public",
      defaultValue: "public",
    });
  }
  return rows;
};

/** URL builder factory: produces buildUrl / buildDisplayUrl for standard host:port connections. */
const stdUrl =
  (dialect: string, mask: boolean) => (d: Record<string, string>) => {
    const schemaPart = d.schema
      ? `?schema=${encodeURIComponent(d.schema)}`
      : "";
    const credential = mask ? "***" : encodeURIComponent(d.password);
    return `${dialect}://${d.username}:${credential}@${d.host}:${d.port}/${d.database}${schemaPart}`;
  };

/** Standard URL parser for host:port style connection strings */
export const stdParseUrl = (url: string): Record<string, string> => {
  const result: Record<string, string> = {};
  try {
    // Pattern: dialect://user:pass@host:port/database?schema=...
    const match = url.match(
      /^[^:]+:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)(?:\?(.*))?$/,
    );

    if (match) {
      result.username = decodeURIComponent(match[1]);
      // Skip password for security
      result.host = match[3];
      result.port = match[4];
      result.database = match[5];
      const params = new URLSearchParams(match[6] || "");
      result.schema = params.get("schema") || "";
    }
  } catch {
    /* ignore parse errors */
  }
  return result;
};

// --- GCP helpers ---

/** UTF-8 safe base64 encode for service account JSON. */
export const encodeBase64 = (str: string): string =>
  btoa(
    encodeURIComponent(str).replaceAll(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    ),
  );

/**
 * Google OAuth 2.0 sign-in field.
 * Rendered as a "Sign in with Google" popup button.
 * On success stores the refresh_token in credentialsJson.
 * The full authorized_user JSON (with client_secret) is assembled server-side
 * via /api/oauth/google/credentials before the connection URL is built.
 */
export const gcpOAuthField = (required = true): FieldConfig => ({
  name: "credentialsJson",
  label: "Google Account",
  type: "gcp-oauth",
  required,
});

// --- Connector factory ---

export type SimpleConnectorConfig = {
  id: ConnectorId;
  name: string;
  logoSrc: string;
  logoHeight: string;
  status: "live" | "coming_soon";
  description: string;
  category: ConnectorCategory;
  dialect: string;
  port: string;
  withSchema?: boolean;
};

/**
 * Creates a standard connector using host/port/database/username/password fields.
 * Use for any connector that follows the conventional URL pattern.
 */
export const simple = (c: SimpleConnectorConfig): Connector => ({
  id: c.id,
  name: c.name,
  logoSrc: c.logoSrc,
  logoHeight: c.logoHeight,
  status: c.status,
  description: c.description,
  category: c.category,
  dialect: c.dialect,
  fields: standardFields(c.port, c.withSchema),
  buildUrl: stdUrl(c.dialect, false),
  buildDisplayUrl: stdUrl(c.dialect, true),
  pasteModePlaceholder: `${c.dialect}://user:password@host:${c.port}/mydb`,
  parseUrl: stdParseUrl,
});

// --- Utilities ---

/** Flatten field rows into a flat array of FieldConfig. */
export const flattenFields = (rows: FieldRow[]): FieldConfig[] =>
  rows.flatMap((row) => ("fields" in row ? row.fields : [row]));

export const maskConnectionString = (raw: string): string =>
  raw.replace(/:([^:@\s]+)@/, ":***@");
