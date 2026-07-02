import { SCAV_ORG_ID } from "@/lib/constants";
import {
  UserOrganizationProfile,
  OrganizationDetails,
} from "@/lib/services/organizationService";
import { UserData } from "@/lib/services/userService";

export const FEATURE_FLAGS = {
  ORG_SWITCHER: "ORG_SWITCHER",
  VIEW_ORG_DASHBOARDS: "VIEW_ORG_DASHBOARDS",
  EDIT_ORG_DASHBOARDS: "EDIT_ORG_DASHBOARDS",
  SCHEDULE_ORG_DASHBOARDS: "SCHEDULE_ORG_DASHBOARDS",
  VIEW_CHATS: "VIEW_CHATS",
  DASHBOARD_BUILDER: "DASHBOARD_BUILDER",
  DATABASE_SELECTOR: "DATABASE_SELECTOR",
  DEEP_QUERY: "DEEP_QUERY",
  TEXT_TO_SQL_ONLY_MODE: "TEXT_TO_SQL_ONLY_MODE",
  VIEW_DATASOURCES: "VIEW_DATASOURCES",
  VIEW_FEEDBACK: "VIEW_FEEDBACK",
  VIEW_TABLE_FILTERS: "VIEW_TABLE_FILTERS",
  EDIT_DATASOURCES: "EDIT_DATASOURCES",
  ADD_DATASOURCE_BUTTON: "ADD_DATASOURCE_BUTTON",
  ADD_DATA_SOURCE_DATABASE_CONNECTION: "ADD_DATA_SOURCE_DATABASE_CONNECTION",
  DELETE_PROJECT_BUTTON: "DELETE_PROJECT_BUTTON",
  DEMO_MODE: "DEMO_MODE",
  SETTINGS_DROPDOWN: "SETTINGS_DROPDOWN",
  TOP_BAR: "TOP_BAR",
  STORY_TELLING: "STORY_TELLING",
  AUDIO_RECORDING: "AUDIO_RECORDING",
  PAYWALL_ENABLED: "PAYWALL_ENABLED",
  DB_CONNECT: "DB_CONNECT",
  RULE_SUGGESTIONS: "RULE_SUGGESTIONS",
  // Hidden for upcoming release
  DATA_MODEL_TAB: "DATA_MODEL_TAB",
  KNOWLEDGE_TAB: "KNOWLEDGE_TAB",
  DEBUG_INFO: "DEBUG_INFO",
  PERSONALITY_BUTTON: "PERSONALITY_BUTTON",
  INPUT_LANGUAGE_SELECTOR: "INPUT_LANGUAGE_SELECTOR",
  VIEW_VAULT_AUDIT: "VIEW_VAULT_AUDIT",
  MODEL_SWITCHER: "MODEL_SWITCHER",
  VIEW_GROUPS: "VIEW_GROUPS",
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

export type FeatureFlags = Record<FeatureFlagName, boolean>;

// Features should be enabled/disabled based on a combination of role, environment and organization settings,
// rather than checking these conditions directly in components.
export const determineFeatureFlags = (
  organizationDetails: OrganizationDetails | null,
  userOrganizationProfile: UserOrganizationProfile,
  userRole: UserData["user_role_name"],
): FeatureFlags => {
  // const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "dev";
  // const isTest = process.env.NEXT_PUBLIC_APP_ENV === "test";
  const isLocalDev = process.env.NEXT_PUBLIC_APP_ENV === "localhost";
  const isScavengerUser =
    userOrganizationProfile?.base_organization === SCAV_ORG_ID;

  const isOrgAdmin = userRole === "org-admin";
  const isSuperAdmin = userRole === "super-admin";
  const isDemoMode = userRole === "demo-user";
  const isPrivateUser = userRole === "private-user";
  const isOrgUser = userRole === "org-user";
  const isOrgViewer = userRole === "org-viewer";

  // org-viewer users may not have access to org details, use safe access
  const orgFeatures = organizationDetails?.features;

  const flags: FeatureFlags = {
    ORG_SWITCHER: isScavengerUser,
    VIEW_ORG_DASHBOARDS: !isDemoMode,
    EDIT_ORG_DASHBOARDS: !(isOrgViewer || isDemoMode),
    // Scheduling auto-refresh is admin-only — org-user can still manually refresh.
    SCHEDULE_ORG_DASHBOARDS: isOrgAdmin || isSuperAdmin,
    VIEW_CHATS: !isOrgViewer,
    // SCAV-org-dashboards: builder route is WIP — only enabled on dev/localhost.
    DASHBOARD_BUILDER: isDev || isLocalDev,
    DATABASE_SELECTOR: orgFeatures?.TEXT2SQL ?? false,
    VIEW_DATASOURCES:
      (isOrgAdmin || isSuperAdmin || isPrivateUser || isDemoMode) &&
      (orgFeatures?.TEXT2SQL ?? false),
    // VIEW_FEEDBACK is forced false: the table view works, but the row
    // detail side-sheet (FeedbackDetailPanel + ConversationHistoryPanel +
    // ConversationMessage) is stubbed pending a rewrite against agentic
    // chat primitives — flipping this on ships a partially-broken UI.
    VIEW_FEEDBACK: false,
    VIEW_TABLE_FILTERS: !(isDemoMode || isPrivateUser),
    ADD_DATASOURCE_BUTTON:
      (isOrgAdmin || isSuperAdmin || isPrivateUser) &&
      (orgFeatures?.TEXT2SQL ?? false),
    EDIT_DATASOURCES:
      (isOrgAdmin || isSuperAdmin || isPrivateUser) &&
      (orgFeatures?.TEXT2SQL ?? false),
    ADD_DATA_SOURCE_DATABASE_CONNECTION:
      (isOrgAdmin || isSuperAdmin) && (orgFeatures?.TEXT2SQL ?? false),
    DELETE_PROJECT_BUTTON: !isDemoMode,
    SETTINGS_DROPDOWN: !isDemoMode,
    DEEP_QUERY: false,
    TOP_BAR: isDemoMode,
    STORY_TELLING: isDemoMode,
    AUDIO_RECORDING: isDev || isLocalDev,
    PAYWALL_ENABLED: false, // SCAV-4127: free tier, no payment surfaces
    DB_CONNECT:
      (isOrgAdmin || isSuperAdmin || isPrivateUser) &&
      (orgFeatures?.TEXT2SQL ?? false),
    // SCAV-4251: feature is unfinished — force off everywhere until we revisit.
    // TODO: remove RULE_SUGGESTIONS flag and the RuleSuggestions/* code paths
    // (RuleSuggestionsPopover, SuggestionCard, types.ts, and the addButtonSlot
    // branch in DatabaseRulesContent) once the feature is dropped or rebuilt.
    RULE_SUGGESTIONS: false,
    // Hidden for upcoming release
    DATA_MODEL_TAB: false,
    KNOWLEDGE_TAB: false,
    DEBUG_INFO: false,
    PERSONALITY_BUTTON: false,
    INPUT_LANGUAGE_SELECTOR: false,
    VIEW_VAULT_AUDIT: !isPrivateUser,
    // SCAV: model switcher (Claude / Ollama Qwen / Ollama Gemma) — disabled (single backend now).
    MODEL_SWITCHER: false,
    // Group chat — available to org users with TEXT2SQL feature
    VIEW_GROUPS:
      (isOrgAdmin || isSuperAdmin || isPrivateUser || isOrgUser) &&
      (orgFeatures?.TEXT2SQL ?? false),
    // DO NOT USE the feature flags below, use the ones above instead as much as possible
    TEXT_TO_SQL_ONLY_MODE: orgFeatures?.TEXT2SQLONLYMODE ?? false,
    DEMO_MODE: isDemoMode,
  };
  return flags;
};
