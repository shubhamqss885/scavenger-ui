"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import DashboardPageWithProvider from "@/components/modules/OrgDashboard/components/SingleDashboardWithProvider";

const Page = () => {
  const router = useRouter();
  const { isFeatureEnabled, FEATURE_FLAGS, isLoading } = useOrgFeatures();
  const enabled = isFeatureEnabled(FEATURE_FLAGS.VIEW_ORG_DASHBOARDS);

  useEffect(() => {
    if (!isLoading && !enabled) router.replace("/home");
  }, [isLoading, enabled, router]);

  if (isLoading || !enabled) return null;
  return <DashboardPageWithProvider />;
};

export default Page;
