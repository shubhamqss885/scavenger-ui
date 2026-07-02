"use client";

import { useState, useCallback, useContext, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrganizationDb } from "@/lib/services/organizationDbService";
import { useOrganizationDbActions } from "@/lib/context/OrganizationDbProvider";
import { useTranslation } from "@/lib/i18n/client";
import {
  CONNECTORS,
  type ConnectorId,
  flattenFields,
} from "@/components/modules/Connectors/config/connectorData";
import { StandardConnectorForm } from "@/components/modules/Connectors/components/connection-forms/StandardConnectorForm";
import { AxiosContext } from "@/lib/context/AuthContext";
import { encryptForServer } from "@/lib/services/ecdhService";
import { decrypt, encrypt } from "@/lib/utils";
import { toast } from "sonner";

type EditConnectionDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: OrganizationDb | null;
}>;

const DB_TYPE_TO_CONNECTOR_ID: Record<string, ConnectorId> = {
  postgresql: "postgresql",
  postgres: "postgresql",
  mysql: "mysql",
  mariadb: "mariadb",
  mssql: "mssql",
  sqlserver: "mssql",
  oracle: "oracle",
  cockroachdb: "cockroachdb",
  cockroach: "cockroachdb",
  tidb: "tidb",
  yugabytedb: "yugabytedb",
  singlestore: "singlestore",
  snowflake: "snowflake",
  bigquery: "bigquery",
  redshift: "redshift",
  databricks: "databricks",
  clickhouse: "clickhouse",
  mongodb: "mongodb",
};

export function EditConnectionDialog({
  open,
  onOpenChange,
  database,
}: EditConnectionDialogProps) {
  const { t } = useTranslation("database");
  const { token } = useContext(AxiosContext);
  const { updateDbByUrl } = useOrganizationDbActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const connectorId = database?.db_type
    ? DB_TYPE_TO_CONNECTOR_ID[database.db_type.toLowerCase()]
    : null;

  const connector = connectorId
    ? CONNECTORS.find((c) => c.id === connectorId)
    : null;

  const initialValues: Record<string, string> | undefined = useMemo(() => {
    if (!database || !connector) return undefined;

    // Start with basic values from the database object
    let values: Record<string, string> = {
      host: database.orgdb_hostname_decrypted || "",
      port: database.orgdb_port?.toString() || "",
      database: database.orgdb_name_decrypted || "",
      username: database.orgdb_username_decrypted || "",
      password: "", // Never pre-fill password for security
      schema: database.orgdb_schema || "",
    };

    // If there's an encrypted connection URL, try to parse it for additional fields
    if (database.orgdb_connection_url_encrypted && connector.parseUrl) {
      try {
        const decryptedUrl = decrypt(database.orgdb_connection_url_encrypted);
        const parsedValues = connector.parseUrl(decryptedUrl);
        // Merge parsed values, but don't overwrite password
        values = { ...values, ...parsedValues, password: "" };
      } catch (err) {
        console.warn("Failed to parse connection URL for editing:", err);
      }
    }

    // For connectors without parseUrl, try to populate from standard fields
    // Map orgdb fields to connector field names
    const fieldNames = flattenFields(connector.fields).map((f) => f.name);

    // Ensure all connector fields have at least empty values
    for (const fieldName of fieldNames) {
      if (!(fieldName in values)) {
        values[fieldName] = "";
      }
    }

    return values;
  }, [database, connector]);

  const handleSubmit = useCallback(
    async (connectionUrl: string) => {
      if (!database) return;

      setIsSubmitting(true);
      try {
        // Use ECDH encryption for transit security during validation
        const ecdhEncryptedUrl = await encryptForServer(connectionUrl);

        const res = await fetch("/api/connectors/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ connection_string: ecdhEncryptedUrl }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || body.message || "Connection validation failed",
          );
        }

        // Use AES-CBC encryption for storage (matches frontend decrypt() format)
        const storageEncryptedUrl = encrypt(connectionUrl);

        await updateDbByUrl(database.orgdb_id, {
          orgdb_connection_url_encrypted: storageEncryptedUrl,
          db_type: database.db_type,
          is_agentic: true,
        });

        toast.success(t("edit.success"));
        onOpenChange(false);
      } catch (err) {
        console.error("Failed to update database:", err);
        toast.error(
          err instanceof Error ? err.message : t("actions.updateFailed"),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [database, token, updateDbByUrl, onOpenChange, t],
  );

  if (!database || !connector) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6">
            <StandardConnectorForm
              connector={connector}
              onSubmit={(url) => handleSubmit(url)}
              initialValues={initialValues}
              isEditing={true}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
