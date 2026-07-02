"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  OrganizationDetails,
  UserOrganizationProfile,
  PaginatedOrganizationsResponse,
  getOrganizationDetails,
  getAllOrganizations,
  switchUserOrganization,
  getUserOrganization,
} from "@/lib/services/organizationService";
import {
  FeatureFlagName,
  FeatureFlags,
  determineFeatureFlags,
  FEATURE_FLAGS,
} from "@/lib/context/OrgFeatureContext/featureFlags";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useTranslation } from "@/lib/i18n/client";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";
import { getHomeRoute } from "@/lib/utils/homeRoute";

interface OrgFeatureContextType {
  organizationDetails: OrganizationDetails | null;
  userOrganizationProfile: UserOrganizationProfile | null;
  isFeatureEnabled: (featureName: FeatureFlagName) => boolean;
  FEATURE_FLAGS: typeof FEATURE_FLAGS;
  homeRoute: string;
  switchOrganization: (orgId: string) => Promise<void>;
  refetchOrganization: () => Promise<void>;
  fetchAllOrganizationsPage: (
    page: number,
    page_size: number,
    search?: string,
    is_private?: boolean,
  ) => Promise<PaginatedOrganizationsResponse>;
  isLoading: boolean;
  error: string | null;
}

const OrgFeatureContext = createContext<OrgFeatureContextType | undefined>(
  undefined,
);

export const OrgFeatureProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { t } = useTranslation("common");
  const [organizationDetails, setOrganizationDetails] =
    useState<OrganizationDetails | null>(null);
  const [userOrganizationProfile, setUserOrganizationProfile] =
    useState<UserOrganizationProfile | null>(null);
  const { userProfile } = useUserContext();
  const { getDashboardStats } = useDashboardStats();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(
    {} as FeatureFlags,
  );

  // Internal loading states
  const [isOrgDataLoading, setIsOrgDataLoading] = useState(true);
  const [areFeaturesReady, setAreFeaturesReady] = useState(false);

  // Derived loading state - only false when BOTH org data loaded AND features ready
  const isLoading = isOrgDataLoading || !areFeaturesReady;

  const [error, setError] = useState<string | null>(null);

  const loadOrganizationData = useCallback(
    async (userOrgProfile: UserOrganizationProfile): Promise<void> => {
      const currentOrgId = userOrgProfile.current_organization;

      try {
        const orgDetails = await getOrganizationDetails(currentOrgId);
        setOrganizationDetails(orgDetails);
      } catch (error) {
        console.error("Error fetching organization details:", error);
        setOrganizationDetails(null);
      }
    },
    [],
  );

  const fetchUserAndOrganizationDetails = useCallback(async () => {
    setIsOrgDataLoading(true);
    setError(null);
    try {
      const userOrgProfile = await getUserOrganization();
      setUserOrganizationProfile(userOrgProfile);
      await loadOrganizationData(userOrgProfile);
    } catch (err) {
      setError(t("errors.fetchOrgDetails"));
      console.error("Error fetching organization details:", err);
    } finally {
      setIsOrgDataLoading(false);
    }
  }, [loadOrganizationData]);

  const switchOrganization = useCallback(
    async (orgId: string) => {
      setIsOrgDataLoading(true);
      setAreFeaturesReady(false); // Reset features when switching orgs
      setError(null);
      try {
        const userOrgProfile = await switchUserOrganization(orgId);
        setUserOrganizationProfile(userOrgProfile);

        await loadOrganizationData(userOrgProfile);

        // Refresh dashboard stats for the new organization
        await getDashboardStats();
      } catch (err) {
        setError(t("errors.switchOrg"));
        console.error("Error switching organization:", err);
      } finally {
        setIsOrgDataLoading(false);
      }
    },
    [loadOrganizationData, getDashboardStats],
  );

  useEffect(() => {
    fetchUserAndOrganizationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !isOrgDataLoading &&
      userOrganizationProfile &&
      userProfile?.user_role_name
    ) {
      const computedFlags = determineFeatureFlags(
        organizationDetails,
        userOrganizationProfile,
        userProfile.user_role_name,
      );

      setFeatureFlags(computedFlags);
      setAreFeaturesReady(true);
    }
  }, [
    isOrgDataLoading,
    organizationDetails,
    userOrganizationProfile,
    userProfile,
  ]);

  const fetchAllOrganizationsPage = useCallback(
    async (
      page: number = 1,
      page_size: number = 10,
      search?: string,
      is_private: boolean = false,
    ): Promise<PaginatedOrganizationsResponse> => {
      return await getAllOrganizations(page, page_size, search, is_private);
    },
    [],
  );

  const isFeatureEnabled = useCallback(
    (featureName: FeatureFlagName): boolean => {
      return featureFlags[featureName] || false;
    },
    [featureFlags],
  );

  const homeRoute = getHomeRoute(userProfile?.user_role_name);

  const contextValue = useMemo(
    () => ({
      organizationDetails,
      userOrganizationProfile,
      isFeatureEnabled,
      FEATURE_FLAGS,
      homeRoute,
      switchOrganization,
      refetchOrganization: fetchUserAndOrganizationDetails,
      fetchAllOrganizationsPage,
      isLoading,
      error,
    }),
    [
      organizationDetails,
      userOrganizationProfile,
      isFeatureEnabled,
      homeRoute,
      switchOrganization,
      fetchUserAndOrganizationDetails,
      fetchAllOrganizationsPage,
      isLoading,
      error,
    ],
  );

  return (
    <OrgFeatureContext.Provider value={contextValue}>
      {children}
    </OrgFeatureContext.Provider>
  );
};

export const useOrgFeatures = () => {
  const context = useContext(OrgFeatureContext);

  if (context === undefined) {
    throw new Error("useOrgFeatures must be used within an OrgFeatureProvider");
  }
  return context;
};
