"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import Connectors from "@/components/modules/Connectors";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import ConnectorFormSkeleton from "@/components/blocks/Loading/ConnectorFormSkeleton";
import {
  CONNECTORS,
  type ConnectorId,
} from "@/components/modules/Connectors/config/connectorData";

const ConnectorPage = () => {
  const params = useParams();
  const router = useRouter();
  const {
    isFeatureEnabled,
    FEATURE_FLAGS,
    isLoading: isFeaturesLoading,
  } = useOrgFeatures();

  const connectorId = params.connectorId as string;
  const isDbConnectEnabled = isFeatureEnabled(FEATURE_FLAGS.DB_CONNECT);

  // Validate connector ID exists
  const isValidConnector = CONNECTORS.some(
    (c) => c.id === connectorId && c.status === "live",
  );

  useEffect(() => {
    if (!isFeaturesLoading && !isDbConnectEnabled) {
      router.replace("/home");
    }
  }, [isFeaturesLoading, isDbConnectEnabled, router]);

  useEffect(() => {
    if (!isFeaturesLoading && !isValidConnector) {
      router.replace("/connectors");
    }
  }, [isFeaturesLoading, isValidConnector, router]);

  if (isFeaturesLoading || !isDbConnectEnabled || !isValidConnector) {
    return <ConnectorFormSkeleton />;
  }

  return <Connectors initialConnectorId={connectorId as ConnectorId} />;
};

export default withPageAuthRequired(ConnectorPage);
