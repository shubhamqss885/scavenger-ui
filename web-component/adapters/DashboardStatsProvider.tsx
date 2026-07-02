"use client";

// WEB-COMPONENT ADAPTER — permanent policy: usage limits / storage counters are an
// app-shell concern. The web component never blocks a send (enforceLimit → false) and
// counts nothing. Typed against the real context (type-only import) so drift is
// a compile error (`npm run web-component:typecheck`) — a missing member once shipped
// `enforceLimit is not a function`, silently no-oping submit (Defect 4).
//
// `enforceLimit` MUST return `false`; `incrementTokens`/`openLimitDialog`/
// `getDashboardStats` are invoked from streaming/limit callbacks and must exist.

type RealDashboardStatsModule =
  typeof import("@/lib/context/DashboardStatsProvider");
type DashboardStatsValue = ReturnType<
  RealDashboardStatsModule["useDashboardStats"]
>;
type DashboardStatsState = ReturnType<
  RealDashboardStatsModule["useDashboardStatsState"]
>;

const noop = () => {};

// Stable module-scope values — consumers put these in hook dep arrays; fixed
// identities prevent render loops (see useFileIndexingEvents.ts).
const DASHBOARD_STATS_VALUE: DashboardStatsValue = {
  getDashboardStats: async () => {},
  incrementMessage: noop,
  decrementMessage: noop,
  increaseStorageUsage: noop,
  decreaseStorageUsage: noop,
  incrementProject: noop,
  decrementProject: noop,
  incrementDataSource: noop,
  decrementDataSource: noop,
  incrementTokens: noop,
  decrementTokens: noop,
  enforceLimit: () => false,
  openLimitDialog: noop,
};

// Inert state — totalStorage is unlimited so storage checks never block and no
// is*LimitReached flag is ever true.
const DASHBOARD_STATS_STATE: DashboardStatsState = {
  dashboardStats: {
    storageUsage: 0,
    totalStorage: Number.MAX_SAFE_INTEGER,
    totalMessage: 0,
    messageLimit: 0,
    totalProjects: 0,
    projectLimit: 0,
    lastMonthChats: 0,
    lastHourProjects: 0,
    totalDataSources: 0,
    dataSourcesLimit: 0,
    tokensUsed: 0,
    tokenLimit: 0,
  },
  isLoading: false,
  error: null,
  isMessageLimitReached: false,
  isProjectLimitReached: false,
  isStorageLimitReached: false,
  isDataSourceLimitReached: false,
  isTokenLimitReached: false,
};

export const useDashboardStats: RealDashboardStatsModule["useDashboardStats"] =
  () => DASHBOARD_STATS_VALUE;

export const useDashboardStatsState: RealDashboardStatsModule["useDashboardStatsState"] =
  () => DASHBOARD_STATS_STATE;

export const DashboardStatsProvider: RealDashboardStatsModule["DashboardStatsProvider"] =
  ({ children }) => <>{children}</>;
