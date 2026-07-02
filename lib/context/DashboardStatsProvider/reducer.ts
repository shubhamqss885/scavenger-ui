import {
  SET_DASHBOARD_STATS,
  INCREMENT_MESSAGE,
  DECREMENT_MESSAGE,
  INCREASE_STORAGE_USAGE,
  DECREASE_STORAGE_USAGE,
  INCREMENT_PROJECT,
  DECREMENT_PROJECT,
  INCREMENT_DATASOURCE,
  DECREMENT_DATASOURCE,
  INCREMENT_TOKENS,
  DECREMENT_TOKENS,
  FETCH_DASHBOARD_STATS_REQUEST,
  FETCH_DASHBOARD_STATS_FAILURE,
} from "./actionTypes";

export type DashboardStats = {
  storageUsage: number;
  totalStorage: number;
  totalMessage: number;
  messageLimit: number;
  totalProjects: number;
  projectLimit: number;
  lastMonthChats: number;
  lastHourProjects: number;
  totalDataSources: number;
  dataSourcesLimit: number;
  tokensUsed: number;
  tokenLimit: number;
};

export type Action =
  | { type: typeof SET_DASHBOARD_STATS; payload: DashboardStats }
  | { type: typeof INCREMENT_MESSAGE }
  | { type: typeof DECREMENT_MESSAGE }
  | { type: typeof INCREASE_STORAGE_USAGE; payload: number }
  | { type: typeof DECREASE_STORAGE_USAGE; payload: number }
  | { type: typeof INCREMENT_PROJECT }
  | { type: typeof DECREMENT_PROJECT }
  | { type: typeof INCREMENT_DATASOURCE }
  | { type: typeof DECREMENT_DATASOURCE }
  | { type: typeof INCREMENT_TOKENS; payload: number }
  | { type: typeof DECREMENT_TOKENS; payload: number }
  | { type: typeof FETCH_DASHBOARD_STATS_REQUEST }
  | { type: typeof FETCH_DASHBOARD_STATS_FAILURE; payload: string };

export interface State {
  dashboardStats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  isMessageLimitReached: boolean;
  isProjectLimitReached: boolean;
  isStorageLimitReached: boolean;
  isDataSourceLimitReached: boolean;
  isTokenLimitReached: boolean;
}

export const initialDashboardStats: State = {
  dashboardStats: {
    storageUsage: 0,
    totalStorage: 0,
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

const hasReachedTokenLimit = (tokensUsed: number, tokenLimit: number) =>
  tokenLimit > 0 && tokensUsed >= tokenLimit;

export const dashboardStatsReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case FETCH_DASHBOARD_STATS_REQUEST:
      return { ...state, isLoading: true, error: null };
    case SET_DASHBOARD_STATS:
      const isMessageLimitReached =
        action.payload.totalMessage >= action.payload.messageLimit;
      const isProjectLimitReached =
        action.payload.totalProjects >= action.payload.projectLimit;
      const isStorageLimitReached =
        action.payload.storageUsage >= action.payload.totalStorage;
      const isDataSourceLimitReached =
        action.payload.totalDataSources >= action.payload.dataSourcesLimit;
      const isTokenLimitReached = hasReachedTokenLimit(
        action.payload.tokensUsed,
        action.payload.tokenLimit,
      );
      return {
        ...state,
        dashboardStats: action.payload,
        isLoading: false,
        isMessageLimitReached,
        isProjectLimitReached,
        isStorageLimitReached,
        isDataSourceLimitReached,
        isTokenLimitReached,
      };
    case INCREMENT_MESSAGE:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalMessage: state.dashboardStats.totalMessage + 1,
        },
        isMessageLimitReached:
          state.dashboardStats.totalMessage + 1 >=
          state.dashboardStats.messageLimit,
      };

    //Note: This is not used anywhere yet. Will be used if/when we implement the delete message feature.
    case DECREMENT_MESSAGE:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalMessage: state.dashboardStats.totalMessage - 1,
        },
        isMessageLimitReached:
          state.dashboardStats.totalMessage - 1 >=
          state.dashboardStats.messageLimit,
      };
    case INCREASE_STORAGE_USAGE:
      const newStorageUsage =
        state.dashboardStats.storageUsage + action.payload;
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          storageUsage: newStorageUsage,
        },
        isStorageLimitReached:
          newStorageUsage >= state.dashboardStats.totalStorage,
      };

    case DECREASE_STORAGE_USAGE:
      const decreasedStorage =
        state.dashboardStats.storageUsage - action.payload;
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          storageUsage: decreasedStorage,
        },
        isStorageLimitReached:
          decreasedStorage >= state.dashboardStats.totalStorage,
      };
    case INCREMENT_PROJECT:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalProjects: state.dashboardStats.totalProjects + 1,
        },
        isProjectLimitReached:
          state.dashboardStats.totalProjects + 1 >=
          state.dashboardStats.projectLimit,
      };
    case DECREMENT_PROJECT:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalProjects: Math.max(0, state.dashboardStats.totalProjects - 1),
        },
        isProjectLimitReached:
          state.dashboardStats.totalProjects - 1 >=
          state.dashboardStats.projectLimit,
      };
    case INCREMENT_DATASOURCE:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalDataSources: state.dashboardStats.totalDataSources + 1,
        },
        isDataSourceLimitReached:
          state.dashboardStats.totalDataSources + 1 >=
          state.dashboardStats.dataSourcesLimit,
      };
    case DECREMENT_DATASOURCE:
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          totalDataSources: Math.max(
            0,
            state.dashboardStats.totalDataSources - 1,
          ),
        },
        isDataSourceLimitReached:
          state.dashboardStats.totalDataSources - 1 >=
          state.dashboardStats.dataSourcesLimit,
      };
    case INCREMENT_TOKENS: {
      const nextTokensUsed = state.dashboardStats.tokensUsed + action.payload;
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          tokensUsed: nextTokensUsed,
        },
        isTokenLimitReached: hasReachedTokenLimit(
          nextTokensUsed,
          state.dashboardStats.tokenLimit,
        ),
      };
    }
    case DECREMENT_TOKENS: {
      const nextTokensUsed = Math.max(
        0,
        state.dashboardStats.tokensUsed - action.payload,
      );
      return {
        ...state,
        dashboardStats: {
          ...state.dashboardStats,
          tokensUsed: nextTokensUsed,
        },
        isTokenLimitReached: hasReachedTokenLimit(
          nextTokensUsed,
          state.dashboardStats.tokenLimit,
        ),
      };
    }
    case FETCH_DASHBOARD_STATS_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};
