# Scavenger UI v2 — Performance Audit & Optimization Plan

> **Goal:** Reduce latency, fix latent bugs, and harden edge cases **without changing the UI/UX**.
> **Scope:** Front-end only (Next.js 14 App Router). No backend changes assumed.
> **Date:** 2026-06-30
> **Status:** Findings + prioritized action plan. Ready for kickoff.

---

## 1. Executive Summary

The app is functionally complete but carries **structural latency debt**. The single biggest issue is that **the entire application renders on the client behind an auth gate** — there is effectively no server-rendering benefit, and the first paint waits on a chain of auth + profile + org + projects fetches before anything useful appears.

On top of that, the build ships **no bundle-optimization config**, **265 of 415 components are `"use client"`**, heavy libraries are partially eager-loaded, the **chat message list is not virtualized**, and a memoization gap causes **every chat message to re-render on every streaming token**.

None of these require UI/UX changes to fix. They are all internal: configuration, code-splitting, memoization, and data-flow.

### Headline numbers (measured from the codebase)
| Metric | Value | Why it matters |
|---|---|---|
| Components marked `"use client"` | **265 / 415** | Almost the whole tree ships to the browser as JS |
| `next/dynamic` (lazy) imports | **4** | Almost nothing is code-split |
| `React.memo` usages | **5** | Very little render isolation |
| `console.*` statements | **183** | Shipped to production; runtime + bundle cost |
| Nested global context providers | **~13** | Deep provider waterfall before first paint |
| Largest component file | **AppSidebar = 1,236 lines** | Rendered on every page |
| `next.config.mjs` optimization flags | **0** | No `optimizePackageImports`, no `removeConsole` |

### The 5 highest-leverage fixes (do these first)
1. **Add bundle-optimization config** to `next.config.mjs` (`optimizePackageImports`, `compiler.removeConsole`). — *Hours, zero UI risk.*
2. **Fix the chat re-render bug** — `progressSteps`/`statusMessage` passed to every message defeats `React.memo`. — *Hours.*
3. **Lazy-load heavy routes/components** (charts, syntax highlighter, force-graph, mermaid, PDF/PPTX export). — *1–2 days.*
4. **De-block first paint** — move the CookieYes script off `beforeInteractive`. — *Minutes.*
5. **Virtualize the chat message list** for long conversations. — *1 day.*

---

## 1A. Baseline Metrics (captured before optimization)

> Captured from `next build` on the current `Development` branch (Next.js 14.2.25, exit 0). These are the **"before" numbers** — re-run the same build after each phase to show improvement.

### Bundle — First Load JS per route
**Shared by every page: `89.4 kB`.** Each route adds its own JS on top. Google's "good" budget is ~130–170 kB; most routes here are **2–3× over**.

| Route | First Load JS | Note |
|---|---:|---|
| `/groups/[groupId]` | **494 kB** | Heaviest route |
| `/project/[projectId]/agent` | **492 kB** | Core agentic-chat experience |
| `/connectors`, `/connectors/[connectorId]` | 419 kB | |
| `/data-sources/[id]/context` | 417 kB | |
| `/dashboard/[id]` | 370 kB | |
| `/home` | 358 kB | |
| `/data-sources/[id]/examples` | 358 kB | |
| `/data-sources/[id]/profiler` | 346 kB | |
| `/data-sources/[id]/feedback` | 340 kB | page code alone = 35.4 kB |
| `/project/[projectId]` | 294 kB | |
| `/data-sources/[id]/rules` | 287 kB | |
| `/onboarding` | 273 kB | |
| `/data-sources/[id]/data` | 266 kB | |
| `/dashboard` | 253 kB | |
| `/pricing` | 251 kB | |
| `/verify` | 247 kB | |
| `/privacy-policy` | **245 kB** | 🚩 Static page, only ~229 B of real content |
| `/terms-conditions` | **245 kB** | 🚩 Static page, only ~216 B of real content |
| `/` (landing) | 138 kB | |
| **Middleware** | **125 kB** | Runs on every request (Auth0 edge) |

**Shared chunk breakdown:** `89.4 kB` = `53.6 kB` + `31.8 kB` + `4.0 kB` other.

