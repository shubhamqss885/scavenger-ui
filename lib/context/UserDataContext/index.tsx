"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  getUserData,
  registerUser,
  updateAccountSettings,
  uploadProfileImage,
  UserData,
} from "@/lib/services/userService";
import {
  createStripeCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  type CreateCheckoutSessionRequest,
  type CreateCheckoutSessionResponse,
} from "@/lib/services/paymentService";
import { AxiosContext } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { setI18nLanguage, useTranslation } from "@/lib/i18n/client";

// Billing URL constants - use environment-based URL
const BILLING_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://dev-app.scavenger-ai.com";

// Paywall is off — subscription fetch is stubbed to return null so
// the merge block in refreshUserProfile gracefully falls back to profileData.subscription.
// To re-enable, replace the body with: return getSubscriptionStatus().catch(() => null);
const fetchSubscriptionStatus = async (): Promise<Awaited<
  ReturnType<typeof getSubscriptionStatus>
> | null> => {
  // return getSubscriptionStatus().catch(() => null);
  return null;
};

type UserDataProviderProps = {
  children: React.ReactNode;
};

type UserDataContextValue = {
  userProfile: UserData | null;
  auth0User: any;
  isLoading: boolean;
  isUpdatingLocale: boolean;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  updateUserPicture: (file: File) => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  refreshUserProfile: () => Promise<void>;
  // Billing methods
  createCheckoutSession: (
    request: Omit<CreateCheckoutSessionRequest, "success_url" | "cancel_url">,
    options?: {
      success_url?: string;
      cancel_url?: string;
    },
  ) => Promise<CreateCheckoutSessionResponse | null>;
  fetchStripeSubscriptionStatus: () => Promise<void>;
  cancelUserSubscription: (subscriptionId: string) => Promise<void>;
};

const UserDataContext = createContext<UserDataContextValue>({
  userProfile: null,
  auth0User: null,
  isLoading: true,
  isUpdatingLocale: false,
  updateUserProfile: async () => {},
  updateUserPicture: async () => {},
  setIsLoading: () => {},
  refreshUserProfile: async () => {},
  // Billing methods defaults
  createCheckoutSession: async () => null,
  fetchStripeSubscriptionStatus: async () => {},
  cancelUserSubscription: async () => {},
});

