"use client";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Connectors from "@/components/modules/Connectors";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ConnectorsSkeleton from "@/components/blocks/Loading/ConnectorsSkeleton";

const ConnectorsPage = () => {
  const {
    isFeatureEnabled,
    FEATURE_FLAGS,
    isLoading: isFeaturesLoading,
  } = useOrgFeatures();
  const router = useRouter();

  const isDbConnectEnabled = isFeatureEnabled(FEATURE_FLAGS.DB_CONNECT);

  useEffect(() => {
    if (!isFeaturesLoading && !isDbConnectEnabled) {
      router.replace("/home");
    }
  }, [isFeaturesLoading, isDbConnectEnabled, router]);

  if (isFeaturesLoading || !isDbConnectEnabled) return <ConnectorsSkeleton />;

  return <Connectors />;
};

export default withPageAuthRequired(ConnectorsPage);
