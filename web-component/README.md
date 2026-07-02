# Web Component

Wraps the app's AgenticChat as a `<scavenger-chat>` web component. Built with
Vite (`vite.web-component.config.ts` → `dist-web-component/`), completely separate from
`next build`. App-shell modules the chat imports — but which can't run
standalone — are swapped out via **anchored-regex aliases** in
`vite.web-component.config.ts` (anchored so sub-path imports like
`OrgFeatureContext/featureFlags` still resolve to the real files).

The element renders in an **open Shadow DOM** (`shadow: "open"`): the app's compiled
Tailwind is transformed (`:root`/`body` → `:host`, see `css-transform.ts`) and adopted
into each element's shadow root as a constructable stylesheet (`shadow-styles.ts`), so the
widget is isolated from the host page in both directions — no CSS leaks out, none leaks in.
No `scavenger-chat.css` is emitted; the styles ride inside the JS bundle.

## Structure

The Vite entry is `index.tsx`; everything else is plain React.

| File                               | Role                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                        | **Entry / registration** (the `main.tsx` role): imports `env-shim.ts` FIRST, then `r2wc(WidgetRoot, { props, shadow:"open" })` + `customElements.define("scavenger-chat", …)`. Subclasses the r2wc element to `adoptStyles(shadowRoot)` in `connectedCallback` _before_ React mounts (no FOUC). The `props` map is the element's attribute schema and mirrors `WidgetProps` in `config.ts`.                       |
| `shadow-styles.ts`                 | `adoptStyles(root)` — imports the app's `globals.css` + `sonner` CSS + widget `styles.css` as inlined strings (`?inline`), builds one module-level constructable `CSSStyleSheet`, and adopts it into each element's shadow root (shared across instances; `<style>`-injection fallback for pre-Safari 16.4).                                                                                                      |
| `css-transform.ts`                 | Widget-build-only PostCSS plugin: rewrites the app's global selectors for the shadow tree (`:root`/leading `body`/`scavenger-chat` → `:host`) so the 57 design tokens land on the host. Wired in `vite.web-component.config.ts`, never in the Next `postcss.config.mjs`.                                                                                                                                          |
| `env-shim.ts`                      | Creates the widget's OWN `process.env` (a placeholder key + `NODE_ENV`) before any module evaluates, so legacy `NEXT_PUBLIC_*` reads never hit the host's env or `ReferenceError`. URLs are written into it from props by `applyWidgetPublicEnv`.                                                                                                                                                                 |
| `WidgetRoot.tsx`                   | Thin root: `resolveConfig(props)` → publishes the r2wc-injected shadow root via `PortalContainerProvider` (so shadcn dialog/sheet/popover/tooltip portal _into_ the styled shadow tree, not `document.body`) → applies branding props as CSS vars on `:host` → provider tree (`QueryClient` / `Tooltip` / `Sidebar`) → `WebComponentAuthProvider` → `AuthGate` → (`Suspense` + `ChatErrorBoundary`) → `ChatBoot`. |
| `config.ts`                        | Resolves a typed `WidgetConfig` from element props only (no host env). `applyWidgetPublicEnv` bridges the URL props into the widget's own `process.env` (created by `env-shim.ts`) for legacy app modules that read `NEXT_PUBLIC_*`.                                                                                                                                                                              |
| `auth.ts`                          | Client-side auth via `@auth0/auth0-spa-js` — the app's server-side `@auth0/nextjs-auth0` + `/api/auth/token` route can't run standalone. `initAuth0` / `probeSilentAuth` / `loginWithPopup` / `getToken` / `getUser`.                                                                                                                                                                                             |
| `WebComponentAuthProvider.tsx`     | Auth **state**, no UI. Owns the auth0 state machine; provides the app's real `AxiosContext` (live token + a real `refreshSession` → `getTokenSilently`, replacing the Milestone-B no-op) plus an internal gate context.                                                                                                                                                                                           |
| `AuthGate.tsx`                     | Auth **UI**. Renders loading / login / origin-blocked / error panels; renders its children (the chat) only once authenticated.                                                                                                                                                                                                                                                                                    |
| `ChatBoot.tsx`                     | Post-auth boot: reads the token from `AxiosContext`, runs `boot.ts` (seeds the OrgDb adapter), then mounts the provider tree — `UserDataProvider` (adapter) → real `OrgFeatureProvider` → `WorkspaceGate` (spinner until flags ready) → real `ProjectsProvider` → `EventsProvider` → `WidgetWorkspace`.                                                                                                           |
| `boot.ts`                          | The boot steps: token → `createAxiosInstance` (REST singleton) → `registerUser` → `getUserOrganization` (for the org-DB fetch) → org DBs → resolve/create an agentic project → `{ projectId, organizationDbs, defaultOrgDbId }`. Role + org details aren't fetched here — the real `OrgFeatureProvider` + `UserDataContext` adapter fetch their own.                                                              |
| `components/WidgetWorkspace.tsx`   | The chat workspace: holds the active project in **state** (a sidebar click re-keys `AgenticChatProvider` — switches chat in-element, never a URL change) and provides `WidgetRouterContext`. Mounted by `ChatBoot` inside the real `ProjectsProvider`.                                                                                                                                                            |
| `components/WidgetSidebar.tsx`     | The chats sidebar — reuses the app's `SidebarLinkItem` / `SidebarContentCollapsibleGroup` / `CtaButton` over the **real** `ProjectsContext`, so rename / delete / search / streaming behaviour is inherited rather than re-implemented. Scope = Chats + New chat.                                                                                                                                                 |
| `router.tsx`                       | In-element router (`WidgetRouterContext` + `projectIdFromHref`): the `next-view-transitions` shim turns a sidebar `<Link>` click into `navigate(href)` → switch the active project. A custom element must never touch the host page's URL.                                                                                                                                                                        |
| `components/useAgenticProjects.ts` | The ONE place that narrows the shared `ProjectsProvider` (agentic + SQL projects) to **agentic only**. Both the sidebar (list / empty-state count) and the workspace (stale-active fallback) consume it, so they can't diverge and mount the chat against a non-agentic project.                                                                                                                                  |
| `views.tsx`                        | Shared presentational primitives: `Centered`, `LoadingView`, `ErrorView`, `ChatErrorBoundary`.                                                                                                                                                                                                                                                                                                                    |

