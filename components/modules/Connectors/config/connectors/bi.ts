import type { Connector } from "./types";

export const biConnectors: Connector[] = [
  {
    id: "tableau",
    name: "Tableau",
    logoSrc: "/logos/databases/tableau.svg",
    logoHeight: "h-7",
    status: "live",
    description: "Business intelligence and visual analytics platform",
    category: "bi-tools",
    dialect: "tableau",
    template: "service",
    fields: [
      {
        name: "serverUrl",
        label: "Server URL",
        type: "text",
        required: true,
        placeholder: "prod-useast-a.online.tableau.com",
      },
      {
        name: "siteId",
        label: "Site ID",
        type: "text",
        required: false,
        placeholder: "Leave blank for default site",
      },
      {
        fields: [
          {
            name: "tokenName",
            label: "Personal Access Token Name",
            type: "text",
            required: true,
            placeholder: "ScavengerToken",
          },
          {
            name: "tokenValue",
            label: "Personal Access Token Secret",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    buildUrl: (d) => {
      const host = d.serverUrl.replace(/^https?:\/\//, "");
      const path = d.siteId ? `/${encodeURIComponent(d.siteId)}` : "";
      return `tableau://${host}${path}?token_name=${encodeURIComponent(d.tokenName)}&token_secret=${encodeURIComponent(d.tokenValue)}`;
    },
    buildDisplayUrl: (d) => {
      const host = d.serverUrl.replace(/^https?:\/\//, "");
      const path = d.siteId ? `/${d.siteId}` : "";
      return `tableau://${host}${path}?token_name=${d.tokenName}&token_secret=***`;
    },
    pasteModePlaceholder:
      "tableau://prod-useast-a.online.tableau.com/site_id?token_name=MyToken&token_secret=...",
    parseUrl: (url) => {
      const inner = url.replace(/^tableau:\/\//, "");
      const questionIdx = inner.indexOf("?");
      const pathPart = questionIdx === -1 ? inner : inner.slice(0, questionIdx);
      const [host, ...siteParts] = pathPart.split("/");
      const params = new URLSearchParams(
        questionIdx === -1 ? "" : inner.slice(questionIdx + 1),
      );
      return {
        serverUrl: host,
        tokenName: params.get("token_name") ?? "",
        tokenValue: params.get("token_secret") ?? "",
        siteId: siteParts.join("/"),
      };
    },
  },
  {
    id: "powerbi",
    name: "Power BI",
    logoSrc: "/logos/databases/powerbi.svg",
    logoHeight: "h-7",
    status: "live",
    description: "Microsoft business analytics and reporting service",
    category: "bi-tools",
    dialect: "powerbi",
    template: "service",
    fields: [
      {
        name: "tenantId",
        label: "Tenant ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
      {
        fields: [
          {
            name: "clientId",
            label: "Client ID",
            type: "text",
            required: true,
            placeholder: "Application (client) ID",
          },
          {
            name: "clientSecret",
            label: "Client Secret",
            type: "password",
            required: true,
          },
        ],
      },
      {
        name: "workspace",
        label: "Workspace Name",
        type: "text",
        required: false,
        placeholder: "My Workspace",
        defaultValue: "My Workspace",
      },
    ],
    buildUrl: (d) => {
      const params = new URLSearchParams({
        tenant_id: d.tenantId,
        client_id: d.clientId,
        client_secret: d.clientSecret,
      });

      if (d.workspace) params.set("workspace", d.workspace);
      return `powerbi://api.powerbi.com?${params}`;
    },
    buildDisplayUrl: (d) =>
      `powerbi://api.powerbi.com?tenant_id=${d.tenantId}&client_id=${d.clientId}&client_secret=***`,
    pasteModePlaceholder:
      "powerbi://api.powerbi.com?tenant_id=...&client_id=...&client_secret=...",
    parseUrl: (url) => {
      const params = new URLSearchParams(url.split("?")[1] || "");
      return {
        tenantId: params.get("tenant_id") ?? "",
        clientId: params.get("client_id") ?? "",
        clientSecret: params.get("client_secret") ?? "",
        workspace: params.get("workspace") ?? "My Workspace",
      };
    },
  },
  {
    id: "looker",
    name: "Looker",
    logoSrc: "/logos/databases/looker.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Google Cloud business intelligence platform",
    category: "bi-tools",
    dialect: "looker",
    template: "service",
    fields: [
      {
        name: "baseUrl",
        label: "Instance URL",
        type: "text",
        required: true,
        placeholder: "https://mycompany.cloud.looker.com",
      },
      {
        fields: [
          {
            name: "clientId",
            label: "Client ID",
            type: "text",
            required: true,
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
    buildUrl: (d) =>
      `looker://${d.baseUrl}?client_id=${encodeURIComponent(d.clientId)}&client_secret=${encodeURIComponent(d.clientSecret)}`,
    buildDisplayUrl: (d) =>
      `looker://${d.baseUrl}?client_id=${d.clientId}&client_secret=***`,
    pasteModePlaceholder:
      "looker://mycompany.cloud.looker.com?client_id=...&client_secret=...",
  },
  {
    id: "metabase",
    name: "Metabase",
    logoSrc: "/logos/databases/metabase.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Open-source business analytics and visualization",
    category: "bi-tools",
    dialect: "metabase",
    template: "service",
    fields: [
      {
        name: "serverUrl",
        label: "Server URL",
        type: "text",
        required: true,
        placeholder: "https://metabase.example.com",
      },
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
      },
    ],
    buildUrl: (d) =>
      `metabase://${d.serverUrl}?api_key=${encodeURIComponent(d.apiKey)}`,
    buildDisplayUrl: (d) => `metabase://${d.serverUrl}?api_key=***`,
    pasteModePlaceholder: "metabase://metabase.example.com?api_key=...",
  },
  {
    id: "superset",
    name: "Apache Superset",
    logoSrc: "/logos/databases/superset.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Open-source data exploration and dashboarding",
    category: "bi-tools",
    dialect: "superset",
    template: "service",
    fields: [
      {
        name: "serverUrl",
        label: "Server URL",
        type: "text",
        required: true,
        placeholder: "https://superset.example.com",
      },
      {
        fields: [
          {
            name: "username",
            label: "Username",
            type: "text",
            required: true,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    buildUrl: (d) =>
      `superset://${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}@${d.serverUrl}`,
    buildDisplayUrl: (d) => `superset://${d.username}:***@${d.serverUrl}`,
    pasteModePlaceholder: "superset://admin:password@superset.example.com",
  },
  {
    id: "grafana",
    name: "Grafana",
    logoSrc: "/logos/databases/grafana.svg",
    logoHeight: "h-7",
    status: "coming_soon",
    description: "Monitoring, observability, and analytics platform",
    category: "bi-tools",
    dialect: "grafana",
    template: "service",
    fields: [
      {
        name: "serverUrl",
        label: "Server URL",
        type: "text",
        required: true,
        placeholder: "https://grafana.example.com",
      },
      {
        name: "serviceToken",
        label: "Service Account Token",
        type: "password",
        required: true,
        placeholder: "glsa_xxxxxxxxxxxx",
      },
    ],
    buildUrl: (d) =>
      `grafana://${d.serverUrl}?token=${encodeURIComponent(d.serviceToken)}`,
    buildDisplayUrl: (d) => `grafana://${d.serverUrl}?token=***`,
    pasteModePlaceholder: "grafana://grafana.example.com?token=glsa_...",
  },
];
