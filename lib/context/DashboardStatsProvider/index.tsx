"use client";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { getDashboardStatsData } from "@/lib/services/dashboardService";
import { useUserContext } from "../UserDataContext";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import {
  dashboardStatsReducer,
  initialDashboardStats,
  State,
  Action,
} from "./reducer";
import {
  SET_DASHBOARD_STATS,
  FETCH_DASHBOARD_STATS_REQUEST,
  FETCH_DASHBOARD_STATS_FAILURE,
  INCREMENT_DATASOURCE,
  DECREMENT_DATASOURCE,
  INCREMENT_TOKENS,
  DECREMENT_TOKENS,
} from "./actionTypes";
import type { LimitType } from "./limitTypes";
import { LimitAlertDialog } from "./LimitAlertDialog";

interface IDashboardStatsContext {
  getDashboardStats: () => Promise<void>;
  incrementMessage: () => void;
  decrementMessage: () => void;
  increaseStorageUsage: (usage: number) => void;
  decreaseStorageUsage: (usage: number) => void;
  incrementProject: () => void;
  decrementProject: () => void;
  incrementDataSource: () => void;
  decrementDataSource: () => void;
  incrementTokens: (delta: number) => void;
  decrementTokens: (delta: number) => void;
  enforceLimit: (type: LimitType) => boolean;
  openLimitDialog: (type: LimitType) => void;
}

const DashboardStatsContext = createContext<IDashboardStatsContext | undefined>(
  undefined,
);

const DashboardStatsStateContext = createContext<State | undefined>(undefined);
const DashboardStatsDispatchContext = createContext<
  React.Dispatch<Action> | undefined
>(undefined);

const LIMIT_BOOL_KEY: Record<LimitType, keyof State> = {
  message: "isMessageLimitReached",
  token: "isTokenLimitReached",
  project: "isProjectLimitReached",
  datasource: "isDataSourceLimitReached",
  storage: "isStorageLimitReached",
};

export const DashboardStatsProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { t } = useTranslation("dashboard");
  const [state, dispatch] = useReducer(
    dashboardStatsReducer,
    initialDashboardStats,
  );
  const { userProfile } = useUserContext();
  const [openLimitType, setOpenLimitType] = useState<LimitType | null>(null);

  // Latest state read from inside stable callbacks (enforceLimit) without
  // re-creating them on every state change — keeps the actions context stable.
  const stateRef = useRef(state);
  stateRef.current = state;

  const getDashboardStats = useCallback(async () => {
    try {
      dispatch({ type: FETCH_DASHBOARD_STATS_REQUEST });
      const response = await getDashboardStatsData();
      dispatch({
        type: SET_DASHBOARD_STATS,
        payload: {
          storageUsage: response.Aggregate_file_size_uploaded,
          totalStorage: response.total_available_storage,
          totalMessage: response.total_messages,
          messageLimit: response.message_limit,
          totalProjects: response.total_projects,
          projectLimit: response.project_creation_limit,
          lastMonthChats: response.last_month_chats,
          lastHourProjects: response.last_hour_projects,
          totalDataSources: response.total_data_sources,
          dataSourcesLimit: response.datasources_limits,
          tokensUsed: response.tokens_used ?? 0,
          tokenLimit: response.token_limit ?? 0,
        },
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      if (error instanceof Error) {
        dispatch({
          type: FETCH_DASHBOARD_STATS_FAILURE,
          payload: error.message,
        });
      }
      toast.error(t("orgDashboard.context.error.fetchStatsFailed"));
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      getDashboardStats();
    }
  }, [userProfile, getDashboardStats]);

  const incrementMessage = useCallback(
    () => dispatch({ type: "INCREMENT_MESSAGE" }),
    [],
  );
  const decrementMessage = useCallback(
    () => dispatch({ type: "DECREMENT_MESSAGE" }),
    [],
  );
  const increaseStorageUsage = useCallback((usage: number) => {
    dispatch({ type: "INCREASE_STORAGE_USAGE", payload: usage });
  }, []);

  const decreaseStorageUsage = useCallback((usage: number) => {
    dispatch({ type: "DECREASE_STORAGE_USAGE", payload: usage });
  }, []);
  const incrementProject = useCallback(
    () => dispatch({ type: "INCREMENT_PROJECT" }),
    [],
  );
  const decrementProject = useCallback(
    () => dispatch({ type: "DECREMENT_PROJECT" }),
    [],
  );
  const incrementDataSource = useCallback(
    () => dispatch({ type: INCREMENT_DATASOURCE }),
    [],
  );
  const decrementDataSource = useCallback(
    () => dispatch({ type: DECREMENT_DATASOURCE }),
    [],
  );
  const incrementTokens = useCallback((delta: number) => {
    if (!Number.isFinite(delta) || delta <= 0) return;
    dispatch({ type: INCREMENT_TOKENS, payload: delta });
  }, []);
  const decrementTokens = useCallback((delta: number) => {
    if (!Number.isFinite(delta) || delta <= 0) return;
    dispatch({ type: DECREMENT_TOKENS, payload: delta });
  }, []);

  // Opens the shared limit dialog when the relevant is*LimitReached boolean
  // is true, and returns true so callers can early-return (bail).
  const enforceLimit = useCallback((type: LimitType): boolean => {
    const reached = stateRef.current[LIMIT_BOOL_KEY[type]] as boolean;

    if (reached) {
      setOpenLimitType(type);
      return true;
    }
    return false;
  }, []);

  const closeLimitDialog = useCallback(() => setOpenLimitType(null), []);

  const openLimitDialog = useCallback(
    (type: LimitType) => setOpenLimitType(type),
    [],
  );

  const contextValue = useMemo(
    () => ({
      getDashboardStats,
      incrementMessage,
      decrementMessage,
      increaseStorageUsage,
      decreaseStorageUsage,
      incrementProject,
      decrementProject,
      incrementDataSource,
      decrementDataSource,
      incrementTokens,
      decrementTokens,
      enforceLimit,
      openLimitDialog,
    }),
    [
      getDashboardStats,
      incrementMessage,
      decrementMessage,
      increaseStorageUsage,
      decreaseStorageUsage,
      incrementProject,
      decrementProject,
      incrementDataSource,
      decrementDataSource,
      incrementTokens,
      decrementTokens,
      enforceLimit,
      openLimitDialog,
    ],
  );

  return (
    <DashboardStatsStateContext.Provider value={state}>
      <DashboardStatsDispatchContext.Provider value={dispatch}>
        <DashboardStatsContext.Provider value={contextValue}>
          {children}
          <LimitAlertDialog
            openType={openLimitType}
            onClose={closeLimitDialog}
          />
        </DashboardStatsContext.Provider>
      </DashboardStatsDispatchContext.Provider>
    </DashboardStatsStateContext.Provider>
  );
};

export const useDashboardStatsState = (): State => {
  const context = useContext(DashboardStatsStateContext);

  if (context === undefined) {
    throw new Error(
      "useDashboardStatsState must be used within a DashboardStatsProvider",
    );
  }
  return context;
};

export const useDashboardStats = (): IDashboardStatsContext => {
  const context = useContext(DashboardStatsContext);

  if (!context) {
    throw new Error(
      "useDashboardStats must be used within a DashboardStatsProvider",
    );
  }

  return context;
};
