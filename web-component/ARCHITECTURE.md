# Web-component (WidgetRoot) architecture: deep investigation & alternatives

> A code-grounded architectural review of the `<scavenger-chat>` web component: why it is
> shaped the way it is, what it would take to grow it (sidebar → dashboards), and a
> recommended path. Companion to `web-component/README.md` (the file-by-file structure +
> adapters/stubs taxonomy).

## Context — why this analysis exists

The web component is a spike replacing a drifting Stencil chat widget with the
app's **real** React `AgenticChat`, wrapped as a custom element via
`@r2wc/react-to-web-component` + Vite library mode, shipped to customers (Optiwiser) over
a CDN `<script>`. The thesis is "one chat codebase, no drift." Milestone A is done: the
widget authenticates for real (auth0-spa-js), boots a project, and streams live answers.

The forward question — and the reason for this review — is **how the widget should be
architected if it grows beyond a single chat view** to include the app shell's
`AppSidebar` and the `OrgDashboard` feature, without breaking the "one codebase / drop-in
parity" goals or ballooning the bundle. The current `WidgetRoot` uses a hand-rolled
`view` state machine and wraps _only_ the chat. This document explains why, evaluates
alternatives, and recommends a sequence.

---

## 1. Current architecture map (what's wrapped / gated / stubbed)

### Registration & shape

- `web-component/index.tsx:25` — `r2wc(WidgetRoot, { shadow: "open", props: {...} })`;
  **open Shadow DOM**. The element is subclassed (`:45-51`) to `adoptStyles(shadowRoot)`
  in `connectedCallback` _before_ `super` mounts React (no FOUC). `:27-42` maps 12 kebab
  attributes → camelCase props (URLs/auth + branding). `:53-60` guards
  `customElements.define("scavenger-chat")` so re-registration is a no-op.
- Styling: the app's compiled Tailwind is transformed for the shadow tree by a build-only
  PostCSS plugin (`css-transform.ts`: `:root`/`body`/`scavenger-chat` → `:host`), imported
  as a string (`?inline`) and adopted as one shared constructable `CSSStyleSheet`
  (`shadow-styles.ts`). **No `scavenger-chat.css` is emitted** — the CSS rides inside the
  JS. shadcn floating UI (dialog/sheet/popover/tooltip) portals back _into_ the shadow tree
  via `PortalContainerProvider` (`WidgetRoot.tsx`), not `document.body`.
- Build: `vite.web-component.config.ts` — library mode, entry `web-component/index.tsx`
  → `dist-web-component/scavenger-chat.js`, React **inlined**, `cssCodeSplit:false`.
  Completely separate from `next build`.

### The gate + the one app view

The structure is now **split** (no longer one `WidgetRoot` state machine):

- `WidgetRoot.tsx` is a **thin root** — `resolveConfig(props)` + `applyWidgetPublicEnv`,
  publishes the shadow root via `PortalContainerProvider`, applies branding props as
  `:host` CSS vars, then the provider tree
  `QueryClientProvider → TooltipProvider → SidebarProvider → WebComponentAuthProvider →
AuthGate → (ChatErrorBoundary + Suspense) → ChatBoot`.
- `WebComponentAuthProvider.tsx` owns the **auth state machine** — a 5-kind `AuthView`
  (`:29-33`): `loading | login | origin_blocked | error | authenticated`. Mount effect
  (`:60-88`): `initAuth0(...)` then `probeSilentAuth()` (silent, no popup) → authenticated /
  login / origin_blocked. `login` (`:90`): `loginWithPopup()` → authenticated. It also
  provides the app's **real** `AxiosContext` (live token + a real `refreshSession` →
  `getTokenSilently`).
- `AuthGate.tsx` is the **gate UI** — renders the loading / login / origin-blocked / error
  panels, and renders its children (the chat) only once `authenticated`.
- `ChatBoot.tsx` runs **post-auth**: reads the token from `AxiosContext`, runs `boot.ts`,
  then mounts `UserDataProvider → real OrgFeatureProvider → ProjectsProvider →
EventsProvider → WidgetWorkspace`.
- Module-scope singletons: `queryClient` (`WidgetRoot.tsx:33`) — shared across **all**
  element instances on a page.

### Auth & boot (real, ported from Stencil)