**Reading the data:**
- The two heaviest routes (`groups` 494 kB, `agent` 492 kB) are the **core chat experiences** — the bundle data lines up with the reported lag.
- **Static legal pages ship 245 kB despite ~200 B of content** — hard evidence for **P1** (whole app is client-rendered behind one large shared bundle). A truly static page should be ~90 kB.
- Middleware at **125 kB** executes on every request — keep it in scope.

### Phase 0 outcome (measured after implementing the quick wins)
Re-running `next build` after Phase 0 showed the **route bundle table essentially unchanged** (shared JS 89.4 kB → 89.4 kB; legal pages still 245 kB). This is expected and honest:
- `optimizePackageImports` for `lucide-react` / `date-fns` / `recharts` / `@radix-ui/*` is **largely redundant — Next.js 14.2 already optimizes these by default**, so it was mostly a no-op. (`react-syntax-highlighter` is the one non-default entry; it only pays off once that lib is lazily used — see P5.)
- `removeConsole` strips 183 `console.*` calls — real, but too small to move the kB rounding.
- CookieYes `afterInteractive` + `preconnect` improve **TTI / first-request latency**, which the static "First Load JS" table does **not** measure.
- P3 / B1 / B2 are **runtime-behaviour / correctness** fixes, not bundle-size fixes.

**Conclusion:** Phase 0 delivered latency-behaviour + correctness wins (not visible in the bundle table). The **measurable bundle-size reductions will come from Phase 1 (P5 — lazy-load heavy libs) and Phase 2 (P1 — reduce client-rendering)**. The legal pages still shipping 245 kB is the clearest proof that P1 is the real structural lever.

