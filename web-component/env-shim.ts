// Widget-owned process.env — NOT the host page's environment.
//
// The bundled app modules read connection config off `process.env` (e.g.
// createAxiosInstance's baseURL, the chat WebSocket url). A browser has no
// `process`, so this ensures one exists for the bundle to read. Must be index.tsx's
// FIRST import so it runs before any module that reads process.env evaluates (ES
// imports are hoisted). The connection URLs are written in from the element's PROPS
// by applyWidgetPublicEnv (config.ts) — the host's real environment is never read.
//
// Normalizes EVERY partial-host case — a host page may already define `process`,
// `process = {}`, or `process = { env: {} }` via its own bundler/polyfill — filling
// only the gaps with `??=`, so a host's real values are never clobbered.
//
// NEXT_PUBLIC_ENCRYPTION_KEY is a harmless placeholder so lib/utils' module-load key
// guard doesn't throw; the widget never calls encrypt/decrypt (the real
// OrganizationDbProvider that does is aliased out of the bundle).
const g = globalThis as {
  process?: { env?: Record<string, string | undefined> };
};

const proc = (g.process ??= {});
const env = (proc.env ??= {});
env.NODE_ENV ??= "production";
env.NEXT_PUBLIC_ENCRYPTION_KEY ??= "widget";
