"use client";

import { Icon } from "@/components/ui/icon";
import { Small } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n/client";
import { useVault } from "../context/VaultContext";
import type { VaultHistoryEntry } from "@/lib/services/vaultService";

const COLUMNS = [
  "status",
  "tool",
  "file",
  "version",
  "requestedBy",
  "requestedAt",
  "reviewedBy",
  "reviewedAt",
  "reason",
] as const;

const SKELETON_ROWS = 5;

const formatDate = (iso: string | null) => {
  if (!iso || isNaN(new Date(iso).getTime())) return "\u2014";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const getToolDisplayName = (toolName: string): string => {
  return toolName
    .replace(/^vault_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getCellValue = (
  entry: VaultHistoryEntry,
  col: (typeof COLUMNS)[number],
) => {
  switch (col) {
    case "status":
      return entry.status;
    case "tool":
      return entry.is_delete
        ? `\ud83d\uddd1\ufe0f ${getToolDisplayName(entry.tool_name)}`
        : getToolDisplayName(entry.tool_name);
    case "file":
      return entry.vault_path || "\u2014";
    case "version":
      return entry.version;
    case "requestedBy":
      return entry.requested_by || "\u2014";
    case "requestedAt":
      return formatDate(entry.created_at);
    case "reviewedBy":
      return entry.reviewed_by || "\u2014";
    case "reviewedAt":
      return formatDate(entry.reviewed_at);
    case "reason":
      return entry.rejection_reason || "\u2014";
  }
};

const AuditTableHeader = () => {
  const { t } = useTranslation("database");

  return (
    <TableHeader className="sticky top-0 z-10 bg-gray-100">
      <TableRow className="border-b border-gray-300 hover:bg-gray-100">
        {COLUMNS.map((col) => (
          <TableHead
            key={col}
            className="h-auto border-r border-gray-300 px-2 py-4 text-left font-bold text-foreground last:border-r-0"
          >
            <Small className="block truncate">
              {t(`vault.auditColumns.${col}`)}
            </Small>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export const VaultAudit = () => {
  const { t } = useTranslation("database");
  const { auditHistory, auditLoading } = useVault();

  if (auditLoading) {
    return (
      <>
        <div className="flex h-10 items-center border-b px-6">
          <h3 className="text-base font-semibold">{t("vault.auditTrail")}</h3>
        </div>
        <div className="overflow-x-auto bg-white">
          <Table>
            <AuditTableHeader />
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col} className="px-2 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (auditHistory.length === 0) {
    return (
      <div className="py-8 text-center">
        <Icon
          name="History"
          size="xl"
          className="mx-auto mb-2 text-muted-foreground/30"
        />
        <p className="text-sm text-muted-foreground">
          {t("vault.noAuditHistory")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-10 items-center border-b px-6">
        <h3 className="text-base font-semibold">{t("vault.auditTrail")}</h3>
      </div>
      <div className="overflow-x-auto bg-white">
        <Table>
          <AuditTableHeader />
          <TableBody>
            {auditHistory.map((entry) => (
              <TableRow key={entry.audit_id}>
                {COLUMNS.map((col) => (
                  <TableCell
                    key={col}
                    className={
                      col === "file"
                        ? "max-w-[180px] truncate px-2 py-3 font-mono"
                        : "px-2 py-3"
                    }
                  >
                    <Small className="text-gray-600">
                      {getCellValue(entry, col)}
                    </Small>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
