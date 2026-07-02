"use client";

// WEB-COMPONENT ADAPTER — permanent policy (chat-only widget): no org dashboards.
// The chat's chart/SQL results render a "Pin to dashboard" control
// (components/blocks/PinToDashboardModal → useOrgDashboardsContext), and the real
// hook THROWS without its provider. This inert value keeps that affordance
// rendering harmlessly (empty dashboard list, no-op pin). Typed against the real
// module (type-only import) so drift is a compile error.

import { createContext } from "use-context-selector";

type RealModule = typeof import("@/lib/context/OrgDashboardContext");
type OrgDashboardsValue = ReturnType<RealModule["useOrgDashboardsContext"]>;

// Stable module-scope value — consumers may read pieces in hook deps.
const ORG_DASHBOARDS_VALUE: OrgDashboardsValue = {
  orgDashboards: [],
  isLoading: false,
  fetchOrgDashboards: async () => {},
  addOrgDashboard: async () => null,
  renameOrgDashboard: async () => {},
  deleteOrgDashboard: async () => {},
  pinToDashboard: async () => false,
  decrementWidgetCount: () => {},
};

// Default the context to the inert value (not undefined) so useContextSelector
// consumers resolve without a provider mounted.
export const OrgDashboardsContext = createContext<OrgDashboardsValue>(
  ORG_DASHBOARDS_VALUE,
) as RealModule["OrgDashboardsContext"];

export const useOrgDashboardsContext: RealModule["useOrgDashboardsContext"] =
  () => ORG_DASHBOARDS_VALUE;

export const OrgDashboardsProvider: RealModule["OrgDashboardsProvider"] = ({
  children,
}) => <>{children}</>;