- `web-component/auth.ts` — module-scope `auth0Client` singleton (`:9`); `initAuth0`
  (`:11-28`, `cacheLocation:"localstorage"`, refresh tokens); `probeSilentAuth` (`:64-85`)
  distinguishes `login_required` from `origin_blocked` (the allowlist risk) with an 8s cap.
- `web-component/boot.ts` (`bootChat`, `:46`) — `createAxiosInstance(token)` (the app's
  real axios singleton) → `registerUser()` → `getUserOrganization()` (for the org-DB
  fetch) → `getOrganizationDbs(...)` filtered to `is_connected && !is_deleted` with a
  `default → first → none` pick → `getProjectList()` then pick `is_agentic` project or
  `addNewProject(...)` against the default DB. Returns
  `{ projectId, organizationDbs, defaultOrgDbId }` (`ChatBoot` seeds the OrgDb adapter from
  it so the chat header shows the DB name). Role + org details are **not** returned — the
  real `OrgFeatureProvider` + `UserDataContext` adapter fetch their own. Uses the app's
  own services.
- `web-component/config.ts` — `resolveConfig`: props only (no host env). `applyWidgetPublicEnv`
  bridges the URL props into the widget's own `process.env` (created by `env-shim.ts`, the first
  import in `index.tsx`) so legacy app modules that read `NEXT_PUBLIC_*` see the embedder's values.
  The chat WS reads its URL at connect time via `getWsUrl()` (`AgenticChat/types.ts`), after the bridge.

### What the chat actually consumes (the alias surface)

`AgenticChatContext.tsx:27-56` imports exactly six app-shell modules — these are the alias
targets in `vite.web-component.config.ts:24-62` (anchored `$` regex so sub-paths like
`OrgFeatureContext/featureFlags` still hit real files):

| App module (import site)      | Swapped to                                                              | Kind               |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------ |
| `AuthContext`                 | `stubs/AuthContext.tsx` (context only)                                  | **stub** (temp)    |
| `axiosInstances/tokenRefresh` | `stubs/tokenRefresh.ts`                                                 | **stub** (temp)    |
| `UserDataContext`             | `adapters/UserDataContext.tsx` (auth0-spa-js + axios; billing inert)    | **adapter** (perm) |
| `DashboardStatsProvider`      | `adapters/DashboardStatsProvider.tsx`                                   | **adapter** (perm) |
| `OrganizationDbProvider`      | `adapters/OrganizationDbProvider.tsx` (real seeded data, inert actions) | **adapter** (perm) |
| `OrgDashboardContext`         | `adapters/OrgDashboardContext.tsx` (inert)                              | **adapter** (perm) |
| `next/dynamic` (ChartChip)    | `adapters/next-dynamic.tsx` (React.lazy)                                | **adapter** (perm) |
| `next-view-transitions`       | `adapters/next-view-transitions.tsx`                                    | **adapter** (perm) |

**NOT swapped — the real providers run in the widget:** `EventsContext` (real
`EventsProvider`, mounted by `ChatBoot` → notifications WebSocket → live file-indexing
progress), `ProjectsContext` (real `ProjectsProvider`), and `OrgFeatureContext` (real
`OrgFeatureProvider`, computing real role-driven flags via the `UserDataContext` adapter
that replaced its `@auth0/nextjs-auth0` dependency). The `OrgFeatureContext/featureFlags`
subpath always resolved real.