### Build-surfaced signals (reinforce the findings)
- **~50+ `react-hooks/exhaustive-deps` warnings** across providers (`OrganizationDbProvider`, `OrgFeatureContext`, `AuthContext`, `DatabaseDescriptionProvider`, `OrgDbConfigProvider`, `UserDataContext`, `ProjectFilesProvider`, …). Missing hook deps are latent stale-closure / correctness risks — see **B-series** and **A-series**.
- **`UserDataContext:352`** — the context value *is* memoized but with an incomplete dep array. (Confirms the second review's "not memoized" claim was incorrect; the real issue is dep completeness.)
- **NEW — A11 🟢:** `components/modules/AgenticChat/components/tools/ChartChip.tsx:332` uses a raw `<img>` (Next.js `no-img-element` warning) → switch to `next/image` for automatic optimization / better LCP.
- Multiple **unused imports/variables** (dead code) across `ui/` and modules — minor bundle + hygiene cleanup.

### Lab performance (Lighthouse) — pending, manual step
Lighthouse could **not** be automated here because the app sits entirely behind Auth0 login (audited pages need an authenticated session + a real browser). Recommended procedure to capture the "before" numbers manually:

```bash
# 1) Serve the production build (already built)
npm run start                 # serves .next on http://localhost:3000

# 2) In Chrome: log in normally, open the route to audit
#    (e.g. /home or /project/<id>/agent), then run Lighthouse from
#    DevTools > Lighthouse > Analyze page load (Performance category).
#    Record: LCP, TTI, INP, TBT, CLS, Total Blocking Time.
```
Alternatively, **A8 (Web Vitals → PostHog)** gives real-user field numbers automatically once wired — better long-term signal than lab runs.

---

## 2. Methodology

This audit was produced by static analysis of the repository: reading the provider tree (`app/App.tsx`, `AppLayout.tsx`, `layout.tsx`), the data layer (`lib/services/axiosInstances`, `lib/context/*`), the chat engine (`components/modules/AgenticChat/*`), the build config, and grep-based pattern sweeps for known anti-patterns (eager heavy imports, missing memoization, non-virtualized lists, render-blocking scripts, console logging, etc.).

**Severity legend:**
- 🔴 **Critical** — measurable, user-felt latency or a real bug. Fix first.
- 🟠 **High** — significant cost under realistic load (long chats, big sidebars, slow networks).
- 🟡 **Medium** — meaningful but situational, or lower effort/impact ratio.
- 🟢 **Low / Hygiene** — cleanups, polish, defense-in-depth.

Each finding lists **Evidence (file:line)**, **Impact**, **Fix**, and **Effort** so work can be assigned directly.

---

## 3. Performance Findings

### 🔴 P1 — Whole app is client-rendered behind an auth gate (no SSR benefit)
- **Evidence:** `app/App.tsx` is `"use client"` and wraps the entire tree. `InitializedApp` (`app/App.tsx:83-161`) blocks on `useUserContext().isLoading` and shows `<ScavengerLoading />` until Auth0 → Axios → user profile resolve. 265/415 files are client components.
- **Impact:** First Contentful Paint waits on a **client-side fetch waterfall** (Auth0 session → access token → `/user` profile → org features → projects). The user stares at a spinner during all of it. No HTML streaming, no server-rendered shell.
- **Fix (no UX change):**
  - Render a **static app shell / skeleton** on the server so something paints immediately (the visual result is the same loading state users already see — just delivered as instant HTML instead of after JS boot).
  - Parallelize the provider fetches (see P7) so the gate clears faster.
  - Where feasible, push genuinely static modules (PrivacyPolicy, TermsAndConditions, Pricing marketing copy) to **server components** — they don't need the client providers.
- **Effort:** Large (structural). Highest long-term payoff. Can be staged.

### 🔴 P2 — No build-level bundle optimization
- **Evidence:** `next.config.mjs` contains only `reactStrictMode` + `images`. No `experimental.optimizePackageImports`, no `compiler.removeConsole`, no `modularizeImports`.
- **Impact:** Barrel imports from `lucide-react` (0.374), `@radix-ui/*`, `date-fns`, `recharts`, etc. pull more code than used. 183 `console.*` calls ship to prod.
- **Fix:**
  ```js
  // next.config.mjs
  const nextConfig = {
    reactStrictMode: true,
    compiler: {
      removeConsole: process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
    },
    experimental: {
      optimizePackageImports: [
        "lucide-react", "date-fns", "recharts",
        "@radix-ui/react-icons", "react-syntax-highlighter",
      ],
    },
    images: { /* unchanged */ },
  };
  ```
- **Effort:** Hours. **Zero UI risk. Do this first.**

### 🔴 P3 — Chat: every message re-renders on every streaming token
- **Evidence:** `components/modules/AgenticChat/components/messages/AgenticMessageList.tsx:55-71`. The `messages.map(...)` passes `progressSteps={progressSteps}` and `statusMessage={statusMessage}` to **every** `<AgentMessage>`. Both change rapidly during streaming. `AgentMessage` is wrapped in `React.memo` (`AgentMessage.tsx:172`), but passing a changing prop to all of them **defeats the memo** — the whole list reconciles on each token.
- **Impact:** In a long conversation, typing a single streamed response re-renders **all** prior messages (each running Markdown + syntax-highlighter). This is a primary cause of "chat feels laggy."
- **Fix:** Only the **last** message needs live `progressSteps`/`statusMessage`/`isStreaming`. Pass those props **only to the last agent message**; pass `undefined`/stable values to the rest. Then memo actually holds for historical messages.
- **Effort:** Hours. High impact.

### 🔴 P4 — Chat message list is not virtualized
- **Evidence:** `AgenticMessageList.tsx` renders a plain `messages.map(...)`. No `Virtuoso`/windowing (the project already depends on `react-virtuoso`, used only in `OrganizationSwitcher`).
- **Impact:** Long conversations mount hundreds of message DOM subtrees (each with Markdown, code blocks, tool widgets). Scroll jank + high memory + slow re-renders.
- **Fix:** Render the message list through **`react-virtuoso`** (already a dependency, so no new bundle cost). Same visual output, only visible rows are mounted. Combine with P3.
- **Effort:** ~1 day (chat auto-scroll/stick-to-bottom needs care).

### 🟠 P5 — Heavy libraries imported eagerly instead of lazily
- **Evidence:**
  - `recharts` — eager in `components/ui/chart.tsx:4` and `AgenticChat/components/tools/AgenticChart.tsx:28` (965-line file).
  - `react-syntax-highlighter` (`PrismAsync`) — eager in **4** files (`MarkdownContent.tsx:4`, `SqlTabContent.tsx:4`, `ExampleCard.tsx:11`, `VaultPreview.tsx:8`).
  - `react-force-graph-2d`, `jspdf`, `pptxgenjs`, `html2canvas`, `recharts` are all heavy and only needed on specific views/actions.
  - Only `mermaid` is correctly lazy-loaded (`MermaidDiagram.tsx:37` uses `import("mermaid")`). Use it as the template.
- **Impact:** These libs land in shared chunks and inflate initial JS for users who never open a chart, code block, or export.
- **Fix:** Wrap in `next/dynamic(() => import(...), { ssr: false, loading: <Skeleton/> })`. Export libraries (PDF/PPTX) should be **imported inside the click handler**, not at module top.
- **Effort:** 1–2 days across the listed files.

### 🟠 P6 — Render-blocking third-party script
- **Evidence:** `app/layout.tsx:26-30` loads the CookieYes script with `strategy="beforeInteractive"`.
- **Impact:** `beforeInteractive` injects the script into `<head>` and **blocks the page from becoming interactive** until it loads from a third-party CDN. Directly hurts TTI.
- **Fix:** Change to `strategy="afterInteractive"` (or `lazyOnload`). A consent banner does not need to block first interaction.
- **Effort:** Minutes.

### 🟠 P7 — Provider waterfall: ~13 nested providers, sequential fetches
- **Evidence:** `app/App.tsx:142-158` nests `DashboardStatsProvider → OrgFeatureProvider → UIStateProvider → OrganizationDbProvider → ProjectsProvider → ProjectFilesProvider → OrgDashboardsProvider → AppLayout`, plus `GroupsProvider` inside `AppLayout`. Each provider typically fetches on mount.
- **Impact:** If providers fetch sequentially as they mount, the "ready" state is gated by the **slowest serial chain**, not the slowest single request. Adds avoidable seconds on slow networks.
- **Fix:** Continue the stated migration to **React Query** (already installed) so independent resources fetch **in parallel** with caching/dedup. Audit each provider's mount effect; kick off independent fetches together (`Promise.all`) rather than nesting-induced serialization.
- **Effort:** Medium–Large (incremental per provider).

### 🟠 P8 — `AppSidebar` is a 1,236-line client component rendered on every page
- **Evidence:** `components/blocks/AppSidebar/index.tsx` (1,236 lines), mounted in `AppLayout` for all non-onboarding routes. Contains many `useMemo` sort/filter passes (`:516-584`) and multiple `.map`s.
- **Impact:** Large parse/eval cost on every route; re-renders on any sidebar-touching context change ripple through a big subtree.
- **Fix:** Split into subcomponents (Projects / Dashboards / Databases / Groups sections), each `React.memo`'d and fed only its slice. Confirm the sort/filter `useMemo` deps are stable. Consider lazy-mounting collapsed sections.
- **Effort:** Medium.

### 🟡 P9 — Minimal render isolation across the codebase
- **Evidence:** Only **5** `React.memo` and **4** `next/dynamic` in the whole app, against 415 component files. 23 `key={index}`-style keys (reconciliation churn on reorder).
- **Impact:** Context/state updates cascade into large subtrees that could be cheaply isolated.
- **Fix:** Targeted `React.memo` on list-row and leaf presentational components; stable `key`s based on entity IDs, not array index.
- **Effort:** Ongoing, low-risk, incremental.

### 🟡 P10 — `react-virtuoso` available but underused for long lists
- **Evidence:** Imported only in `OrganizationSwitcher`. Project lists, dashboard widget grids, data-source table lists, and the chat list all render full `.map`s.
- **Impact:** Large orgs (many projects/tables/widgets) get long unwindowed lists.
- **Fix:** Apply virtualization to any list that can realistically exceed ~50 rows.
- **Effort:** Medium (per list).

---

## 4. Bug Findings

### 🔴 B1 — `sessionStorage` read in `useState` initializers (SSR / hydration risk)
- **Evidence:** `AgenticChatContext.tsx` reads `sessionStorage` **directly inside `useState` initializers** at `:200-204`, `:209-216`, `:242-246`, `:261-266`, `:290-300`. Contrast with `sendQuery` (`:805`) which correctly guards `typeof window !== "undefined"`.
- **Impact:** Client components are still **server-rendered** by Next.js unless explicitly `ssr:false`. If this provider is ever rendered on the server, `sessionStorage`/`localStorage` is `undefined` → **ReferenceError / 500**, or a hydration mismatch. Today it may be masked by the client-only auth gate, but it is fragile and breaks the moment a route SSRs this subtree.
- **Fix:** Initialize from a constant, then hydrate from storage inside a `useEffect` (client-only); or guard every initializer with `typeof window !== "undefined"`.
- **Effort:** Low.

### 🟠 B2 — Token-refresh retry loses the configured Axios instance
- **Evidence:** `lib/services/axiosInstances/index.ts:75` (and `:51`) retries via the **global** `axios(originalRequest)` rather than the configured instance.
- **Impact:** The retried request **skips the request interceptor** that rewrites `baseURL` for local-dev service routing (`:94-103`) and the response interceptor. In local/dev (and any env relying on that routing) a request that 401s once and is retried can hit the **wrong base URL** or behave inconsistently.
- **Fix:** Retry through the owning instance (e.g., `axiosInstance(originalRequest)` / capture the instance on the config) so interceptors reapply.
- **Effort:** Low.

### 🟠 B3 — Events WebSocket: fixed 5s reconnect, no backoff / heartbeat / cap
- **Evidence:** `lib/context/EventsContext/index.tsx:192-201`. `onclose` schedules `setTimeout(connect, 5000)` with no exponential backoff, jitter, max-attempts, or ping/pong keepalive.
- **Impact:** If the notifications endpoint is down or the network flaps, the client reconnects **every 5s forever** — wasted battery/CPU/network, and a thundering-herd on the backend when it recovers. No heartbeat means silently dead (half-open) sockets aren't detected.
- **Fix:** Exponential backoff with jitter and a sane ceiling (e.g., 1s → 30s); add a heartbeat ping and reconnect on missed pong; pause reconnect attempts while `document.hidden`.
- **Effort:** Low–Medium.

### 🟡 B4 — Chat files `setProjectFiles` merge can resurrect deleted files
- **Evidence:** `AgenticChatContext.tsx:314-323` merges backend list with local optimistic state by appending backend entries `!seen`. `handleDeleteProjectFile` (`:482-504`) removes locally then calls `fetchProjectFiles()`. If the backend list is **eventually consistent** and still returns the just-deleted file, the merge re-adds it.
- **Impact:** A deleted file can briefly flicker back into the list (confusing, and may allow acting on a dead file).
- **Fix:** Track a short-lived "recently deleted" tombstone set and filter backend additions against it for a few seconds, or trust the delete and reconcile only on an explicit refresh.
- **Effort:** Low.

### 🟡 B5 — Group "typing" indicator can hang for 60s
- **Evidence:** `AgenticChatContext.tsx:763-772`. `onAgentTyping` sets a 60s timeout to clear `groupTypingUser`. If the agent's response event is missed/dropped, the indicator stays up the full minute.
- **Impact:** Stale "X is asking the assistant..." UI. Minor, but user-visible.
- **Fix:** Clear on any subsequent message/history-refresh for that group; shorten the fallback timeout.
- **Effort:** Low.

### 🟡 B6 — 183 `console.*` statements shipped to production
- **Evidence:** repo-wide grep: 183 `console.*` in `app/`, `components/`, `lib/`.
- **Impact:** Minor runtime cost, noisy prod consoles, potential information disclosure. Addressed automatically by P2 (`compiler.removeConsole`) but should also be cleaned at source for intentional logs.
- **Fix:** Enable `removeConsole` (P2); replace genuinely-needed logs with a gated logger.
- **Effort:** Low (mostly covered by P2).

---

## 4A. Additional Findings (Second Review — Verified & Merged)

> These come from a second independent review. Each was **re-checked against the current code** before inclusion. Items that duplicated the main plan, or whose claims did not hold up, are listed under "Reviewed but excluded" at the end of this section so nobody re-investigates them.

### 🔴 A1 — In-flight API requests are not cancelled on unmount / route change
- **Evidence:** No systematic `AbortController` / `signal` in the service layer. Only `lib/services/orgDashboardService` and `lib/services/transcriptionService` use any abort/cancel pattern; the other ~18 services do not.
- **Impact:** Navigating away mid-fetch lets the request complete and call `setState` on an unmounted component (React warning, wasted bandwidth). Stale data can flash on the next visit to that route.
- **Fix:** Add an optional `signal?: AbortSignal` param to service functions and forward it to axios `config.signal`. In the calling `useEffect`, create an `AbortController` and abort in cleanup. (React Query migration — P7 — gives this for free per query, so coordinate the two.)
- **Effort:** Medium (touches the service layer). **No UI change.**

### 🟠 A2 — `<html lang="de">` is hardcoded
- **Evidence:** `app/layout.tsx:19` — `<html lang="de" suppressHydrationWarning>` regardless of the user's locale (app supports EN + DE).
- **Impact:** Screen readers announce all content as German for English users; SEO signals the wrong language.
- **Fix:** Drive `lang` from the active i18n locale, fallback `"en"`. Behaviour/appearance unchanged for sighted users.
- **Effort:** Low.

### 🟠 A3 — No resource hints (`preconnect` / `dns-prefetch`) for API + WebSocket origins
- **Evidence:** `app/layout.tsx` `<head>` has no `preconnect`/`dns-prefetch` for `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_WS_BASE_URL`.
- **Impact:** The first API/WS call on each session pays a cold DNS + TCP + TLS handshake (~100–300ms) that could have started during HTML parse.
- **Fix:** Add `<link rel="preconnect">` + `<link rel="dns-prefetch">` for both origins in the head.
- **Effort:** Minutes.

### 🟠 A4 — `useTransition` / `useDeferredValue` under-used (corrected)
- **Evidence:** Only **6** usages across `app/`, `components/`, `lib/`. *(The second review said "zero" — that is inaccurate; there are 6. The real issue is under-use, not absence.)*
- **Impact:** Heavy synchronous updates (route switches, large list renders, sidebar search) block the main thread and freeze the UI briefly.
- **Fix:** Wrap navigation triggers and heavy context updates in `startTransition`; use `useDeferredValue` for sidebar/table search inputs. Non-breaking, no UI change.
- **Effort:** Low–Medium.

### 🟠 A5 — `next-view-transitions` (userland polyfill) wraps every route
- **Evidence:** `app/layout.tsx:6` imports `next-view-transitions`; `app/layout.tsx:44` wraps the whole app in `<ViewTransitions>`.
- **Impact:** Extra JS evaluated on every route change, including in browsers with native View Transitions support — for an animation that may not be visibly used.
- **Fix:** First confirm whether the transition is actually visible/desired (it is UX-adjacent — **verify before removing**). If unused, drop the wrapper. If used, migrate to Next 14's native `<Link unstable_viewTransition>` and remove the package. *(Combines the second review's N5 + N15.)*
- **Effort:** Low — but **gate on confirming it doesn't change a visible transition** (respect the no-UX-change rule).

