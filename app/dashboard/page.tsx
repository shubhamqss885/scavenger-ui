"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import OrgDashboardsPage from "@/components/modules/OrgDashboard";

const Page = () => {
  const router = useRouter();
  const { isFeatureEnabled, FEATURE_FLAGS, isLoading } = useOrgFeatures();
  const enabled = isFeatureEnabled(FEATURE_FLAGS.VIEW_ORG_DASHBOARDS);

  useEffect(() => {
    if (!isLoading && !enabled) router.replace("/home");
  }, [isLoading, enabled, router]);

  if (isLoading || !enabled) return null;
  return <OrgDashboardsPage />;
};

export default Page;
