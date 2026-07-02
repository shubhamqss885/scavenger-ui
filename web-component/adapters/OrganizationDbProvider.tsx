"use client";

// WEB-COMPONENT ADAPTER — permanent policy: the widget has no data-sources
// management UI, so org-DB *actions* (add/edit/delete/rename/setDefault) are inert.
// But the *data* is real: ChatBoot seeds the plain org-DB list (fetched in boot.ts)
// via `setWidgetOrgDbs(...)` before the chat mounts, so `getDbById` / `defaultDb`
// resolve real databases — the header shows the DB name and new chats are created
// against the org default.
//
// No decryption: `getOrganizationDbs` already returns a plain `display_name`
// (+ orgdb_id / is_default / is_connected). The app only decrypts for backward-compat
// (when display_name didn't exist) and for the data-source management fields
// (host/user/password) — neither of which the widget needs. The chat header reads
// `display_name` first anyway (AgenticChatContext: dbName). Same approach as the
// shipped Stencil widget.
//
// Typed against the real module (type-only import) so drift is a compile error.

import type { OrganizationDb } from "@/lib/services/organizationDbService";

type RealOrgDbModule = typeof import("@/lib/context/OrganizationDbProvider");
type OrgDbData = ReturnType<RealOrgDbModule["useOrganizationDbData"]>;
type OrgDbActions = ReturnType<RealOrgDbModule["useOrganizationDbActions"]>;

// Seeded once by ChatBoot (setWidgetOrgDbs) before any consumer mounts — same
// timing as the OrgFeature profile seed.
let CACHED_DBS: OrganizationDb[] = [];

// Stable module-scope fn (consumers put it in hook dep arrays). Reads the live
// list so it stays correct after seeding without a fresh identity per render.
const getDbById = (dbId: string): OrganizationDb | null =>
  CACHED_DBS.find((db) => db.orgdb_id === dbId) ?? null;

const buildData = (): OrgDbData => ({
  organizationDbs: CACHED_DBS,
  loading: false,
  error: null,
  defaultDb: CACHED_DBS.find((db) => db.is_default) ?? null,
  getDbById,
  isAddingDb: false,
});

// Rebuilt once per seed so the returned value is a stable ref across renders.
let CACHED_DATA: OrgDbData = buildData();

export const setWidgetOrgDbs = (dbs: OrganizationDb[]): void => {
  CACHED_DBS = dbs;
  CACHED_DATA = buildData();
};

// Inert — the widget has no data-source management surface.
const ORG_DB_ACTIONS: OrgDbActions = {
  fetchOrganizationDbs: async () => {},
  addOrganizationDb: async () => "",
  updateDb: async () => {},
  updateDbByUrl: async () => {},
  deleteDb: async () => {},
  renameDb: async () => {},
  setDefaultDatabase: async () => {},
  updateDbStateById: () => {},
  beginAddingDb: () => {},
  endAddingDb: () => {},
};

export const useOrganizationDbData: RealOrgDbModule["useOrganizationDbData"] =
  () => CACHED_DATA;

export const useOrganizationDbActions: RealOrgDbModule["useOrganizationDbActions"] =
  () => ORG_DB_ACTIONS;

export const OrganizationDbProvider: RealOrgDbModule["OrganizationDbProvider"] =
  ({ children }) => <>{children}</>;
