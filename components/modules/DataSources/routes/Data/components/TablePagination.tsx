"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableDataPagination } from "@/lib/services/organizationDbService";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { TableFooterSkeleton } from "./TableFooterSkeleton";

type TablePaginationProps = Readonly<{
  pagination: TableDataPagination | undefined;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  showSkeleton?: boolean;
}>;

export function TablePagination({
  pagination,
  totalRows,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  showSkeleton = false,
}: TablePaginationProps) {
  const { t } = useTranslation("database");

  if (showSkeleton || !pagination) {
    return <TableFooterSkeleton />;
  }

  const { page, page_size, total_pages } = pagination;
  const startRow = (page - 1) * page_size + 1;
  const endRow = Math.min(page * page_size, totalRows);

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="flex min-h-[41px] flex-wrap-reverse items-center justify-center gap-x-2 gap-y-2 bg-slate-50 px-2 py-1 sm:h-[41px] sm:flex-nowrap sm:justify-between">
      <div className="flex items-center gap-2">
        <Muted className="text-xs">{t("dataTab.rowsPerPage")}:</Muted>
        <Select
          value={String(page_size)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Muted className="text-xs">
        {t("dataTab.showing")
          .replace("{{start}}", startRow.toLocaleString())
          .replace("{{end}}", endRow.toLocaleString())
          .replace("{{total}}", totalRows.toLocaleString())}
      </Muted>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={disabled || page === 1}
          className="h-8 w-8 p-0"
        >
          <Icon name="ChevronFirst" size="sm" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page === 1}
          className="h-8 w-8 p-0"
        >
          <Icon name="ChevronLeft" size="sm" />
        </Button>

        <div className="flex items-center gap-1">
          <Muted className="text-xs">{t("dataTab.page")}</Muted>
          {/* <input
            type="number"
            value={page}
            onChange={(e) => {
              const newPage = parseInt(e.target.value);

              if (newPage >= 1 && newPage <= total_pages) {
                onPageChange(newPage);
              }
            }}
            className="w-12 h-8 px-2 text-center border rounded text-xs"
            min={1}
            max={total_pages}
            disabled={disabled}
          /> */}
          <Muted className="text-xs">{page}</Muted>
          <Muted className="text-xs">
            {t("dataTab.of")} {total_pages}
          </Muted>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page === total_pages}
          className="h-8 w-8 p-0"
        >
          <Icon name="ChevronRight" size="sm" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(total_pages)}
          disabled={disabled || page === total_pages}
          className="h-8 w-8 p-0"
        >
          <Icon name="ChevronLast" size="sm" />
        </Button>
      </div>
    </div>
  );
}
