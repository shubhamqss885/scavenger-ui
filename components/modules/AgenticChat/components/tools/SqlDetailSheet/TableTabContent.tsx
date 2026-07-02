"use client";

import { useTranslation } from "@/lib/i18n/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TableTabContentProps = Readonly<{
  columns: string[];
  displayRows: Record<string, string>[];
  data: Record<string, string>[];
}>;

export const TableTabContent = ({
  columns,
  displayRows,
  data,
}: TableTabContentProps) => {
  const { t } = useTranslation("agentic-chat");

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        {t("sql.noResultData")}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col}
              className="sticky top-0 z-10 whitespace-nowrap bg-white text-xs dark:bg-slate-950"
            >
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayRows.map((row, i) => (
          <TableRow key={`row-${i}-${Object.values(row).join("-")}`}>
            {columns.map((col) => (
              <TableCell key={col} className="max-w-[200px] truncate text-xs">
                {String(row[col] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
