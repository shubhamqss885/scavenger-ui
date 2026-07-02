"use client";

import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import type { FeatureFlagName } from "@/lib/context/OrgFeatureContext/featureFlags";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";

type AdminOnlyRouteProps = Readonly<{
  children: React.ReactNode;
  flag?: FeatureFlagName;
}>;

export function AdminOnlyRoute({
  children,
  flag = "VIEW_DATASOURCES",
}: AdminOnlyRouteProps) {
  const { isFeatureEnabled, FEATURE_FLAGS, isLoading, homeRoute } =
    useOrgFeatures();
  const router = useRouter();

  const hasAdminAccess = isFeatureEnabled(FEATURE_FLAGS[flag]);

  useEffect(() => {
    if (!isLoading && !hasAdminAccess) {
      router.push(homeRoute);
    }
  }, [isLoading, hasAdminAccess, router, homeRoute]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icon
          name="Loader2"
          size="xl"
          className="animate-spin"
          variant="muted"
        />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return <>{children}</>;
}
