"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrganizationDb } from "@/lib/services/organizationDbService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import { ConnectionStatusBadge } from "@/components/blocks/ConnectionStatusBadge";
import { Small, Muted } from "@/components/ui/typography";
import { isProductionDatabase, maskHostname, maskUsername } from "@/lib/utils";

type ConnectionDetailsModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: OrganizationDb | null;
  databaseName?: string;
}>;

export function ConnectionDetailsModal({
  open,
  onOpenChange,
  database,
  databaseName,
}: ConnectionDetailsModalProps) {
  const { t } = useTranslation("database");
  const { t: tSettings } = useTranslation("settings");

  if (!database) return null;

  const placeholder = t("connectionDetails.placeholder");
  const isProduction = isProductionDatabase(database.orgdb_hostname_decrypted);

  const getHostValue = () => {
    if (!database.orgdb_hostname_decrypted) return placeholder;
    return isProduction
      ? maskHostname(database.orgdb_hostname_decrypted)
      : database.orgdb_hostname_decrypted;
  };

  const getUsernameValue = () => {
    if (!database.orgdb_username_decrypted) return placeholder;
    return isProduction
      ? maskUsername(database.orgdb_username_decrypted)
      : database.orgdb_username_decrypted;
  };

  const connectionDetails = [
    {
      label: t("connectionDetails.name"),
      value: databaseName || database.orgdb_name_decrypted,
    },
    {
      label: t("connectionDetails.host"),
      value: getHostValue(),
    },
    {
      label: t("connectionDetails.port"),
      value: isProduction
        ? "****"
        : database.orgdb_port?.toString() || placeholder,
    },
    {
      label: t("connectionDetails.username"),
      value: getUsernameValue(),
    },
    {
      label: t("connectionDetails.databaseType"),
      value: database.db_type || placeholder,
    },
    {
      label: t("connectionDetails.schema"),
      value: database.orgdb_schema || placeholder,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("connectionDetails.title")}</DialogTitle>
          <DialogDescription>
            {t("connectionDetails.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Status and meta badges */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-medium">
            {t("connectionDetails.status")}
          </span>
          <div className="flex items-center gap-2">
            <ConnectionStatusBadge
              isConnected={!!database.is_connected}
              className="h-5 px-2 text-[10px]"
            />
            {database.is_default && (
              <Badge
                variant="outline"
                className="h-5 border-slate-400 px-2 text-[9.5px] text-slate-500"
              >
                {tSettings("databases.card.default")}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Connection details grid */}
        <div className="grid grid-cols-3 gap-y-3 py-2">
          {connectionDetails.map((detail) => (
            <div key={detail.label} className="contents">
              <Small className="text-muted-foreground">{detail.label}</Small>
              <Muted className="col-span-2 break-words text-xs">
                {detail.value}
              </Muted>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
