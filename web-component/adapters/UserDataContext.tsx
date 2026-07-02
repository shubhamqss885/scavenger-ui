"use client";

// WEB-COMPONENT ADAPTER — permanent policy: the symmetric UserDataContext.
//
// This is the ONE auth seam between the app and the web component. The real
// `lib/context/UserDataContext` sources `auth0User` from @auth0/nextjs-auth0's
// `useUser()` (Next-only, would drag that SDK into the bundle); here we re-implement
// the SAME context value using auth0-spa-js (`getUser`) + the app's own axios
// services. With this in place the REAL `OrgFeatureProvider` (and anything else that
// only needs `useUserContext`) can be mounted unchanged — no per-context adapter.
//
// REAL: `userProfile` (getUserData → backend), `updateUserProfile`/`updateUserPicture`
// (backend PUT), locale sync. INERT: billing methods (paywall off — SCAV-4127), so
// the widget never bundles the Stripe-checkout code paths.
//
// Differs from the real provider in two safe ways: (1) no `is_blocked` host-page
// redirect (the widget is embedded — hijacking the customer's page to /error is
// wrong; blocked users are rejected by the backend anyway); (2) no `pendingLocale`
// verify-page handoff (no verify flow in an embed).
//
// Typed against the real module (type-only `typeof import`) so any drift from the
// real context shape is a compile error (`npm run web-component:typecheck`). The real
// module exports neither its context object nor value type, so the value type is
// lifted from `useUserContext`'s return.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AxiosContext } from "@/lib/context/AuthContext";
import {
  getUserData,
  updateAccountSettings,
  uploadProfileImage,
  type UserData,
} from "@/lib/services/userService";
import { setI18nLanguage, useTranslation } from "@/lib/i18n/client";
import { getUser } from "../auth";

type RealUserDataModule = typeof import("@/lib/context/UserDataContext");
type UserDataContextValue = ReturnType<RealUserDataModule["useUserContext"]>;

// Billing is inert (paywall off — SCAV-4127). Stable module-scope no-ops keep the
// context value shape intact without bundling paymentService / Stripe checkout, and
// give consumers fixed identities (safe to drop straight into the value object — no
// useCallback / dep-array bookkeeping needed).
const inertCheckoutSession = async () => null;
const inertBillingNoop = async () => {};

const DEFAULT_VALUE: UserDataContextValue = {
  userProfile: null,
  auth0User: null,
  isLoading: true,
  isUpdatingLocale: false,
  updateUserProfile: async () => {},
  updateUserPicture: async () => {},
  setIsLoading: () => {},
  refreshUserProfile: async () => {},
  createCheckoutSession: inertCheckoutSession,
  fetchStripeSubscriptionStatus: inertBillingNoop,
  cancelUserSubscription: inertBillingNoop,
};

const UserDataContext = createContext<UserDataContextValue>(DEFAULT_VALUE);

export const useUserContext: RealUserDataModule["useUserContext"] = () =>
  useContext(UserDataContext);

export const UserDataProvider: RealUserDataModule["UserDataProvider"] = ({
  children,
}) => {
  const { t: tSettings } = useTranslation("settings");
  const { authStatus, isLoading: authLoading } = useContext(AxiosContext);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [auth0User, setAuth0User] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocale, setIsUpdatingLocale] = useState(false);
  const hasInitialSynced = useRef(false);

  // Real profile fetch — backend GET /project/get_user_profile (profile at
  // response.data.profile_detail). No subscription fetch (paywall off) and no
  // is_blocked host redirect (see header). Drives `userProfile.user_role_name`,
  // which the real OrgFeatureProvider reads to compute feature flags.
  const refreshUserProfile = useCallback(async () => {
    try {
      const res = await getUserData();
      const profile = res?.data?.profile_detail as UserData | undefined;

      if (profile) setUserProfile(profile);
    } catch (error) {
      console.error("[web-component] getUserData failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch keyed off the real auth state (same trigger as the app provider). The
  // widget's WebComponentAuthProvider sets authStatus "ready" after login.
  useEffect(() => {
    if (authStatus === "ready") {
      void refreshUserProfile();
      void getUser()
        .then(setAuth0User)
        .catch(() => {});
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authStatus, authLoading, refreshUserProfile]);

  // Honor the user's saved locale once (i18next is initialized at module load, no
  // provider needed). Keeps the chat localized and LanguageToolbarButton coherent.
  useEffect(() => {
    if (!hasInitialSynced.current && userProfile) {
      hasInitialSynced.current = true;
      if (userProfile.locale) setI18nLanguage(userProfile.locale);
    }
  }, [userProfile]);

  const updateUserProfile = useCallback(
    async (data: Partial<UserData>) => {
      try {
        if (data.locale !== undefined) setIsUpdatingLocale(true);
        const response = await updateAccountSettings(data);

        if (response.data.status_code === 200) {
          setUserProfile((prev) =>
            prev
              ? {
                  ...response.data.profile_detail,
                  subscription: prev.subscription,
                }
              : response.data.profile_detail,
          );
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
        if (data.locale !== undefined) setIsUpdatingLocale(false);
      }
    },
    [tSettings],
  );

  const updateUserPicture = useCallback(
    async (file: File) => {
      try {
        const response = await uploadProfileImage(file);
        const imageUrl = response.download_url;
        setUserProfile((prev) =>
          prev ? { ...prev, profile_image_url: imageUrl } : null,
        );
        toast.success(tSettings("profile.imageUpdateSuccess"));
      } catch (error) {
        console.error("Failed to upload profile image:", error);
        toast.error(tSettings("profile.imageUpdateFailed"));
      }
    },
    [tSettings],
  );

  const value = useMemo<UserDataContextValue>(
    () => ({
      userProfile,
      auth0User,
      isLoading,
      isUpdatingLocale,
      updateUserProfile,
      updateUserPicture,
      setIsLoading,
      refreshUserProfile,
      createCheckoutSession: inertCheckoutSession,
      fetchStripeSubscriptionStatus: inertBillingNoop,
      cancelUserSubscription: inertBillingNoop,
    }),
    [
      userProfile,
      auth0User,
      isLoading,
      isUpdatingLocale,
      updateUserProfile,
      updateUserPicture,
      refreshUserProfile,
    ],
  );

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
