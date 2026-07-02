# Web component — TODO / follow-ups

Parked work items for the `<scavenger-chat>` web component. See `README.md` (structure +
adapters/stubs taxonomy) and `ARCHITECTURE.md` (design rationale + growth roadmap) for context.

---

## org DB follow-ups (out of scope for the current work)

- **No DB picker / switching.** Each chat is pinned to its default DB; there's no in-chat DB
  selector. (The seeded list in `adapters/OrganizationDbProvider` would back one if ever wanted.)
- **Main-app follow-up (separate PRs, your call):** stop decrypting _for the name_ in the app and
  rely on `display_name`; keep decryption only for data-source management fields
  (host/user/password).

---

## Other parked items (from the stubs review)

- **`AuthContext` consolidation:** the `stubs/AuthContext.tsx` "temp stub" is really a permanent
  context-object adapter (the real refresh now lives in `WebComponentAuthProvider`). Candidate
  to merge into the provider / move to `adapters/` and drop the stub. (Plan was drafted; not yet
  applied.)

(The `tokenRefresh` REST-401 hole that also surfaced in the stubs review is tracked as a
known bug below.)

---

## Known bugs (Milestone B)

1. **Token refresh — mid-session 401 dead-end.** A REST 401 / token expiry still routes through
   the dead Next-only `/api/auth/token` because `createAxiosInstance`'s 401-retry imports
   `./tokenRefresh` _relatively_ (`lib/services/axiosInstances/index.ts:11`), bypassing the Vite
   `@/…` alias to `stubs/tokenRefresh.ts`. Mid-session expiry silently fails instead of renewing.
   (The WS auth-error path already refreshes via auth0; only the REST 401-retry has this hole.)
   See `ARCHITECTURE.md` §4 (Edge cases — "Auth origin allowlist + token lifecycle").

   **Proposed solution.** In `lib/services/axiosInstances/index.ts`, change the line-11 import
   from the relative `from "./tokenRefresh"` to the absolute
   `from "@/lib/services/axiosInstances/tokenRefresh"`. The widget build's anchored alias
   (`^@/lib/services/axiosInstances/tokenRefresh$` in `vite.web-component.config.ts`) then
   routes the 401-retry through `stubs/tokenRefresh.ts` → `getToken()`
   (`auth0Client.getTokenSilently()`), exactly like the WS path. It is **behaviour-neutral for
   the Next app** (the
   relative and absolute paths resolve to the same real module under `tsc`/Next), so it's a safe
   one-line **app-source** edit. _If touching app source is undesirable_, the alternative is to
   add the relative specifier to the alias map — but the import flip is the smaller change.
   **Verify:** with the widget open, force an expired access token (or stub a 401), send a
   message, and confirm the request silently retries with a fresh token and never requests
   `/api/auth/token`.

2. **Refresh bug — Safari silent re-auth on reload.** Safari ITP / storage partitioning blocks
   Auth0's hidden-iframe silent-auth, so the hard-reload silent-probe path (`probeSilentAuth` in
   `auth.ts`, run by `WebComponentAuthProvider`) can drop to the login panel on Safari instead of
   re-authing. **Likely root cause:** `initAuth0` (`auth.ts:19-22`) sets `audience` + `redirect_uri`
   but **no `scope`**, and `loginWithPopup()` passes none either — so `offline_access` is never
   requested, Auth0 issues **no refresh token**, and `useRefreshTokensFallback: true` silently
   falls back to the iframe that Safari blocks.

   **Proposed solution.** Request a refresh token so renewal never needs the iframe:
   - Add `scope: "openid profile email offline_access"` to `authorizationParams` in
     `initAuth0` (`auth.ts:19`). With `useRefreshTokens: true` + `cacheLocation: "localstorage"`
     (both already set), `getTokenSilently` then renews via the rotating refresh token in
     localStorage — ITP-safe, no third-party cookies, no iframe.
   - Tenant prerequisite: the Auth0 **API** must have _Allow Offline Access_ enabled and the
     **Application** must have refresh-token **rotation** configured (recommended for an SPA).
   - Optional hardening: once a refresh token is reliably present, consider dropping
     `useRefreshTokensFallback` so a Safari failure is loud (login panel) rather than a silent
     iframe attempt.

   **Verify on real Safari + iOS Safari:** popup-login once, hard-reload, and confirm the chat
   re-appears _without_ the login button (silent probe succeeds via the refresh token).

3. **File upload stuck at "Queued" — missed `file.indexing_progress` notification.** After a
   successful upload (`uploadProjectFile` returns `file_id`, the file lists, a synthetic
   `{stage:"queued"}` event is seeded — `AgenticChatContext.tsx:316`), the card never advances
   because the real indexing-progress events never arrive over the notifications WebSocket.
   **Not a widget bug** — confirmed against the backend:
   - Frontend is identical to the main app: socket connects, sends `{auth_token}`, routes
     `file.indexing_progress` (`EventsContext/index.tsx:104,174`). No polling fallback.
   - The two clients' JWTs are identical in identity (`sub`/`aud`/`azp` match; no `org_id` in
     either), so identity/Origin/competing-connection theories were all ruled out.
   - **Backend root cause** (`scavenger-payment-service`, the service behind the gateway's
     `/llm/notifications/stream` → `/payment/events`): delivery is a per-user **Redis stream**
     `user:{sub}:stream` (`payment_notification_service.py:108`), read with
     `xread({stream: last_id}, block=15000)` where `last_id` defaults to **`"$"`**
     (`event_websocket.py:37`). `"$"` delivers **only entries added while the socket is already
     blocking in `xread`** and never advances off `"$"` until the first event arrives
     (`payment_notification_service.py:114,143`). Any event `xadd`-ed during a reconnect, an
     HMR reload, the micro-gap between a 15 s block timeout and the next `xread`, or a hair
     before the first read blocks is **skipped permanently** — no error, socket stays open. The
     widget (late mount + dev/HMR churn) loses this race; the main app's stable long-lived
     socket wins. The server-side replay path exists (`last_event_id`) but the frontend never
     sends it (`EventsContext/index.tsx:104` sends only `auth_token`).

   **Proposed solution.**
   - _Quick confirm / frontend stopgap:_ send `last_event_id: "0"` in the auth frame
     (`EventsContext/index.tsx:104`) — replays the bounded stream (`maxlen=1000`) on connect, so
     a just-missed `file.indexing_progress` lands immediately. The FE already de-dups file events
     by `file_id` (`ProjectFilesList`/`EventsContext:175`), so replay is harmless for indexing;
     pair with the existing `clear-notification-events` flow to avoid resurfacing old payment
     toasts. ⚠️ `EventsContext` is the **shared real app file** (not aliased), so this changes the
     main app too.
   - _Proper fix (backend):_ include the Redis `entry_id` in the yielded payload
     (`payment_notification_service.py:142` currently yields only `{type, data}`), so the client
     can persist the last-seen id and send it as `last_event_id` on (re)connect — true resume,
     no duplicate spam.

   **Verify:** upload a uniquely-named file with the main app closed; the card should progress
   `queued → … → done` and disappear from the "indexing" state.
