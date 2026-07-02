import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { shadowHostTransform } from "./web-component/css-transform";

// Standalone web component build (Vite).
//
// Builds web-component/index.tsx → dist-web-component/. React is inlined (no `external`)
// so the measured size reflects the real customer payload. Completely separate
// from next.config — never touches the Next build.

const root = dirname(fileURLToPath(import.meta.url));
// web-component/adapters = PERMANENT web component policy; web-component/stubs = TEMPORARY, each
// must be replaced in Milestone B (see web-component/README.md for the taxonomy).
const adapters = resolve(root, "web-component/adapters");
const stubs = resolve(root, "web-component/stubs");

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Order matters: specific aliases come before the generic `@/`. Finds are
    // ANCHORED regexes (`$`) — replaces only the bare specifier, so sub-path
    // imports like `OrgFeatureContext/featureFlags` fall through to the real files.
    alias: [
      // --- Web component swaps: app-shell contexts + auth token + next/dynamic ---
      // (adapters/ = permanent policy, stubs/ = Milestone B debt)
      {
        find: /^@\/lib\/context\/AuthContext$/,
        replacement: resolve(stubs, "AuthContext.tsx"),
      },
      {
        find: /^@\/lib\/context\/DashboardStatsProvider$/,
        replacement: resolve(adapters, "DashboardStatsProvider.tsx"),
      },
      // The ONE auth seam: UserDataContext sources auth via auth0-spa-js (not
      // @auth0/nextjs-auth0). With it aliased, the REAL OrgFeatureProvider mounts
      // unchanged — so there is NO OrgFeatureContext alias (it resolves real, both
      // the `@/` and the relative `../OrgFeatureContext` ProjectsProvider import).
      {
        find: /^@\/lib\/context\/UserDataContext$/,
        replacement: resolve(adapters, "UserDataContext.tsx"),
      },
      // The real ProjectsProvider imports a sibling context RELATIVELY
      // (lib/context/ProjectsContext/index.tsx → "../DashboardStatsProvider"),
      // which bypasses the `@/` find above and would otherwise resolve to the REAL
      // context (whose hook is inert-by-policy here). Anchor it to the adapter too.
      {
        find: /^\.\.\/DashboardStatsProvider$/,
        replacement: resolve(adapters, "DashboardStatsProvider.tsx"),
      },
      {
        find: /^@\/lib\/context\/OrganizationDbProvider$/,
        replacement: resolve(adapters, "OrganizationDbProvider.tsx"),
      },
      // The chat's chart/SQL results render PinToDashboardModal, which calls the
      // real useOrgDashboardsContext (throws without its provider). Inert adapter.
      {
        find: /^@\/lib\/context\/OrgDashboardContext$/,
        replacement: resolve(adapters, "OrgDashboardContext.tsx"),
      },
      // NOTE: no EventsContext alias — the REAL EventsProvider runs in the widget
      // (ChatBoot mounts it). Its notifications WebSocket (api-dev /llm/notifications
      // /stream) authenticates with the same token the chat uses, so file-indexing
      // progress is live. useFileIndexingEvents resolves to the real hook.
      {
        find: /^@\/lib\/services\/axiosInstances\/tokenRefresh$/,
        replacement: resolve(stubs, "tokenRefresh.ts"),
      },
      // The lone Next API in the chat graph (ChartChip). Shimmed to React.lazy.
      {
        find: /^next\/dynamic$/,
        replacement: resolve(adapters, "next-dynamic.tsx"),
      },
      // The sidebar's row/CTA links use next-view-transitions (which needs Next's
      // AppRouterContext). Shimmed so a Link click switches the active project
      // in-element (WidgetRouterContext.navigate) instead of navigating the URL.
      {
        find: /^next-view-transitions$/,
        replacement: resolve(adapters, "next-view-transitions.tsx"),
      },
      // --- Generic app alias, mirrors tsconfig `"@/*": ["./*"]` ---
      { find: /^@\//, replacement: `${root}/` },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  css: {
    // WIDGET BUILD ONLY. Specifying postcss inline overrides postcss.config.mjs
    // (which the Next build still uses), so Tailwind is listed explicitly here.
    // shadowHostTransform runs after it to rewrite :root/body/scavenger-chat →
    // :host, so the CSS adopted into the shadow root styles the chat — and nothing
    // leaks onto the host page. Applies to the `?inline` imports too.
    postcss: {
      plugins: [
        tailwindcss(resolve(root, "tailwind.config.ts")),
        shadowHostTransform(),
      ],
    },
  },
  build: {
    outDir: "dist-web-component",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(root, "web-component/index.tsx"),
      name: "ScavengerChat",
      formats: ["es"],
      fileName: () => "scavenger-chat.js",
    },
    rollupOptions: {
      // Nothing external — React rides inside the bundle (customer payload).
      output: {
        inlineDynamicImports: false,
        // Predictable CSS name (default would be `style.css`) so the demo/CDN
        // embed can reference scavenger-chat.css.
        assetFileNames: (info) =>
          info.name?.endsWith(".css")
            ? "scavenger-chat.css"
            : "[name]-[hash][extname]",
      },
    },
  },
});
