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
import type { ViewItem } from "../types";

type Props = Readonly<{
  views: ViewItem[];
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

export const ViewsView = ({ views }: Props) => {
  const { t } = useTranslation("database");
  const [selected, setSelected] = useState<ViewItem | null>(null);

  if (views.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {t("vault.kg.noViews")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>{t("vault.kg.view.name")}</TableHead>
              <TableHead className="text-right">
                {t("vault.kg.view.rows")}
              </TableHead>
              <TableHead>{t("vault.kg.view.description")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => (
              <TableRow
                key={view.id}
                className="cursor-pointer"
                onClick={() => setSelected(view)}
              >
                <TableCell className="font-medium">{view.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {view.rowCount?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {view.description || "—"}
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
                <SheetDescription>{t("vault.kg.typeView")}</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4">
                <FieldRow
                  label={t("vault.kg.view.description")}
                  value={selected.description}
                />
                <FieldRow
                  label={t("vault.kg.view.rows")}
                  value={selected.rowCount?.toLocaleString()}
                />
                <FieldRow
                  label={t("vault.kg.view.aliases")}
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
