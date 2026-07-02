"use client";

import { CONNECTORS } from "../../config/connectorData";
import type { ConnectorId } from "../../config/connectorData";
import type { ConnectionState, SecurityConfig } from "../../types";
import { FileConnectorForm } from "./FileConnectorForm";
import { FileUploadConnectorForm } from "./FileUploadConnectorForm";
import { OAuthOnlyConnectorForm } from "./OAuthOnlyConnectorForm";
import { ServiceConnectorForm } from "./ServiceConnectorForm";
import { StandardConnectorForm } from "./StandardConnectorForm";

type Props = {
  connectorId: ConnectorId;
  onSubmit: (url: string, display: string, security?: SecurityConfig) => void;
  onFileUpload?: (orgdbId: string) => void;
  onDataSourceCreated?: () => void;
  connectionState?: ConnectionState;
  connectionError?: string;
  orgdbId?: string | null;
  onGoToDataSource?: () => void;
};

/**
 * Dispatcher — resolves the connector config and renders the appropriate
 * form component based on connector.template:
 *
 *   oauth-only  → OAuthOnlyConnectorForm  (single OAuth button, auto-submits)
 *   file        → FileConnectorForm       (single path input, no tabs)
 *   file-upload → FileUploadConnectorForm (file picker → REST API upload)
 *   service     → ServiceConnectorForm    (structured fields, no CS tab)
 *   standard    → StandardConnectorForm  (fields + connection-string tab)
 */
export const ConnectorForm = ({
  connectorId,
  onSubmit,
  onFileUpload,
  onDataSourceCreated,
  connectionState,
  connectionError,
  onGoToDataSource,
}: Readonly<Props>) => {
  const connector = CONNECTORS.find((c) => c.id === connectorId);

  if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

  const props = { connector, onSubmit };
  const connectionProps = {
    connectionState,
    connectionError,
    onGoToDataSource,
  };

  switch (connector.template) {
    case "oauth-only":
      return (
        <OAuthOnlyConnectorForm
          connector={connector}
          onFileUpload={onFileUpload ?? (() => {})}
        />
      );
    case "file":
      return <FileConnectorForm {...props} />;
    case "file-upload":
      return (
        <FileUploadConnectorForm
          connector={connector}
          onFileUpload={onFileUpload ?? (() => {})}
          onDataSourceCreated={onDataSourceCreated}
        />
      );
    case "service":
      return <ServiceConnectorForm {...props} {...connectionProps} />;
    default:
      return (
        <StandardConnectorForm
          {...props}
          {...connectionProps}
          showSecuritySettings
        />
      );
  }
};
