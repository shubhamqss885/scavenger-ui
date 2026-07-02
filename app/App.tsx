"use client";

import { useContext, useEffect } from "react";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "@/styles/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AxiosContext, AxiosProvider } from "@/lib/context/AuthContext";
import {
  UserDataProvider,
  useUserContext,
} from "@/lib/context/UserDataContext";
import { EventsProvider } from "@/lib/context/EventsContext";
import { ProjectsProvider } from "@/lib/context/ProjectsContext";
import { OrgFeatureProvider } from "@/lib/context/OrgFeatureContext";
import { UIStateProvider } from "@/lib/context/UIStateContext";
import ProjectFilesProvider from "@/lib/context/ProjectFilesProvider";
import { DashboardStatsProvider } from "@/lib/context/DashboardStatsProvider";
import ScavengerLoading from "@/components/blocks/Loading/ScavengerLoading";
import { OrganizationDbProvider } from "@/lib/context/OrganizationDbProvider";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/app/AppLayout";
import { OrgDashboardsProvider } from "@/lib/context/OrgDashboardContext";
import { AnalyticsProvider } from "@/lib/context/AnalyticsProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getHomeRoute } from "@/lib/utils/homeRoute";

const App: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();

  // For error page, skip authentication providers to avoid logout redirects
  if (pathname.startsWith("/error") || pathname.startsWith("/maintenance")) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
          closeButton
          swipeDirections={["top"]}
        />
      </ThemeProvider>
    );
  }

  return (
    <UserProvider>
      <AxiosProvider>
        <QueryClientProvider client={queryClient}>
          <EventsProvider>
            <UserDataProvider>
              <AnalyticsProvider gaId="G-ZEXVP2ZDPJ">
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  forcedTheme="light"
                  // enableSystem
                >
                  <TooltipProvider delayDuration={0}>
                    <InitializedApp>{children}</InitializedApp>
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 3000,
                      }}
                      closeButton
                      swipeDirections={["top"]}
                    />
                  </TooltipProvider>
                </ThemeProvider>
              </AnalyticsProvider>
            </UserDataProvider>
          </EventsProvider>
        </QueryClientProvider>
      </AxiosProvider>
    </UserProvider>
  );
};

const InitializedApp: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useContext(AxiosContext);
  const { userProfile, isLoading } = useUserContext();
  const pathname = usePathname();

  // Show loading while initializing
  if (isLoading) {
    return <ScavengerLoading />;
  }

  // Handle routing based on auth status first
  if (authStatus === "email_unverified") {
    if (!pathname.includes("/verify")) {
      return <Navigate to="/verify" />;
    }
    return <>{children}</>;
  }

  // Handle routing for authenticated users
  if (authStatus === "ready") {
    // Allow access to legal pages without redirection
    const isLegalPage =
      pathname === "/terms-conditions" || pathname === "/privacy-policy";
    const hasAcceptedTerms = userProfile?.terms_accepted;

    // Role-aware home route (viewers → /dashboard, everyone else → /home).
    // OrgFeatureProvider isn't mounted yet at this point, so we derive it
    // from userProfile directly via the shared util.
    const homeRoute = getHomeRoute(userProfile?.user_role_name);

    // PROTECTION: Block users who have accepted terms from accessing onboarding
    // (Simplified flow: no plan-selection step, all users go directly to home)
    if (pathname.includes("/onboarding") && hasAcceptedTerms) {
      return <Navigate to={homeRoute} />;
    }

    // REDIRECT: Users without accepted terms must complete onboarding
    if (
      !hasAcceptedTerms &&
      !pathname.includes("/onboarding") &&
      !isLegalPage
    ) {
      return <Navigate to="/onboarding" />;
    }

    // REDIRECT: Users on initial pages with accepted terms go to home.
    // /home is included so org-viewers landing there get bounced to /dashboard
    // (the `homeRoute !== pathname` guard prevents the no-op self-redirect for
    // non-viewers whose homeRoute is already /home).
    const initialPages = ["/verify", "/", "/home"];

    if (
      hasAcceptedTerms &&
      initialPages.includes(pathname) &&
      homeRoute !== pathname
    ) {
      return <Navigate to={homeRoute} />;
    }

    return (
      <DashboardStatsProvider>
        <OrgFeatureProvider>
          <UIStateProvider>
            <OrganizationDbProvider>
              <ProjectsProvider>
                <ProjectFilesProvider>
                  <OrgDashboardsProvider>
                    <AppLayout>{children}</AppLayout>
                  </OrgDashboardsProvider>
                </ProjectFilesProvider>
              </ProjectsProvider>
            </OrganizationDbProvider>
          </UIStateProvider>
        </OrgFeatureProvider>
      </DashboardStatsProvider>
    );
  }

  return <ScavengerLoading />;
};

// Navigate component for redirects
const Navigate = ({ to }: { to: string }) => {
  const router = useRouter();
  useEffect(() => {
    router.push(to);
  }, [router, to]);
  return <ScavengerLoading />;
};

export default App;
