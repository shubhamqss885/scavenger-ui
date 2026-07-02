"use client";

// Post-auth boot component: reads the token from AxiosContext (provided by
// WebComponentAuthProvider), creates the axios singleton, registers the user,
// resolves the org profile + agentic project, then mounts the chat workspace
// (sidebar + chat) inside the real ProjectsProvider.
//
// bootChat runs exactly once — a ref guards against re-running on token rotation
// (refreshSession only rotates the JWT; no need to re-resolve the project).

import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AxiosContext } from "@/lib/context/AuthContext";
import {
  OrgFeatureProvider,
  useOrgFeatures,
} from "@/lib/context/OrgFeatureContext";
import { ProjectsProvider } from "@/lib/context/ProjectsContext";
import { EventsProvider } from "@/lib/context/EventsContext";
import { bootChat } from "./boot";
import { UserDataProvider } from "./adapters/UserDataContext";
import { setWidgetOrgDbs } from "./adapters/OrganizationDbProvider";
import { WidgetWorkspace } from "./components/WidgetWorkspace";
import { LoadingView, ErrorView } from "./views";

type BootView =
  | { kind: "loading" }
  | { kind: "ready"; projectId: string; defaultOrgDbId: string | null }
  | { kind: "error"; error: string };

export const ChatBoot = () => {
  const { token } = useContext(AxiosContext);
  const [view, setView] = useState<BootView>({ kind: "loading" });
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current || !token) return;
    booted.current = true;
    void bootChat(token)
      .then(({ projectId, organizationDbs, defaultOrgDbId }) => {
        // Seed the OrgDb adapter (header DB name + getDbById) before the chat
        // mounts. Org profile / details / role aren't seeded here — the real
        // OrgFeatureProvider + the UserDataContext adapter fetch those themselves.
        setWidgetOrgDbs(organizationDbs);
        setView({ kind: "ready", projectId, defaultOrgDbId });
      })
      .catch((err) =>
        setView({
          kind: "error",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  }, [token]);

  if (view.kind === "loading") {
    return <LoadingView msg="Loading your workspace…" />;
  }

  if (view.kind === "error") {
    return <ErrorView error={view.error} />;
  }

  // view.kind === "ready"
  // Provider tree mirrors the app: UserData (the one auth seam) → real
  // OrgFeatureProvider (computes flags from the real role) → ProjectsProvider
  // (gated on OrgFeature's userOrganizationProfile) → EventsProvider (single
  // notifications WS, above the project-keyed chat → live file indexing).
  // WorkspaceGate holds the spinner until flags resolve. DashboardStats / OrgDb
  // stay inert adapters (resolved without a mounted provider).
  return (
    <UserDataProvider>
      <OrgFeatureProvider>
        <WorkspaceGate>
          <ProjectsProvider>
            <EventsProvider>
              <WidgetWorkspace
                initialProjectId={view.projectId}
                defaultOrgDbId={view.defaultOrgDbId}
              />
            </EventsProvider>
          </ProjectsProvider>
        </WorkspaceGate>
      </OrgFeatureProvider>
    </UserDataProvider>
  );
};

// Holds the boot spinner until the real OrgFeatureProvider has resolved the role +
// computed flags, so flag-gated affordances don't flash in and the sidebar isn't
// briefly empty. Bounded fallback: render anyway after ~8s (mirrors the auth-probe
// cap) if a fetch stalls — the core chat isn't flag-gated, so it degrades cleanly.
const WorkspaceGate = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useOrgFeatures();
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setForceRender(true), 8000);
    return () => clearTimeout(id);
  }, []);

  if (isLoading && !forceRender) {
    return <LoadingView msg="Loading your workspace…" />;
  }
  return <>{children}</>;
};
