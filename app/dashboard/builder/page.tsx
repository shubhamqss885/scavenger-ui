"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { DashboardBuilder } from "@/components/modules/DashboardBuilder";

export default function DashboardBuilderPage() {
  const router = useRouter();
  const { isFeatureEnabled, FEATURE_FLAGS, isLoading } = useOrgFeatures();
  const enabled = isFeatureEnabled(FEATURE_FLAGS.DASHBOARD_BUILDER);

  useEffect(() => {
    if (!isLoading && !enabled) router.replace("/home");
  }, [isLoading, enabled, router]);

  if (isLoading || !enabled) return null;
  return <DashboardBuilder />;
}
