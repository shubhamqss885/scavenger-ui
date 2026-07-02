// Web component DEV server (Vite HMR) on the Auth0-allowlisted origin.
//
// Serves the web component from SOURCE with hot-module reload on localhost:3333,
// the one origin in Auth0 Allowed Web Origins / Callback URLs, so real login
// and the live api-dev WebSocket work. Reuses the build's adapter/stub aliases
// so dev resolves modules identically to the shipped bundle.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import base from "./vite.web-component.config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root, // repo root → serves /demo/dev.html + /web-component/index.tsx source
  resolve: base.resolve, // identical adapter/stub swaps as the build
  css: base.css, // same Tailwind + :root→:host transform (shadow DOM needs it in dev too)
  plugins: [react()], // React Fast Refresh / HMR in dev
  // Deliberately omit base.define — it pins NODE_ENV="production", disabling
  // Fast Refresh. Dev runs in development mode; the source entry's env-shim.ts
  // creates process.env at runtime and applyWidgetPublicEnv fills the
  // NEXT_PUBLIC_* URLs from the element's props.
  server: {
    host: "localhost",
    port: 3333, // Auth0-allowlisted origin — do NOT change without an Auth0 dashboard update
    strictPort: true, // fail loudly if 3333 is taken rather than drifting to a non-allowlisted port
  },
});
