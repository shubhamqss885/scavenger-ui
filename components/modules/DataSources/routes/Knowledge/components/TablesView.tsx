"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n/client";
import type { TableItem } from "../types";

type Props = Readonly<{
  tables: TableItem[];
}>;

const FieldRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm">{value || "—"}</dd>
  </div>
);

export const TablesView = ({ tables }: Props) => {
  const { t } = useTranslation("database");
  const [selected, setSelected] = useState<TableItem | null>(null);

  if (tables.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {t("vault.kg.noData")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>{t("vault.kg.table.name")}</TableHead>
              <TableHead>{t("vault.kg.table.type")}</TableHead>
              <TableHead className="text-right">
                {t("vault.kg.table.rows")}
              </TableHead>
              <TableHead className="text-right">
                {t("vault.kg.table.columns")}
              </TableHead>
              <TableHead>{t("vault.kg.table.description")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow
                key={table.id}
                className="cursor-pointer"
                onClick={() => setSelected(table)}
              >
                <TableCell className="font-medium">{table.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {table.tableType || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {table.rowCount?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {table.columnCount}
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {table.description || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{t("vault.kg.typeTable")}</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4">
                <FieldRow
                  label={t("vault.kg.table.description")}
                  value={selected.description}
                />
                <FieldRow
                  label={t("vault.kg.table.type")}
                  value={selected.tableType}
                />
                <FieldRow
                  label={t("vault.kg.table.rows")}
                  value={selected.rowCount?.toLocaleString()}
                />
                <FieldRow
                  label={t("vault.kg.table.columns")}
                  value={selected.columnCount}
                />
                <FieldRow
                  label={t("vault.kg.table.aliases")}
                  value={selected.aliases?.join(", ")}
                />
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
