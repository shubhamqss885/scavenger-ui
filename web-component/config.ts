// Milestone A — web component configuration resolution.
//
// Config comes from ONE source: the element's props (r2wc maps kebab attributes /
// JS properties → camelCase props). The host page's environment is never read.
//
// The bundled app modules read connection URLs off process.env.NEXT_PUBLIC_*
// (e.g. getWsUrl in AgenticChat/types.ts, createAxiosInstance baseURL). env-shim.ts
// creates the widget's own process.env at load; applyWidgetPublicEnv (below) copies
// the prop URLs into it before the chat mounts — so those modules read the
// embedder's values without the widget ever touching host env.
//
// Branding (fontFamily, accentColor, borderRadius, fontScale) maps 1:1 to CSS
// variables on the shadow :host — applied in WidgetRoot. accentColor is shadcn's
// `--primary` token, which is HSL *channels* consumed as hsl(var(--primary)), so it
// must be given as "H S% L%" (e.g. "176 82% 39%"), not a hex/rgb color.

export type WidgetConfig = {
  apiBaseUrl: string;
  wsBaseUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  tenant?: string;
  externalClientId?: string;
  widgetTitle?: string;
  // Branding (all optional; absent = the app's defaults)
  fontFamily?: string;
  accentColor?: string;
  borderRadius?: string;
  fontScale?: string;
};

// Props handed down by r2wc (camelCase, sourced from kebab attributes) — every
// config field, all optional (resolveConfig fills the required ones).
export type WidgetProps = Partial<WidgetConfig>;

export const resolveConfig = (props: WidgetProps = {}): WidgetConfig => ({
  apiBaseUrl: props.apiBaseUrl ?? "",
  wsBaseUrl: props.wsBaseUrl ?? "",
  auth0Domain: props.auth0Domain ?? "",
  auth0ClientId: props.auth0ClientId ?? "",
  auth0Audience: props.auth0Audience ?? "",
  tenant: props.tenant,
  externalClientId: props.externalClientId,
  widgetTitle: props.widgetTitle,
  fontFamily: props.fontFamily,
  accentColor: props.accentColor,
  borderRadius: props.borderRadius,
  fontScale: props.fontScale,
});

// Bridge the resolved PROPS into the widget's own process.env (created by
// env-shim) so the bundled app modules that read NEXT_PUBLIC_* see the embedder's
// URLs. Called synchronously in WidgetRoot before the chat mounts. Source is props
// only — the host page's environment is never read.
export const applyWidgetPublicEnv = (config: WidgetConfig): void => {
  process.env.NEXT_PUBLIC_API_BASE_URL = config.apiBaseUrl;
  process.env.NEXT_PUBLIC_WS_BASE_URL = config.wsBaseUrl;
};