**Runtime flow:** the browser upgrades `<scavenger-chat>` → r2wc mounts `WidgetRoot` → config + providers → `WebComponentAuthProvider` runs a silent Auth0 probe → `AuthGate` shows login (or loading/error) → on auth, `ChatBoot` resolves a project and mounts the provider tree (`UserDataProvider` → real `OrgFeatureProvider` → real `ProjectsProvider` → `EventsProvider`) → `WidgetWorkspace` (sidebar + chat). Selecting a chat in the sidebar switches the active project in-element (re-keying the chat); the real chat streams over the live WebSocket.

**Auth note:** the token comes from `auth.ts` (auth0-spa-js) and is provided through the app's existing `AxiosContext` — the chat consumes auth exactly as in the Next app; only the token _source_ differs (client-side SPA flow vs the app's server route). See `auth.ts` + `WebComponentAuthProvider.tsx`.

## adapters/ vs stubs/

| Folder      | Meaning                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adapters/` | **Permanent** web component policy. Lives forever. e.g. user profile + auth0 claims via auth0-spa-js (`UserDataContext`, so the **real** `OrgFeatureProvider` runs with real role-driven flags), no usage limits, `next/dynamic` → `React.lazy`, `next-view-transitions` → in-element router, inert org dashboards, real seeded org-DB data (no decryption). |
| `stubs/`    | **Temporary** debt. Milestone B must replace each one — every file carries a `TEMPORARY STUB — Milestone B: …` banner saying what replaces it.                                                                                                                                                                                                               |

## The rule

- **Mount real providers when the code can run in the web component** (real axios,
  real services, real chat) — don't fake what works.
- **Alias-swap when it can't** (Next-only routes like `/api/auth/token`,
  app-shell concerns like usage limits / org admin).
- **Every fake must be typed against the real shape** via a _type-only_ import
  from the real app module, e.g.

  ```ts
  type RealModule = typeof import("@/lib/context/DashboardStatsProvider");
  export const useDashboardStats: RealModule["useDashboardStats"] = () => VALUE;
  ```

  `tsc` resolves `@/*` to the **real** files (it knows nothing of the vite
  aliases), so drift between a fake and the real context shape is a **build
  error** instead of a silent runtime failure. (A missing `enforceLimit` in the
  DashboardStats fake once silently broke message submit — the type-only import is
  what now makes that a compile error.)

- **Keep returned objects/functions as stable refs.** Consumers put them in
  hook dep arrays; a fresh closure per render once caused an infinite fetch loop.
  The real `EventsProvider`'s `seedEvents` is a stable
  `useCallback([])`, which is why the widget can now mount it directly instead
  of an inert adapter.

## Adding a new adapter or stub

1. Create the file in `web-component/adapters/` (permanent policy, header
   `// WEB-COMPONENT ADAPTER — permanent policy: <why>`) or `web-component/stubs/`
   (temporary, banner `// TEMPORARY STUB — Milestone B: <what must replace
it>. Delete this file when done.`).
2. Type every export against the real module:
   `type Real = typeof import("@/lib/...");` then annotate each export with
   `Real["<name>"]` (or `ContextType<Real["SomeContext"]>` for context values).
   Fill the full real shape with inert no-op values — never a partial object.
3. Add an **anchored** alias in `vite.web-component.config.ts` _above_ the generic
   `@/` alias: `{ find: /^@\/lib\/...\/Module$/, replacement: resolve(adapters
| stubs, "Module.tsx") }`. The `$` anchor keeps sub-path imports
   (`Module/types`, `Module/featureFlags`) resolving to the real files.
   (`vite.web-component.dev.config.ts` / `vite.web-component.analyze.config.ts` reuse these
   aliases automatically.)
4. Run `npm run web-component:typecheck` and `npx vite build --config
vite.web-component.config.ts`.

## Commands

```bash
npm run web-component:typecheck                      # tsc -p web-component/tsconfig.json (drift guard)
npm run web-component:build                           # build dist-web-component/
```