- **adapters/** = permanent widget policy: never block a send
  (`DashboardStatsProvider.tsx:37` `enforceLimit:()=>false`),
  `next/dynamic`→`React.lazy`.
- **stubs/** = Milestone-B debt; each carries a `TEMPORARY STUB` banner.
- **Drift guard:** every fake is typed via a _type-only_ import of the real module
  (`README.md:18-38`), and `web-component/tsconfig.json` typechecks `web-component/**`
  with `@/*` → **real** files, so a fake that drifts from the real shape is a compile
  error (this is what caught Defect 4). `AxiosContext.Provider` itself is **real** —
  `WidgetRoot.tsx:202-208` feeds the live token in; only the _AuthProvider wrapper_ is
  stubbed.

### Bundle (post-fix, gzipped)

Eager **583.6 kB gz** (one `widget-*.mjs` core ≈ 575 kB: chat + providers + react-query +
markdown; CSS 22 kB). Heavy libs correctly lazy: refractor 273 kB, recharts/`AgenticChart`
145 kB, html2canvas 53 kB. Known waste: ~26 stray app-route chunks (~50 kB) pulled into a
chat-only widget.

---

## 2. Direct answers to Q1–Q4

### Q1 — Why a hand-rolled `view` state machine, not "normal routes"?

**Next App Router routing is physically absent from the standalone bundle.** Vite library
mode builds a single client entry (`web-component/index.tsx`) and `customElements.define`s
it into an arbitrary host page. App Router routing is not a library you can import — it is
a **server + bundler convention**: the `app/` filesystem router, RSC payloads, the
Next dev/prod server matching URLs → route segments, middleware, and the
`AppRouterContext` that `next/navigation` hooks read from. None of that runtime exists on
a customer page. `usePathname`/`useRouter` would have no provider and throw/return null;
`app/.../page.tsx` files are never reached (the widget imports _components_, not routes);
`withPageAuthRequired` (`agent/page.tsx:62`) and `/api/auth/token` don't exist either. The
build's only Next touch-point is `next/dynamic`, already shimmed
(`adapters/next-dynamic.tsx`). The chat itself proves the point: `AgenticChat/**` imports
**zero** `next/*` and zero routing (verified) — it was _built_ routing-free, which is
exactly why it wraps cleanly.

**What client routing COULD work inside a custom element** (relevant only once there is a
_second_ view):

| Option                       | Fit for an embedded element                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| react-router **memory** hist | ✅ Best: routes live in memory, never touch the host URL. Survives multiple instances, no back-button hijack. |
| react-router **hash** hist   | ⚠️ Pollutes the host page's `#hash`; two instances fight over it; back-button affects the host.               |
| **browser** history          | ❌ Hijacks the host page's URL/history — explicitly forbidden by the embed contract.                          |
| **none** (state switch)      | ✅ Simplest; what exists today. Fine for 1 view; gets awkward past ~2–3 views or deep-linking.                |

**Is the current machine "routing"? No — it is an auth gate + a single terminal app view.**
`loading/login/origin_blocked/error` are all auth/boot gating; only `chat` is an app view,
and there is exactly **one**. There is no routing decision yet. A _second_ app view
(dashboard) is what first creates a routing-shaped choice. Keep this separation explicit:
the gate stays a state machine regardless; only the post-gate **app** area needs a router
when it holds >1 view.

### Q2 — Why is only the chat wrapped, not the whole app shell?

The full shell = `app/App.tsx` two-tier provider tree + `AppLayout` (sidebar + top bar +
modals) + the App-Router route pages. What can vs cannot run standalone:

- **Runs standalone (client/axios only):** every provider in `App.tsx:49-79` and
  `:142-158` except the Next-auth ones. `OrgFeatureProvider` (`OrgFeatureContext/index.tsx:91-100`),
  `OrganizationDbProvider`, `ProjectsProvider`, `OrgDashboardsProvider`,
  `UserDataProvider`, `DashboardStatsProvider` are **plain axios REST** providers — no
  server dependency. This is the pivotal finding: data-wise, the shell is portable.
- **Cannot run standalone:** `UserProvider`/`AxiosProvider` → `/api/auth/token` (replaced
  by auth0-spa-js); `withPageAuthRequired` + middleware (Next-only); and **all routing**
  (`App.tsx:30` `usePathname`, `:165-171` `router.push`; `AppLayout` `usePathname`; the
  route pages).

So "just the chat" was chosen because (a) it's the **only Next-and-routing-free unit** in
the app, so it wraps with the least friction; (b) it's the **entire** product the one
embedding customer (Optiwiser) uses; (c) it keeps the eager bundle to chat deps only.
Wrapping the whole shell would add the sidebar's routing coupling, the route-page
redirect logic, and more of the app graph — for features no current customer embeds.

Trade-off summary — **just-chat** (low bundle, high parity _for chat_, low complexity, =
what customers need today) **vs whole-shell** (max "one codebase" fidelity, but most
routing rework, biggest bundle, many nav links that are meaningless in an embed).

### Q3 — How would you show the `AppSidebar` inside the widget?

Dependency graph (`AppSidebar/index.tsx`):

- **Contexts:** `useOrgFeatures` (`:9`), `OrgDashboardsContext` (`:10`), `useProjectsData/
Actions` (`:13-16`), `useOrganizationDbData/Actions` (`:17-20`), `useUIState` (`:21`);
  footer adds `useUserContext`, `useSettingsModal`, `useSidebar`; usage bar adds
  `useDashboardStatsState`. Streaming dots use `useStreamingProjectIds` from
  `AgenticChat/chatSession` (`:40`) — already in the bundle, so that works for free.
- **Routing (the blocker):** `usePathname` from `next/navigation` (`:22`),
  `useTransitionRouter` from `next-view-transitions` (`:23`), and `Link` from
  `next-view-transitions` in `SidebarLinkItem`. Link targets are **Next routes that don't
  exist in the embed**: `/home`, `/connectors`, `/dashboard/{id}`, `/project/{id}`,
  `/data-sources/{id}/data`, plus a hard `<a href="/api/auth/logout">` in the footer.
  `usePathname` drives `.active` styling.

Currently **stubbed/adapted** deps: ProjectsContext, OrganizationDbProvider (stubs →
empty lists), OrgFeatureContext, DashboardStatsProvider (adapters). **No alias exists** for
`next/navigation`, `next/link`, or `next-view-transitions` — only `next/dynamic`.

What "sidebar in the widget" requires:

1. **Promote the data providers to real** (delete the aliases; they're axios-based and the
   token is already live). The drift guard makes this safe — same typed shape.
2. **Neutralize routing**: add aliases for `next/navigation` (→ internal pathname/no-op),
   `next/link` and `next-view-transitions` (→ passive `<a>`/internal navigate). Without
   this the sidebar throws (no `AppRouterContext`).
3. **Redefine link semantics**: every `router.push`/`Link` must become an **in-element view
   change** (select project, switch view) instead of a URL nav, or be hidden.
4. **Edge cases:** empty/loading project & DB lists; the `/api/auth/logout` link must
   become an auth0-spa-js `logout()`; `OrganizationSwitcher` does `router.push("/home")`;
   feature-flag gating means the all-true adapter would _show everything_ (data-sources,
   org-switcher, dashboards) — most of which has nowhere to go in a chat widget.

**Minimal "sidebar-lite":** projects list + "new chat" + streaming indicator only — drop
data-sources, dashboards, org-switcher, settings. This needs real `ProjectsProvider`
(+ enough `OrgFeatures` for flags) and an internal "active project" state instead of
`router.push`, sidestepping most of the routing rework.

### Q4 — What changes to add `OrgDashboard` to the widget?

- **New provider:** the real `OrgDashboardsProvider` (`OrgDashboardContext/index.tsx:57`) —
  the widget uses an inert `adapters/OrgDashboardContext.tsx` today. Its fetch is gated on
  `orgId = userOrganizationProfile?.current_organization` (`:67,78`) and
  `userProfile?.user_role_name` (`:68`, viewer→`listMyDashboards`, else→`listDashboards`) —
  **both now satisfied**: the real `OrgFeatureProvider` supplies `userOrganizationProfile`
  and the real role flows through the `UserDataContext` adapter. (OrgFeature → real +
  UserData → real is **done** — see the alias-surface table above.) So the remaining work
  for dashboards is just mounting the real provider + the routing below.
- **Routing:** the module uses `useRouter`/`useParams` (`OrgDashboard/index.tsx:4`,
  `SingleDashboard.tsx:3-4`), reads `[id]` from the route, and reads share tokens from
  `window.location.search`. In the embed, the dashboard id must come from a **prop/internal
  router**, not `useParams`; share-link redemption needs rethinking. It also imports
  `Link` from `next/link` (`OrgDashboardContext/index.tsx:24`).
- **Switching chat ↔ dashboard:** introduces the **second app view** → the first real
  routing decision (internal router or a `view` prop).
- **Bundle:** charts reuse the already-lazy `AgenticChart`/recharts chunk (~145 kB gz, no
  new eager cost). Export libs (html2canvas/jsPDF/pptxgenjs) are lazy-on-click. The
  dashboard module + its modals add a modest eager increment.
- **Concrete change set:** mount the real `OrgDashboardsProvider` (OrgFeature + UserData are
  already real); alias `next/navigation`/`next/link`; feed dashboard id by prop; add a second
  view + a switch; keep recharts lazy.

---

## 3. Q5 — Alternate architectures (matrix + recommendation)

| Option                                                                                      | Shape                                      | Pros                                                                                                              | Cons / edge cases                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **(a) Status quo** — auth-gate + single chat view                                           | What ships today                           | Smallest bundle; zero routing; matches the only customer's need; lowest drift risk; shadow-DOM isolation proven   | No sidebar/dashboards; project switching needs a different surface                                                                                                                               |
| **(b) Wrap the FULL shell** (`<scavenger-app>`: layout+sidebar+providers+in-element router) | Port `App.tsx`+`AppLayout` minus Next-auth | Max "one codebase" fidelity; everything the app has                                                               | Most routing rework (every `Link`/`router.push`); biggest bundle; many nav targets meaningless in an embed; `withPageAuthRequired`/middleware logic must be reimplemented; highest drift surface |
| **(c) In-element client router** (react-router **memory**) with chat + dashboard views      | A real router scoped inside the element    | Clean multi-view + in-widget nav (sidebar→project/dashboard); never touches host URL; survives multiple instances | New dep + concept; must alias `next/navigation`/`next/link`→the internal router; only worth it at ≥2 views                                                                                       |
| **(d) Multiple custom elements** (`<scavenger-chat>`, `<scavenger-dashboard>`)              | One focused root each                      | Host page places each independently; each root small & legible                                                    | Duplicates React/provider tree/auth per element unless shared via module singletons; multi-instance auth/queryClient contention; no _in-widget_ nav between them                                 |
| **(e) One prop-driven element** (`view="chat\|dashboard\|shell"`)                           | Attribute selects the view                 | Simplest embed API for "one of N"; no router needed for static selection; reuses one provider tree                | Can't do _in-widget_ navigation (e.g., sidebar click → open a project) without adding (c) underneath                                                                                             |

### Recommendation (sequenced)

**Now: keep (a) for the chat widget** (finish Milestone B). It is the correct scope for
Optiwiser, keeps the bundle lean, and carries the least drift risk. Nothing below should
delay shipping chat.

**When extension is greenlit: adopt a blend of (c) + (e), not (b) or (d).**

- Use an **in-element memory router (c)** as the chassis the moment a second view exists —
  it is the only option that both keeps the host URL untouched _and_ supports in-widget
  navigation (a sidebar that switches projects/views). Expose an **(e)-style `view` /
  `default-view` prop** so a host can drop a chat-only or dashboard-only element without
  the user navigating.
- Reject **(b)** (full shell) for now: it imports the most routing coupling and bundle for
  features no customer embeds. Reject **(d)** (multiple elements) until a host genuinely
  needs two independently-placed widgets — its provider/auth duplication and multi-instance
  singleton contention cost more than its isolation buys.

**Sidebar first, then dashboards** (incremental, each independently shippable):

1. **Sidebar-lite (smallest extension):** promote `ProjectsProvider` (and enough
   `OrgFeatures` for flags) to **real**; render a cut-down `AppSidebar` (projects + new
   chat + streaming dots via the already-bundled `useStreamingProjectIds`); switch the
   active project via **internal state**, not `router.push`. Add the minimal
   `next/navigation`/`next/link`/`next-view-transitions` shims. Measure bundle delta.
2. **Dashboards:** promote `OrgFeatureProvider` + `UserDataProvider` to **real** (required
   — the dashboard fetch is gated on `current_organization` + role), add the real
   `OrgDashboardsProvider`, introduce the **memory router** for chat↔dashboard, feed the
   dashboard id by prop, and keep recharts lazy. Rework share-link redemption for the embed.

**Promoting a stub → real is low-friction:** delete its alias in
`vite.web-component.config.ts` so `@/` resolves to the real provider; the type-only drift
guard already guarantees shape parity. The real cost is _bundle_ (more of the app graph)
and _routing neutralization_, not wiring.

---

## 4. Edge cases addressed

- **Multiple `<scavenger-chat>` on one page:** module-scope `queryClient`
  (`WidgetRoot.tsx:30`) and `auth0Client` (`auth.ts:9`) are **shared singletons**.
  `initAuth0` runs in every instance's mount effect (`WidgetRoot.tsx:100`), so a second
  element **reassigns** the shared `auth0Client` — fine if configs match, a latent bug if
  two elements use different tenants. `customElements.define` is guarded (`index.tsx:24`).
  Per-instance isolation (or an explicit "init once" guard) is needed before multi-tenant
  multi-instance is supported.
- **No SSR:** everything is client-only by construction; `"use client"` directives are
  inert under Vite.
- **URL / deep-linking:** the gate machine and any future router **must** use memory
  history — never browser/hash — to honor "don't hijack the host URL." Deep-linking _into_
  the widget (e.g., a specific dashboard) should be a **prop**, not a URL read.
- **Auth origin allowlist + token lifecycle:** allowlist is per-exact-origin
  (`localhost:3333` works, `127.0.0.1` doesn't). Known gap: the
  **`tokenRefresh` relative-import** — `createAxiosInstance`'s 401 retry imports
  `./tokenRefresh` _relatively_, bypassing the alias, so it still calls the dead
  `/api/auth/token` (`stubs/tokenRefresh.ts:1-8`). A 401 mid-stream fails instead of
  refreshing. Must be closed before production (Milestone B).
- **Bundle:** eager ~575 kB-gz core is the prize; sidebar/dashboard additions should ride
  the existing lazy split (recharts) and avoid adding eager weight. Scope the i18n glob to
  chat namespaces to drop the ~26 stray route chunks.
- **Drift guard when promoting stubs:** removing an alias is safe _because_ the real
  provider is the type source; but watch for **transitive Next imports** newly pulled in
  (e.g., `OrgDashboardContext` imports `next/link` `:24`) — those need their own shims.

---

## 5. Risks + smallest viable next step

**Risks:** (1) routing neutralization is the real work for any shell feature — three packages
(`next/navigation`, `next/link`, `next-view-transitions`) need shims and every link's
_semantics_ must be redefined; (2) bundle creep from promoting real providers + the
dashboard module; (3) multi-instance singleton contention (auth0/queryClient) if a host
places two elements; (4) the `tokenRefresh` relative-import gap; (5) feature-flag policy —
the all-true adapter would surface shell affordances (data-sources, org-switcher) that
have nowhere to navigate.

**Sidebar-lite spike — largely delivered (no commitment to dashboards):**

1. **✅ Done** — `ProjectsContext` and the chats sidebar run on the **real** provider;
   `OrganizationDbProvider` stays a **permanent read-only adapter** (real seeded list +
   inert actions, since the embed has no data-source management UI to drive add/edit/
   delete — promote it to the real provider only if that surface is ever added). The
   `OrgFeatures` adapter stays; its flags drive what the sidebar shows.
2. **✅ Done (for chats)** — `next-view-transitions` is aliased to the in-element router
   (`adapters/next-view-transitions.tsx` + `router.tsx`), which is the only routing the
   chats sidebar drives. The broader `next/navigation` + `next/link` shims stay open —
   only needed once shell/dashboard features that actually navigate are added.
3. **✅ Done** — `WidgetSidebar` renders a cut-down sidebar (chats + new-chat only) beside
   the chat; selecting a project updates `WidgetWorkspace`'s `activeProjectId` state, which
   re-keys `AgenticChatProvider` (switch in-element, never `router.push`).
4. **⏳ Partial** — the eager-bundle delta is measured (~583.6 kB gz, see §1 Bundle);
   **verifying multiple instances on one page is still open** (Risk 3 — module-level
   singletons share auth0 / axios / seeded org-DB state across elements).

This proved the routing-neutralization + real-provider promotion pattern on the lowest-risk
feature and produced a measured bundle number — the prerequisite chassis for dashboards,
without committing to (b)/(c)/(d). The one remaining gap is multi-instance support.

### Verification for any implementation that follows

- `npm run web-component:typecheck` — drift guard (must stay green when promoting stubs).
- `npm run web-component:build:analyze` — build + size report (eager vs lazy).
- `npm run web-component:demo` (build + serve on `:3333`) then drive
  `http://localhost:3333/demo/demo.html` via the agent-browser path — login, render, live
  `chat_with_your_data_ws` stream, and (for sidebar/dashboard work) project switching /
  dashboard load.
- Confirm `next build` is untouched (all changes live under `web-component/` + `demo/`,
  excluded from the root `tsconfig.json`).

### Where I'm uncertain / would verify before building

- Whether `next-view-transitions` can be cleanly aliased vs. needs the sidebar refactored
  to not import it (it wraps `next/navigation` + `next/link` internally) — verify by
  attempting the alias in a spike.
- Exact transitive `next/*` imports pulled in once real `OrgFeature`/`OrgDashboards`/
  `UserData` providers are mounted — grep the real provider subtrees before promoting.
- The product decision on whether the embedded sidebar should expose data-sources / org
  switching at all (drives how much of `AppSidebar` is reused vs. forked to "lite").
