import { z } from "zod";

import { flattenFields } from "../../config/connectorData";
import type { FieldRow } from "../../config/connectorData";

/**
 * Exchanges a GCP refresh_token for the full authorized_user credentials JSON.
 * client_secret is added server-side — never held in the browser.
 */
export const fetchGcpCredentials = async (
  refreshToken: string,
): Promise<string> => {
  const res = await fetch("/api/oauth/google/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok)
    throw new Error("Failed to retrieve credentials. Please sign in again.");
  const { credentials_json } = (await res.json()) as {
    credentials_json: string;
  };
  return credentials_json;
};

export const buildZodSchema = (fields: FieldRow[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of flattenFields(fields)) {
    shape[field.name] = field.required
      ? z.string().min(1, `${field.label} is required`)
      : z.string().optional();
  }

  return z.object(shape);
};

export const buildDefaults = (fields: FieldRow[]): Record<string, string> => {
  const defaults: Record<string, string> = {};

  for (const field of flattenFields(fields)) {
    defaults[field.name] = field.defaultValue ?? "";
  }

  return defaults;
};