### 🟡 A6 — Inline `style={{}}` objects in frequently-rendered components
- **Evidence:** `AppSidebar/components/footer/SidebarUsageIndicator.tsx:82,127` (`style={{ width: \`${percent}%\` }}`), `AppSidebar/components/header/SidebarLogo.tsx:46`.
- **Impact:** A fresh object each render. On leaf DOM nodes this is minor churn (it does **not** by itself defeat a parent's `React.memo` — the second review overstated that), but in the sidebar (every page) and chat (per token) it's avoidable work.
- **Fix:** Static values → Tailwind classes. Dynamic values → CSS custom property (`style={{ "--w": \`${percent}%\` }}` + `w-[var(--w)]`) so the object shape is stable.
- **Effort:** Low. (Modest payoff — schedule with other sidebar work, not standalone.)

### 🟡 A7 — No inline `<Suspense>` boundaries inside route layouts
- **Evidence:** Route-level `loading.tsx` skeletons exist, but there are no inline `<Suspense fallback>` boundaries around independent async subsections.
- **Impact:** One slow subsection suspends the whole route to a full-page skeleton instead of letting the rest paint around it.
- **Fix:** Wrap independent async sections (sidebar stats, dashboard widgets) in their own `<Suspense>` with a targeted skeleton — visually equal to today's loading state, just scoped.
- **Effort:** Medium.

### 🟡 A8 — Web Vitals not captured from real users
- **Evidence:** `posthog-js` is installed and consent-gated (`lib/context/AnalyticsProvider`), but the `web-vitals` package is **not** a dependency and no field instrumentation exists.
- **Impact:** We only get lab numbers (Lighthouse). Real-user LCP/INP/CLS on slow devices/networks is invisible — we can't prove the optimization worked in the field.
- **Fix:** Add the `web-vitals` dependency and report `onLCP/onINP/onCLS` to PostHog inside the post-consent init block. *(Note: this adds one small dependency.)*
- **Effort:** Low.

### 🟢 A9 — LCP image lacks `fetchPriority="high"`
- **Evidence:** `SidebarLogo.tsx:51` sets `priority` (preload) but not `fetchPriority="high"`.
- **Impact:** Minor LCP hint. **Caveat:** confirm the sidebar logo is actually the LCP element on the relevant route before treating this as an LCP win — on most content pages it likely isn't.
- **Fix:** Add `fetchPriority="high"` to whichever `<Image>` is genuinely the LCP element.
- **Effort:** Minutes.

### 🟢 A10 — Prefetch lazy chunks after P5 lands
- **Evidence:** Once recharts/syntax-highlighter are code-split (P5), first use fetches the chunk with a visible hitch.
- **Impact:** First chart/code-block render shows a brief loader.
- **Fix:** After main content paints (idle callback), `<link rel="prefetch">` the chart/highlighter chunks so first open is warm. **Depends on P5 first.**
- **Effort:** Low.

### Reviewed but excluded (do not re-investigate)
- **N7 (StrictMode effect bugs)** — already covered by **B3 / B4 / B5** in the main plan; same root causes.
- **N8 ("`UserDataContext` value not memoized")** — **claim is incorrect.** The value *is* memoized (`lib/context/UserDataContext/index.tsx:337`, passed at `:356`). No action needed.
- **N10 (`key={index}`)** — duplicate of **P9**.
- **N11 (`react-virtuoso` unused on lists)** — duplicate of **P10**.
- **N14 (183 `console.*`)** — duplicate of **B6** (handled by P2 + source cleanup).

---

## 5. Edge Cases & "Where It Lags" — Scenario Matrix

These are the concrete conditions to reproduce, demo, and measure against. They map directly to the findings above.

| # | Scenario / Edge Case | Symptom | Root cause | Finding |
|---|---|---|---|---|
| E1 | **Long agentic conversation** (50+ messages), agent streaming a reply | Whole chat janks per token; fans grow | All messages re-render per token; no virtualization | P3, P4 |
| E2 | **First load on a cold cache / slow 3G** | Long spinner before anything paints | Client-only render + auth/profile fetch waterfall | P1, P7 |
| E3 | **First interaction delayed** | Page visible but not clickable | CookieYes `beforeInteractive` blocks TTI | P6 |
| E4 | **Open a chart / SQL code block for the first time** | Hitch while a big lib loads in the main chunk | recharts / syntax-highlighter eager-bundled | P5 |
| E5 | **Export to PDF / PPTX** | Heavy lib parsed even for users who never export | jspdf / pptxgenjs / html2canvas top-level imports | P5 |
| E6 | **Large org**: hundreds of projects/tables/widgets | Sidebar + lists slow to render/scroll | 1,236-line sidebar, unwindowed lists | P8, P10 |
| E7 | **Notifications endpoint down / flaky Wi-Fi** | Constant reconnect churn, battery drain | Fixed 5s reconnect, no backoff/heartbeat | B3 |
| E8 | **Access token expires mid-session in local/dev** | Retried request hits wrong base URL | Retry bypasses configured axios instance | B2 |
| E9 | **A route SSRs the chat provider** (now or future) | 500 / hydration mismatch | `sessionStorage` in `useState` initializers | B1 |
| E10 | **Delete a project file on an eventually-consistent backend** | Deleted file flickers back | Optimistic merge re-adds backend entry | B4 |
| E11 | **Group chat, agent-response event dropped** | "typing…" stuck up to 60s | Long fallback timeout only | B5 |
| E12 | **Rapid project/route switching** | Re-render storms, stale provider fetches | Deep provider tree + low memoization | P7, P9 |

---

## 6. Prioritized Roadmap

### Phase 0 — Quick wins (≈1 day, zero UI risk) ✅ do immediately
- [ ] **P2** Add `optimizePackageImports` + `removeConsole` to `next.config.mjs`.
- [ ] **P6** Move CookieYes script to `afterInteractive`.
- [ ] **P3** Pass streaming-only props (`progressSteps`, `statusMessage`, `isStreaming`) **only to the last** chat message.
- [ ] **B1** Guard `sessionStorage`/`localStorage` reads in `useState` initializers.
- [ ] **B2** Fix token-refresh retry to reuse the configured axios instance.
- [ ] **A2** Drive `<html lang>` from active locale instead of hardcoded `"de"`.
- [ ] **A3** Add `preconnect` / `dns-prefetch` for API + WS origins.
- [ ] **A9** Add `fetchPriority="high"` to the confirmed LCP image.

> **Establish a baseline first:** capture a Lighthouse run + a production bundle report (`@next/bundle-analyzer`) **before** Phase 0 so improvements are quantifiable for the presentation.

### Phase 1 — High-impact (≈1 week)
- [ ] **P4** Virtualize the chat message list with `react-virtuoso`.
- [ ] **P5** Lazy-load recharts, react-syntax-highlighter, react-force-graph; move PDF/PPTX/html2canvas imports into handlers.
- [ ] **B3** WebSocket backoff + heartbeat + tab-visibility pause.
- [ ] **P8** Split `AppSidebar` into memoized sections.
- [ ] **A1** Add `AbortController` cancellation across the service layer (coordinate with P7).
- [ ] **A4** Apply `useTransition` / `useDeferredValue` on nav + heavy search inputs.
- [ ] **A8** Wire Web Vitals → PostHog (adds `web-vitals` dependency).
- [ ] **A6** Convert inline `style={{}}` in sidebar hot paths to Tailwind / CSS vars.
- [ ] **A11** Replace raw `<img>` in `ChartChip.tsx:332` with `next/image`.

### Phase 2 — Structural (≈2–4 weeks, staged)
- [ ] **P1** Server-rendered app shell / skeleton; move static modules to server components.
- [ ] **P7** Migrate context providers to React Query; parallelize independent fetches.
- [ ] **P9 / P10** Broaden memoization and virtualization to remaining long lists.
- [ ] **B4 / B5 / B6** Remaining correctness cleanups.
- [ ] **A7** Add scoped `<Suspense>` boundaries inside route layouts.
- [ ] **A5** Evaluate/remove `next-view-transitions` polyfill (**gate on confirming no visible transition changes**).
- [ ] **A10** Prefetch lazy chart/highlighter chunks after P5 lands.

---

## 7. How We'll Measure Success

Track before/after for each phase:

| Metric | Tool | Target direction |
|---|---|---|
| Initial JS transferred (First Load JS) | `@next/bundle-analyzer` / build output | ↓ significantly after P2 + P5 |
| Largest Contentful Paint (LCP) | Lighthouse / Web Vitals | ↓ after P1 + P6 |
| Time to Interactive (TTI) | Lighthouse | ↓ after P6 + P2 |
| Interaction to Next Paint (INP) during chat stream | Web Vitals / React Profiler | ↓ after P3 + P4 |
| Re-renders per streamed token | React DevTools Profiler | From "all messages" → "last message only" |
| Reconnect attempts during outage | Manual / network logs | Bounded, backed-off |

PostHog (`posthog-js` is already installed) can capture Web Vitals in the field to confirm real-user impact, not just lab numbers.

---

## 8. Guardrails (per project conventions)

When implementing, follow the existing rules so we don't regress quality:
- **No UI/UX changes** — every fix above preserves current appearance and behavior.
- Use the **`Icon`** component, **i18next** for strings, **`cn()`** for classes, `type` (not `interface`), arrow functions, files < ~200 lines (`.claude/docs/guides/codebase-patterns.md`).
- **Do not run `npm run build`** unless explicitly asked (per `CLAUDE.md`).
- Services stay **pure fetchers**; handle errors at call sites.

---

### Appendix A — Key files referenced
- `next.config.mjs` — build config (P2)
- `app/layout.tsx:26-30` — CookieYes script (P6)
- `app/App.tsx:83-161` — client auth gate + provider waterfall (P1, P7)
- `components/blocks/AppSidebar/index.tsx` — 1,236-line sidebar (P8)
- `components/modules/AgenticChat/AgenticChatContext.tsx` — chat provider, storage init (B1, B4, B5)
- `components/modules/AgenticChat/components/messages/AgenticMessageList.tsx:55-71` — re-render bug (P3, P4)
- `lib/services/axiosInstances/index.ts:75,94-103` — retry / interceptor (B2)
- `lib/context/EventsContext/index.tsx:192-201` — WS reconnect (B3)
- `components/ui/chart.tsx`, `AgenticChat/.../AgenticChart.tsx`, `MarkdownContent.tsx`, `SqlTabContent.tsx` — eager heavy imports (P5)
