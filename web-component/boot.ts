// Milestone A — post-login boot.
//
// Creates the real axios singleton from the token, registers the user, resolves
// the user's organization, then resolves an agentic project. Uses the app's own
// services so the chat streams against the same API the Next app does.
// Tenant/externalClientId mapping is Milestone B.

import { createAxiosInstance } from "@/lib/services/axiosInstances";
import { registerUser } from "@/lib/services/userService";
import { getProjectList, addNewProject } from "@/lib/services/projectService";
import {
  getUserOrganization,
  type UserOrganizationProfile,
} from "@/lib/services/organizationService";
import {
  getOrganizationDbs,
  type OrganizationDb,
} from "@/lib/services/organizationDbService";

type ProjectLike = {
  project_id?: string;
  id?: string;
  is_agentic?: boolean;
  project_name?: string;
};

const idOf = (p: ProjectLike | undefined): string | undefined =>
  p?.project_id ?? p?.id;

export type BootResult = {
  projectId: string;
  // Plain org-DB list (connected, non-deleted) + the org default's id. Seeded into
  // the OrgDb adapter so the chat header shows the DB name; `defaultOrgDbId` is the
  // DB new chats are created against (so data questions work). Empty/null on
  // failure → chat still streams; data questions fall back to "connect a database".
  // (Role + org profile/details are deliberately NOT returned — see the org-profile
  // fetch below for why.)
  organizationDbs: OrganizationDb[];
  defaultOrgDbId: string | null;
};

export const bootChat = async (token: string): Promise<BootResult> => {
  // Real axios singleton — every app service (getProjectList, ws history, …)
  // reads this via getAxiosInstance().
  createAxiosInstance(token);

  // Register the Auth0 user with the backend (idempotent). Non-fatal if it 4xxs.
  try {
    await registerUser();
  } catch (err) {
    console.warn("[web-component] registerUser failed (continuing):", err);
  }

  // Kick off the project list now — it's independent of the org chain below (both
  // need only the axios singleton + a registered user), so firing it here overlaps
  // it with the org round-trips instead of waiting for them. Non-fatal: a failure
  // resolves to undefined (the inline catch also prevents an unhandled rejection
  // while it's in flight) and the chat still streams.
  const projectsPromise = getProjectList().catch((err) => {
    console.warn("[web-component] getProjectList failed:", err);
    return undefined;
  });

  // Org profile — needed here only to get `current_organization` for the org-DB
  // fetch below. The real OrgFeatureProvider (mounted by ChatBoot) fetches its own
  // copy on mount; this is a cheap, intentional duplicate. Non-fatal.
  let userOrganizationProfile: UserOrganizationProfile | null = null;
  try {
    userOrganizationProfile = await getUserOrganization();
  } catch (err) {
    console.warn("[web-component] getUserOrganization failed:", err);
  }

  // Org DB list — plain fields only (orgdb_id / is_default / display_name), no
  // decryption (mirrors the shipped Stencil widget). Filtered to connected,
  // non-deleted DBs; default → first → none. Gated on the profile. Non-fatal.
  let organizationDbs: OrganizationDb[] = [];
  let defaultOrgDbId: string | null = null;
  if (userOrganizationProfile) {
    try {
      const dbs = await getOrganizationDbs(
        userOrganizationProfile.current_organization,
      );
      organizationDbs = dbs.filter((d) => d.is_connected && !d.is_deleted);
      defaultOrgDbId =
        organizationDbs.find((d) => d.is_default)?.orgdb_id ??
        organizationDbs[0]?.orgdb_id ??
        null;
    } catch (err) {
      console.warn("[web-component] getOrganizationDbs failed:", err);
    }
  }

  // Resolve the project list that's been loading in parallel since the top.
  const projectsResp = (await projectsPromise) as
    | { project_detail?: ProjectLike[] }
    | undefined;
  const projects: ProjectLike[] = projectsResp?.project_detail ?? [];

  // The widget mounts the agentic chat, so only an *agentic* project is a valid
  // starting point — never fall back to a non-agentic (SQL) project. If none
  // exists, create one below.
  const existing = projects.find((p) => p.is_agentic);
  const existingId = idOf(existing);

  if (existingId)
    return { projectId: existingId, organizationDbs, defaultOrgDbId };

  // No agentic project yet — create one against the org default DB
  // (defaultOrgDbId) so data questions work. Name it a recognized default
  // ("New Project 1") so it's auto-name-eligible (isDefaultProjectName gate in
  // chatSession/lifecycle.ts:180 → infer_name after the first answer).
  //
  // addNewProject returns the full axios response (unlike getProjectList, which
  // returns response.data), so the created project is at res.data.project_detail.
  const res = await addNewProject("New Project 1", defaultOrgDbId, true);
  const created = res?.data?.project_detail as ProjectLike | undefined;
  const createdId = idOf(created);

  if (!createdId) {
    throw new Error("Could not resolve or create an agentic project");
  }
  return { projectId: createdId, organizationDbs, defaultOrgDbId };
};
