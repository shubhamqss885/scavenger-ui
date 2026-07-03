# Optimization Changelog

> Plain-language log of every performance/bug change made to Scavenger UI v2, phase by phase.
> Meant to be shared with colleagues & management. Updated after **each** change.
> Companion to `PERFORMANCE_AUDIT.md` (the full analysis). **No UI/UX changes in any item.**

**Legend:** ✅ Done & verified · 🔄 In progress · ⏸️ Deferred · ⬜ Planned

---

## Phase 0 — Quick Wins (latency behaviour + correctness) — ✅ COMPLETE

**Verified:** typecheck clean (exit 0), production build clean (exit 0), all edits confirmed in code.
**Note:** Phase 0 targeted *latency behaviour and bug fixes*, not bundle size — so the route bundle table is unchanged (that's expected; see "Result" below).

| ID | Change | Why (business value) | File(s) | Status |
|----|--------|----------------------|---------|--------|
| **P2** | Added `optimizePackageImports` + production `removeConsole` to build config | Cleaner prod (183 debug logs stripped); future-proofs tree-shaking | `next.config.mjs` | ✅ |
| **P6** | CookieYes consent script switched from `beforeInteractive` → `afterInteractive` | Page becomes clickable sooner — the consent script no longer blocks first interaction (TTI) | `app/layout.tsx` | ✅ |
| **A3** | Added `preconnect` + `dns-prefetch` for API & WebSocket origins | First API/WS call each session is ~100–300 ms faster (connection warmed up early) | `app/layout.tsx` | ✅ |
| **A2** | `<html lang>` now reflects the user's real language (client sync) instead of always "de" | Screen readers announce the correct language; better accessibility & SEO | `app/layout.tsx`, `app/HtmlLangSync.tsx` *(new)* | ✅ |
| **B2** | Auth token-refresh retry now uses the correct network client | Fixes a bug where a retried request could hit the wrong API URL after a token refresh (local/dev) | `lib/services/axiosInstances/index.ts` | ✅ |
| **B1** | Made browser-storage reads crash-safe during server rendering | Removes a latent server-side crash risk in the chat screen | `components/modules/AgenticChat/AgenticChatContext.tsx` | ✅ |
| **P3** | Chat: live "typing/progress" data now updates **only the newest message**, and a click handler was stabilised | Long conversations no longer re-render every past message on each streamed word — chat feels much smoother | `.../messages/AgenticMessageList.tsx`, `.../layout/AgenticChatLayout.tsx` | ✅ |
| **A9** | `fetchPriority` on the LCP image | — | `.../header/SidebarLogo.tsx` | ⏸️ Deferred — needs a real Lighthouse trace to confirm which image is the LCP element before applying (avoids mis-optimizing) |

### Phase 0 — Result (measured)
Re-ran `next build` after the changes. **Bundle table essentially unchanged** (shared JS 89.4 kB; heaviest routes ~492–494 kB). This is expected and honest:
- The package-import optimization is **largely redundant** — Next.js 14.2 already optimizes those libraries by default.
- `removeConsole` savings are real but too small to change the kB rounding.
- The CookieYes, preconnect, chat-render and bug fixes improve **runtime latency & correctness**, which the static bundle table does **not** measure.

**Takeaway for the team:** Phase 0 = *faster interaction + fewer bugs*. The **bundle-size reductions come in Phase 1 (lazy-loading) and Phase 2 (architecture)** — the fact that even static legal pages still ship 245 kB is the proof point that the big lever is the client-rendering architecture (Phase 2, item P1).

---

## Phase 1 — High-Impact (bundle size + responsiveness) — 🔄 IN PROGRESS

Goal: **actually shrink the heavy route bundles** and keep the UI responsive under load. Each item below is verified with a build/typecheck before being marked done.

| ID | Planned change | Expected value | Status |
|----|----------------|----------------|--------|
| **P5** | Lazy-load heavy libraries — code highlighter (`react-syntax-highlighter`) moved to an on-demand chunk via a shared `LazyCodeHighlighter` | Removes the highlighter (~9–10 kB) from initial JS on chat + data-source routes; it now loads only when code is actually shown | ✅ |
| **P4** | Virtualize the chat message list with `react-virtuoso` (render only visible messages) | Smooth scroll + lower memory in long conversations. **Trade-off:** adds ~18 kB to chat routes (the virtualization lib) — a runtime win, not a bundle win. **Needs manual QA** (scroll behaviour). | ✅ (pending your QA) |
| **B3** | WebSocket reconnect: exponential backoff + jitter (cap 30s) + pause while tab hidden, reconnect on return | Stops the endless fixed 5-second reconnect loop during outages; much less background battery/network drain | ✅ |
| **P8** | Extract 3 sidebar sections (Dashboards/Groups/Databases) into `React.memo` components; Chats left inline | These sections no longer re-render when unrelated sidebar state changes (chat streaming, other-section rename/search) — less render work, esp. for large orgs. **Needs sidebar QA.** | ✅ (pending your QA) |
| **A4** | `useDeferredValue` on sidebar search so filtering doesn't block typing | Search input stays responsive while filtering large project/db/dashboard lists | ✅ |
| **A6** | Moved static `display:block` out of inline `style` into a class (sidebar usage bar) | Minor tidy — see honest note below | ✅ |
| **A11** | Legacy chat `<img>` hardened with `loading="lazy"` + `decoding="async"` (kept as raw `<img>`) | Defers off-screen legacy chart images; `next/image` intentionally not used | ✅ |
| **A1** | Cancel in-flight API requests when leaving a page | No wasted requests / stale-data flashes / console warnings on navigation | ⏸️ Deferred to Phase 2 (coordinate with P7 React Query migration) |
| **A8** | Real-user Web Vitals (LCP/INP/CLS/FCP/TTFB) → PostHog (consent-gated, lazy-loaded) | Real field performance data from actual users — proof optimizations help in production | ✅ |

### Detailed entries

#### P5 — Lazy-load the code highlighter — ✅ Done & verified
- **What:** Created a shared `components/ui/lazy-code-highlighter.tsx` (+ `.impl.tsx`) that loads `react-syntax-highlighter` and its prism styles in a separate on-demand chunk (via `React.lazy`), showing the raw code in a `<pre>` while it loads. Repointed all 4 call sites (chat markdown, SQL detail sheet, examples card, vault preview) to it. **No visual change** — same styling/props.
- **Investigation finding:** The other "heavy libs" flagged in the audit were **already lazy** — `recharts` (via `dynamic(AgenticChart)` in both chat and dashboard), `react-force-graph` (dynamic in GraphView), and the export libs `jspdf`/`pptxgenjs`/`html2canvas` (imported inside click handlers). So the highlighter was the only remaining eager one.
- **Measured result (production build, First Load JS):**

  | Route | Before | After | Δ |
  |-------|-------:|------:|---:|
  | `/project/[projectId]/agent` (chat) | 492 kB | 483 kB | −9 kB |
  | `/groups/[groupId]` | 494 kB | 485 kB | −9 kB |
  | `/data-sources/[id]/context` | 417 kB | 408 kB | −9 kB |
  | `/data-sources/[id]/examples` | 358 kB | 348 kB | −10 kB |

- **Verified:** typecheck clean; production build exit 0.
- **Honest note:** Modest (~9–10 kB/route) because most heavy libs were already split. The routes remain ~480 kB due to the shared client-app bundle — that's addressed structurally in Phase 2 (P1).
- **Process note:** Building through a shell pipe (`| tee`) masks the real exit code (it reports the pipe's, not `next build`'s). Always run `next build` **unpiped** to catch lint/prettier failures — this project treats prettier violations as build errors.

#### B3 — WebSocket reconnect hardening — ✅ Done & verified
- **What:** In the notifications WebSocket (`lib/context/EventsContext`), replaced the fixed `setTimeout(connect, 5000)` reconnect with **exponential backoff + jitter** (1s → 2s → 4s … capped at 30s, reset on successful connect). Reconnect now **pauses while the browser tab is hidden** and fires a fresh attempt via a `visibilitychange` listener when the user returns. Listener is cleaned up on unmount.
- **Why it mattered:** If the notifications endpoint was down or Wi-Fi flapped, the old code reconnected every 5 seconds forever — wasting battery/CPU/network, including in background tabs, and hammering the backend on recovery.
- **Not included (needs backend confirmation):** an application-level heartbeat/ping to detect "half-open" dead sockets. That requires knowing whether the server responds to pings; adding it blindly could send messages the server doesn't expect. Flagged as a follow-up.
- **Verified:** production build exit 0, full compile. (No bundle change — this is runtime behaviour.)

#### P4 — Virtualize the chat message list — ✅ Done (build-verified) · ⚠️ needs manual QA
- **What:** `AgenticMessageList` now renders through `react-virtuoso` so only on-screen messages are mounted. Rewired the scroll-dependent UI in `AgenticChatLayout` (scroll-to-bottom button, input-bar auto-collapse) onto Virtuoso's `atBottomStateChange` / `onScroll` / imperative `scrollToBottom`. Preserved: stick-to-bottom while streaming (`followOutput`, only when already at bottom), jump-to-bottom when the user sends, the centered `max-w-4xl` column, top padding, bottom spacer, group-typing indicator, empty/loading states. The old `useScrollToBottom` hook is now unused (safe to delete later).
- **Trade-off (measured):** chat route `First Load JS` went **483 → 501 kB** (agent) and **485 → 503 kB** (groups) — +18 kB for the virtualization library. This is a **runtime optimization** (DOM node count, scroll smoothness, memory on long conversations), not a bundle-size one. For very short chats it's slight overhead; for long analytics conversations it's a clear win.
- **Verified:** production build exit 0, full compile, typecheck clean.
- **⚠️ MANUAL QA REQUIRED** (cannot be verified by build — needs the running, logged-in app):
  1. Open a chat with **many** messages → scroll up/down is smooth; no blank gaps or jumpiness.
  2. Send a message → view jumps to the newest message.
  3. While the agent is **streaming**, staying at the bottom keeps auto-scrolling; scrolling **up** mid-stream is NOT yanked back down.
  4. Scroll up → the **scroll-to-bottom button** appears; clicking it returns to the bottom.
  5. Scrolling **down** collapses the input bar (existing behaviour).
  6. Open a SQL block / chart from a message → detail sheet still works.
  7. Group chat → the "X is asking the assistant…" indicator still shows.
  8. Empty chat / loading history → hint and loading spinner still render.
  - If anything regresses, this change is **self-contained and easy to revert** (`AgenticMessageList.tsx` + `AgenticChatLayout.tsx`).

#### P8 — Split sidebar sections (partial) — ✅ Done (build-verified) · ⚠️ needs manual QA
- **What:** Extracted the **Dashboards**, **Groups**, and **Databases** sections of `AppSidebar` into standalone `React.memo` components (`components/blocks/AppSidebar/components/sections/`). Each receives only stable props (memoized data + `useCallback` handlers), calls `useTranslation` itself, and the `searchQuery` is **gated per section** (a section only sees the query text when it's the active search target). The **Chats** section was left inline (it's the most coupled — selection, convert-to-group, streaming/unread badges) to keep risk contained.
- **Why:** The whole 1,236-line sidebar previously re-rendered and re-mapped all four sections on any state change (a rename in one section, a search keystroke, chat streaming/unread updates). Now the three extracted sections skip re-rendering when the change doesn't concern them — most visible for large orgs with many dashboards/databases/groups.
- **Bundle:** unchanged (home 358 kB) — this is a **render-cost** optimization, not a bundle-size one.
- **Verified:** production build exit 0, full compile, typecheck clean.
- **⚠️ MANUAL QA REQUIRED** (open the sidebar, expanded):
  1. Each section (Dashboards / Groups / Databases) still lists items and navigates correctly.
  2. **Rename** in each section: click rename → edit → Enter saves, Esc cancels; focus behaves as before.
  3. **Search** icon per section filters only that section; clearing works; searching auto-expands the section.
  4. **Collapse/expand** each section header works and is independent.
  5. Row actions menus (rename / delete / set-default / convert-to-group) all fire correctly.
  6. Databases: default badge + connection status dots still correct.
  7. Groups: "Beta" badge shows; admin-only actions still gated.
  - Self-contained; revert = restore `AppSidebar/index.tsx` + delete the 3 new section files.
- **Follow-up:** the Chats section could be extracted the same way later (moves the streaming/unread subscriptions down so they don't re-render the parent at all).

#### A4 — Defer sidebar search filtering — ✅ Done & verified
- **What:** `AppSidebar` now derives a `useDeferredValue(searchQuery)` and the four `filtered*` memos filter on that deferred value, while the search input still binds to `searchQuery` (instant keystroke feedback). Under React's concurrent rendering, filtering a large list can be interrupted by further typing instead of blocking it.
- **Value:** noticeably smoother search typing for orgs with many projects/databases/dashboards. No visual change.
- **Verified:** production build exit 0, full compile.

#### A6 — Inline style tidy (sidebar usage bar) — ✅ Done
- **What:** Moved the static `display: "block"` out of the inline `style={{}}` into a `block` class on the two usage-bar fill spans (`SidebarUsageIndicator`). The dynamic `width: ${percent}%` stays inline (it must).
- **Honest note:** The original audit flagged inline styles as "defeating memo." On inspection these are **leaf DOM spans** — the inline style does **not** break any parent `React.memo`, so the perf impact is negligible. This change is cosmetic/hygiene only; kept it minimal rather than over-engineering a CSS-variable indirection for no real gain.
- **Verified:** production build exit 0.

#### A11 — Harden legacy chat image — ✅ Done
- **What:** The chart chip's legacy fallback `<img>` now uses `loading="lazy"` + `decoding="async"` (added an `eslint-disable` with rationale for the `no-img-element` lint).
- **Why not `next/image`:** `legacyImage` is a runtime URL of unknown dimensions/origin (frequently a data URL). `next/image` needs known dimensions + whitelisted domains and doesn't optimize data URLs — converting risked breaking the display for no real gain. Lazy-loading is the safe win.
- **Verified:** production build exit 0.

#### A8 — Web Vitals → PostHog — ✅ Done & verified
- **What:** Added the `web-vitals` dependency and a `lib/analytics/reportWebVitals.ts` helper that forwards LCP / INP / CLS / FCP / TTFB to PostHog as `web_vital` events. Wired into `AnalyticsProvider` right after PostHog initializes — so it's **consent-gated** (only runs with analytics consent) and `web-vitals` is **dynamically imported** (stays out of the main bundle).
- **Value:** we now get real-user field metrics (not just Lighthouse lab numbers) — the data to prove each optimization actually helps real users, and to watch INP during chat streaming.
- **Verified:** production build exit 0; home route First Load JS unchanged (358 kB) since the lib is lazy-loaded.

#### A1 — Not done this pass (by design)
- **A1 (request cancellation):** Adding `AbortController` across ~18 services + all provider call sites is a broad, riskier change. The audit recommends coordinating it with the **Phase 2 React Query migration (P7)**, which provides per-query cancellation for free. Deferred to land with P7.

*(Further Phase 1 entries appended as each item lands.)*

---

#### B4 — File-delete flicker fixed — ✅ Done & verified
- **What:** In `AgenticChatContext`, deleting a project file now records the id in a short-lived `recentlyDeletedRef` tombstone (auto-clears after 15s). The `fetchProjectFiles` merge filters backend entries against it, so an eventually-consistent backend list can't resurrect a just-deleted file.
- **Value:** deleted files no longer flicker back into the list right after deletion.
- **Verified:** production build exit 0, full compile. (No bundle change.)

#### B5 — Stuck "typing…" indicator — reviewed, intentionally unchanged
- **Finding:** The 60s clear-timeout on the group "X is asking the assistant…" indicator is a **deliberate fallback**, not a bug — another member's agent can legitimately run 30–60s. Shortening it would hide a still-valid indicator (a UX regression). The only genuine stuck case is a dropped agent-response WS event, which a safe fix can't resolve without a backend delivery guarantee. **Left as-is** to avoid regressing intended behaviour.

#### B6 — Console at source — covered by P2
- `removeConsole` (P2) already strips `console.*` from production builds. Source-level cleanup of intentional logs is optional hygiene; not separately actioned.

#### P1 — Provider-tree split attempted → measured → reverted (important finding)
- **What we tried:** (1) routed static legal pages through the light branch (skip providers), then (2) code-split the whole authenticated provider tree out of `App.tsx` via `next/dynamic(ssr:false)` into an `AuthenticatedApp` chunk.
- **Measured result:** **no bundle reduction.** Legal pages stayed at ~245 kB; every route's First Load JS was unchanged (±1 kB). Both changes were **reverted** to the original `App.tsx` (build clean, back to baseline).
- **Why the audit's P1 premise doesn't hold:** the "everything is client-rendered → 245 kB" assumption was wrong. The **shared-by-all bundle is only 89.8 kB** — the provider tree is *not* the bulk. Each route's weight is dominated by **framework + vendor libraries + that route's own feature code**, not the auth/provider wrapper. Splitting the wrapper moves nothing meaningful and (with `ssr:false`) even removes SSR of the shell.
- **Corrected approach (data-driven):** to actually cut bundles we must **measure first** — add `@next/bundle-analyzer`, inspect the real heavy chunks, and target the specific large vendor/feature modules that recur across routes. Guessing at architecture does not work here.
- **Lesson for the plan:** treat "reduce the 245/358 kB" as an **analyzer-led investigation**, not a blind refactor.

#### Bundle-analyzer investigation — ✅ Done (the data that replaces guessing)
- **What:** Added `@next/bundle-analyzer` (env-gated: `ANALYZE=true npm run build`, no browser popup) and parsed the client report to rank real module sizes.
- **Already lazy / not a problem:** `mermaid` (~1.2 MB, plus its cytoscape/katex tree ~2.7 MB total), `jspdf`, `recharts`, `html2canvas` — all in on-demand chunks, not in First Load JS.
- **Real eager culprits found (in First Load JS):**

  | Package | Parsed size | Where it's eager | Fix |
  |---------|------------:|------------------|-----|
  | **posthog-js** | ~159 kB | `AnalyticsProvider` (static import) → **every authed route** | Dynamic-import (already consent-gated at runtime) — saves ~159 kB on *every* route |
  | **sql-formatter** | ~235 kB | `AgenticChat/utils.ts` (static) → chat + examples routes | Lazy-load the formatter — saves ~235 kB on the chat route |
  | **framer-motion** | ~101 kB | RotatingStatus (chat) + all Connectors forms | Widely used; lower-priority |
  | **audio/recorder libs** | ~94 kB | `useAudioRecording` (voice input) | Lazy-load on first record |
  | **refractor** (highlighter langs) | ~567 kB | now inside the P5 lazy chunk | Restrict Prism languages to shrink that chunk |

- **Top two, highest-confidence wins:** (1) **posthog-js dynamic-import** → ~159 kB off *every* authed route (home 358→~200, agent 502→~343 estimated); (2) **sql-formatter lazy-load** → ~235 kB off the chat/examples routes.
- **Takeaway:** These are concrete, measurable targets — the correct replacement for the (reverted) P1 guess.

## Phase 2 — Re-scoped: analyzer-led bundle cuts + latency items — ⬜ TARGETS IDENTIFIED

> **Revised:** the headline bundle numbers are **not** fixed by the provider-split (P1) — that was measured and reverted (see above). The real path is an **analyzer-led** hunt for the actual heavy chunks. The items below remain valid for *first-paint latency / responsiveness*, but the "big bundle drop" now depends on the analyzer investigation, not P1 as originally written.

| ID | Planned change | Expected value |
|----|----------------|----------------|
| **P1** | Server-rendered app shell; move static pages (legal, pricing) to server components | Big drop in initial JS; instant first paint; fixes the "everything is client-rendered" root cause |
| **P7** | Migrate context providers to React Query; parallelize independent fetches | Faster first load (parallel instead of chained requests); caching |
| **A1** | Request cancellation (lands with P7 — React Query cancels per-query) | No wasted requests / stale-data flashes on navigation |
| **P9/P10** | Broaden memoization + virtualization to remaining long lists | Smoother large-org experience |
| **A5/A7** | Scoped `<Suspense>` boundaries; evaluate view-transition polyfill | Partial page rendering; less route-change overhead |

---

_Last updated: 2026-07-03 — Phase 0 ✅. Phase 1 ✅. A8 ✅. B4 ✅. B5/B6 reviewed. **P1 provider-split tried, measured (no bundle gain), reverted** — corrected path is an `@next/bundle-analyzer`-led hunt for the real heavy chunks. Remaining structural (P7, A1, P9, P10, A5, A7) still valid for latency/responsiveness. P4 & P8 still pending your manual QA._
