"use client";

import { useState, useMemo, Fragment } from "react";
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
import type { ColumnItem } from "../types";

type Props = Readonly<{
  columns: ColumnItem[];
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

export const ColumnsView = ({ columns }: Props) => {
  const { t } = useTranslation("database");
  const [selected, setSelected] = useState<ColumnItem | null>(null);

  // Group columns by table
  const grouped = useMemo(() => {
    const map = new Map<string, ColumnItem[]>();
    for (const col of columns) {
      if (!map.has(col.tableName)) map.set(col.tableName, []);
      map.get(col.tableName)!.push(col);
    }
    return map;
  }, [columns]);

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>{t("vault.kg.column.name")}</TableHead>
              <TableHead>{t("vault.kg.column.dataType")}</TableHead>
              <TableHead>{t("vault.kg.column.pk")}</TableHead>
              <TableHead>{t("vault.kg.column.nullable")}</TableHead>
              <TableHead className="text-right">
                {t("vault.kg.column.confidence")}
              </TableHead>
              <TableHead>{t("vault.kg.column.description")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(grouped.entries()).map(([tableName, cols]) => (
              <Fragment key={tableName}>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell
                    colSpan={6}
                    className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {tableName}
                  </TableCell>
                </TableRow>
                {cols.map((col) => (
                  <TableRow
                    key={col.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(col)}
                  >
                    <TableCell className="pl-6 font-medium">
                      {col.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {col.dataType}
                    </TableCell>
                    <TableCell>{col.isPk ? "Yes" : ""}</TableCell>
                    <TableCell>{col.nullable ? "Yes" : ""}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {col.confidence}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {col.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
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
                <SheetTitle>{selected.id}</SheetTitle>
                <SheetDescription>{t("vault.kg.typeColumn")}</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4">
                <FieldRow
                  label={t("vault.kg.column.name")}
                  value={selected.name}
                />
                <FieldRow
                  label={t("vault.kg.column.description")}
                  value={selected.description}
                />
                <FieldRow
                  label={t("vault.kg.column.dataType")}
                  value={selected.dataType}
                />
                <FieldRow
                  label={t("vault.kg.column.pk")}
                  value={selected.isPk ? "Yes" : "No"}
                />
                <FieldRow
                  label={t("vault.kg.column.nullable")}
                  value={selected.nullable ? "Yes" : "No"}
                />
                <FieldRow
                  label={t("vault.kg.column.uniqueValues")}
                  value={selected.uniqueValues?.toLocaleString()}
                />
                <FieldRow
                  label={t("vault.kg.column.minValue")}
                  value={selected.minValue}
                />
                <FieldRow
                  label={t("vault.kg.column.maxValue")}
                  value={selected.maxValue}
                />
                <FieldRow
                  label={t("vault.kg.column.confidence")}
                  value={`${selected.confidence} / 10`}
                />
                <FieldRow
                  label={t("vault.kg.column.aliases")}
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
