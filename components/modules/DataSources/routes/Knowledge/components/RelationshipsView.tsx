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
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/client";
import type { RelationshipItem } from "../types";

type Props = Readonly<{
  relationships: RelationshipItem[];
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

export const RelationshipsView = ({ relationships }: Props) => {
  const { t } = useTranslation("database");
  const [selected, setSelected] = useState<RelationshipItem | null>(null);

  if (relationships.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {t("vault.kg.noRelationships")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>{t("vault.kg.rel.name")}</TableHead>
              <TableHead>{t("vault.kg.rel.tables")}</TableHead>
              <TableHead>{t("vault.kg.rel.cardinality")}</TableHead>
              <TableHead>{t("vault.kg.rel.columns")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relationships.map((rel) => (
              <TableRow
                key={rel.id}
                className="cursor-pointer"
                onClick={() => setSelected(rel)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {rel.name || rel.id}
                    {rel.certified && (
                      <Badge variant="secondary" className="text-xs">
                        {t("vault.kg.rel.certified")}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rel.leftTableDisplay} → {rel.rightTableDisplay}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rel.cardinality || "—"}
                </TableCell>
                <TableCell className="max-w-[300px] truncate font-mono text-xs text-muted-foreground">
                  {rel.label}
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
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    {selected.name || selected.id}
                    {selected.certified && (
                      <Badge variant="secondary" className="text-xs">
                        {t("vault.kg.rel.certified")}
                      </Badge>
                    )}
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {t("vault.kg.relationship")}
                </SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4">
                <FieldRow
                  label={t("vault.kg.rel.description")}
                  value={selected.description}
                />
                <FieldRow
                  label={t("vault.kg.rel.businessMeaning")}
                  value={selected.businessMeaning}
                />
                <FieldRow
                  label={t("vault.kg.rel.cardinality")}
                  value={selected.cardinality}
                />
                <FieldRow
                  label={t("vault.kg.rel.leftTable")}
                  value={selected.leftTable}
                />
                <FieldRow
                  label={t("vault.kg.rel.rightTable")}
                  value={selected.rightTable}
                />
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("vault.kg.rel.columnMapping")}
                  </dt>
                  <dd className="mt-1 space-y-1">
                    {selected.columnPairs.map((pair, i) => (
                      <div
                        key={i}
                        className="rounded bg-muted px-2 py-1 font-mono text-xs"
                      >
                        {pair.left} → {pair.right}
                      </div>
                    ))}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