export const useUserContext = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: UserDataProviderProps) => {
  const { t: tSettings } = useTranslation("settings");
  const { t: tPricing } = useTranslation("pricing");
  const { user } = useUser();
  const { authStatus, isLoading: authLoading } = useContext(AxiosContext);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocale, setIsUpdatingLocale] = useState(false);
  const hasInitialSynced = useRef(false);

  useEffect(() => {
    if (!hasInitialSynced.current && userProfile) {
      hasInitialSynced.current = true;

      // Check for pending locale from verify page
      const pendingLocale = localStorage.getItem("pendingLocale");

      if (pendingLocale) {
        // User set language on verify page - apply and save it
        localStorage.removeItem("pendingLocale");
        if (pendingLocale !== userProfile.locale) {
          updateAccountSettings({ locale: pendingLocale });
        }
        setI18nLanguage(pendingLocale);
      } else if (userProfile.locale) {
        // Normal flow - profile is source of truth
        setI18nLanguage(userProfile.locale);
      }
    }
  }, [userProfile]);

  // Refresh user profile - fetches fresh data from backend
  // Fetch the profile; if the user isn't provisioned yet (first-ever login),
  // getUserData fails — register once, then retry. Registration used to run on
  // every boot in AuthContext; it's lazy now, so returning users skip the ~1.7s
  // register round-trip entirely and only first-time users pay it.
  const fetchUserDataWithRegisterFallback = async () => {
    try {
      return await getUserData();
    } catch {
      await registerUser();
      return await getUserData();
    }
  };

  const refreshUserProfile = async () => {
    try {
      // Fetch both user data and subscription status in parallel
      const [userData, subscriptionResponse] = await Promise.all([
        fetchUserDataWithRegisterFallback(),
        fetchSubscriptionStatus(),
      ]);

      const profileData = userData.data.profile_detail;

      // Check if user is blocked and logout if needed
      if (profileData?.is_blocked) {
        console.info("User is blocked, redirecting to error page...");
        globalThis.location.href =
          "/error?error=unauthorized&error_description=blocked";
        return;
      }

      // Merge subscription data with profile in a single state update
      const completeProfileData: UserData = {
        ...profileData,
        subscription: subscriptionResponse?.data?.data
          ? {
              status: subscriptionResponse.data.data.subscription.status,
              subscription_id:
                subscriptionResponse.data.data.subscription.subscription_id,
              is_active: subscriptionResponse.data.data.subscription.is_active,
              plan_name: subscriptionResponse.data.data.plan.plan_name,
              next_billing_date:
                subscriptionResponse.data.data.billing.next_billing_date,
              cancelled_at: subscriptionResponse.data.data.billing.cancelled_at,
              subscribed_at:
                subscriptionResponse.data.data.billing.subscribed_at,
            }
          : profileData.subscription, // Fallback to existing subscription data if fetch fails
      };

      // Single state update - only one re-render
      setUserProfile(completeProfileData);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "ready") {
      refreshUserProfile();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authStatus]);

  const updateUserProfile = async (data: Partial<UserData>) => {
    try {
      // Set loading state if updating locale
      if (data.locale !== undefined) {
        setIsUpdatingLocale(true);
      }

      const response = await updateAccountSettings(data);

      if (response.data.status_code === 200) {
        // Preserve subscription data when updating profile
        setUserProfile((prevProfile) => {
          if (!prevProfile) return response.data.profile_detail;
          return {
            ...response.data.profile_detail,
            subscription: prevProfile.subscription, // Keep existing subscription data
          };
        });

        toast.success(
          String(
            tSettings(
              `serverMessages.${response.data.message}`,
              response.data.message,
            ),
          ),
        );
      } else {
        throw new Error(
          response.data.message ?? tSettings("profile.updateFailed"),
        );
      }
    } catch (error) {
      console.error("Failed to update user profile:", error);
      toast.error(tSettings("profile.updateSettingsFailed"));
    } finally {
      // Always clear loading state
      if (data.locale !== undefined) {
        setIsUpdatingLocale(false);
      }
    }
  };

  const updateUserPicture = async (file: File) => {
    try {
      const response = await uploadProfileImage(file);
      const imageUrl = response.download_url;
      setUserProfile((prevDetails) => {
        if (!prevDetails) return null;

        return {
          ...prevDetails,
          profile_image_url: imageUrl,
        };
      });
      toast.success(tSettings("profile.imageUpdateSuccess"));
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      toast.error(tSettings("profile.imageUpdateFailed"));
    }
  };

  // Billing methods
  const createCheckoutSession = async (
    request: Omit<CreateCheckoutSessionRequest, "success_url" | "cancel_url">,
    options?: {
      success_url?: string;
      cancel_url?: string;
    },
  ): Promise<CreateCheckoutSessionResponse | null> => {
    const checkoutData = {
      ...request,
      // TODO(billing): /add-datasource was removed (superseded by /connectors). When billing is
      // re-enabled, wire this success_url back to the appropriate billing settings route.
      // Original: `${BILLING_BASE_URL}/payment-processing?redirect=${encodeURIComponent("/add-datasource?modal=settings&tab=billing")}&success=true`
      success_url:
        options?.success_url ??
        `${BILLING_BASE_URL}/payment-processing?redirect=${encodeURIComponent("/home")}&success=true`,
      cancel_url:
        options?.cancel_url ?? `${BILLING_BASE_URL}/pricing?canceled=true`,
    };

    try {
      const response = await createStripeCheckoutSession(checkoutData);

      if (response.data) {
        return response.data;
      }
      throw new Error("Failed to create checkout session");
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      toast.error(tPricing("billing.checkoutFailed"));
      return null;
    }
  };

  const fetchStripeSubscriptionStatus = async () => {
    try {
      const response = await getSubscriptionStatus();

      if (response.data?.data) {
        const subscriptionData = response.data.data;
        setUserProfile((prevProfile) => {
          if (!prevProfile) return null;
          return {
            ...prevProfile,
            subscription: {
              status: subscriptionData.subscription.status,
              subscription_id: subscriptionData.subscription.subscription_id,
              is_active: subscriptionData.subscription.is_active,
              plan_name: subscriptionData.plan.plan_name,
              next_billing_date: subscriptionData.billing.next_billing_date,
              cancelled_at: subscriptionData.billing.cancelled_at,
              subscribed_at: subscriptionData.billing.subscribed_at,
            },
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      // Don't show toast for subscription status errors since this might be called frequently
    }
  };

  const cancelUserSubscription = async (subscriptionId: string) => {
    try {
      const response = await cancelSubscription({
        subscription_id: subscriptionId,
      });

      if (response.data) {
        // Update user profile to remove subscription
        setUserProfile((prevProfile) => {
          if (!prevProfile?.subscription) return prevProfile;
          return {
            ...prevProfile,
            subscription: {
              ...prevProfile.subscription,
              cancelled_at: response.data.data.cancellation.effective_date,
              next_billing_date: null,
            },
          };
        });

        toast.success(tPricing("billing.subscriptionCanceled"));
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error(tPricing("billing.cancelFailed"));
    }
  };

  const contextValue = useMemo(
    () => ({
      userProfile,
      auth0User: user,
      isLoading,
      isUpdatingLocale,
      updateUserProfile,
      updateUserPicture,
      setIsLoading,
      refreshUserProfile,
      // Billing methods
      createCheckoutSession,
      fetchStripeSubscriptionStatus,
      cancelUserSubscription,
    }),
    [userProfile, user, isLoading, isUpdatingLocale],
  );

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
};
