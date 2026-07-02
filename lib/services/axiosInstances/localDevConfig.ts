export interface ServiceOverride {
  hostname: string;
  port: string;
}

const LOCAL_OVERRIDES: Record<string, ServiceOverride> = {
  // agentic: {
  //   hostname: "localhost",
  //   port: "8001",
  // },
  // "external-data": {
  //   hostname: "127.0.0.1",
  //   port: "8000",
  // },
  // upload: {
  //   hostname: "localhost",
  //   port: "8001",
  // },
  // text2sql: {
  //   hostname: "localhost",
  //   port: "9111",
  // },
  // Add other services as needed
  // project: {
  //   hostname: "localhost",
  //   port: "8000",
  // },
  // organization: {
  //   hostname: "127.0.0.1",
  //   port: "8000",
  // },
};

// Environment variable overrides for service URLs
// Format: NEXT_PUBLIC_{SERVICE}_API_URL (e.g., NEXT_PUBLIC_AGENTIC_API_URL)
const ENV_OVERRIDES: Record<string, string | undefined> = {
  agentic: process.env.NEXT_PUBLIC_AGENTIC_API_URL,
  text2sql: process.env.NEXT_PUBLIC_TEXT2SQL_API_URL,
  upload: process.env.NEXT_PUBLIC_UPLOAD_API_URL,
  "external-data": process.env.NEXT_PUBLIC_EXTERNAL_DATA_API_URL,
  organization: process.env.NEXT_PUBLIC_ORGANIZATION_API_URL,
};

export const createServiceUrl = (baseUrl: string, service: string): string => {
  // First check env var override (works in any environment)
  const envOverride = ENV_OVERRIDES[service];

  if (envOverride) {
    return envOverride;
  }

  // Then check LOCAL_OVERRIDES (only in localhost mode)
  if (process.env.NEXT_PUBLIC_APP_ENV === "localhost") {
    const override = LOCAL_OVERRIDES[service];

    if (override) {
      return `http://${override.hostname}:${override.port}`;
    }
  }

  return baseUrl;
};
