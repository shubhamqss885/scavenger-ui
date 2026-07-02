"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { cn, formatScientificNotation } from "@/lib/utils";
import { Muted, Small } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";

type TableDataViewerProps = Readonly<{
  data: Record<string, any>[];
  loading?: boolean;
  onSort?: (column: string, order: "asc" | "desc") => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}>;

type SortIndicatorProps = Readonly<{
  sortOrder?: "asc" | "desc" | false;
}>;

// Component to render sort indicator icons
function SortIndicator({ sortOrder }: SortIndicatorProps) {
  if (sortOrder === "asc") {
    return <Icon name="ArrowUp" size="xxs" />;
  }
  if (sortOrder === "desc") {
    return <Icon name="ArrowDown" size="xxs" />;
  }
  return <Icon name="ArrowUpDown" size="xxs" />;
}

// Helper function to handle column sort logic
function handleColumnSort(
  columnKey: string,
  currentSortBy: string | undefined,
  currentSortOrder: "asc" | "desc" | undefined,
  onSort: ((column: string, order: "asc" | "desc") => void) | undefined,
) {
  if (!onSort) return;

  const isCurrentlySorted = currentSortBy === columnKey;
  const newOrder =
    isCurrentlySorted && currentSortOrder === "asc" ? "desc" : "asc";
  onSort(columnKey, newOrder);
}

export function TableDataViewer({
  data,
  loading = false,
  onSort,
  sortBy,
  sortOrder,
}: TableDataViewerProps) {
  const { t } = useTranslation("database");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const columnCount = Object.keys(firstRow).length;
    // For small tables (≤5 columns), use larger minimum width
    const minColumnSize = columnCount <= 5 ? 150 : 50;

    return Object.keys(firstRow).map((key) => ({
      accessorFn: (row) => row[key],
      id: key,
      header: () => {
        // Check if this column is currently sorted
        const isCurrentlySorted = sortBy === key;
        const currentSortOrder = isCurrentlySorted ? sortOrder : false;

        return (
          <button
            className={cn(
              "flex items-center gap-1 font-semibold text-left w-full text-xs",
              "hover:bg-gray-200 transition-colors px-2 py-1",
              onSort && "cursor-pointer",
            )}
            onClick={() => handleColumnSort(key, sortBy, sortOrder, onSort)}
            disabled={!onSort}
          >
            <span className="truncate">{key}</span>
            {onSort && (
              <span className="ml-auto">
                <SortIndicator sortOrder={currentSortOrder} />
              </span>
            )}
          </button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        const displayValue = formatCellValue(value, t);
        return (
          <div className="font-mono truncate" title={String(displayValue)}>
            <Small className="font-mono">{displayValue}</Small>
          </div>
        );
      },
      size: 150,
      minSize: minColumnSize,
      maxSize: 500,
    }));
  }, [data, onSort, sortBy, sortOrder]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
  });

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Muted>{t("dataTab.tableViewer.loading")}</Muted>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <Muted>{t("dataTab.tableViewer.noDataAvailable")}</Muted>
      </div>
    );
  }

  return (
    <div className="max-w-0">
      <table className="border-collapse w-full">
        <thead className="sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="bg-gray-100 border-b border-gray-300"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-r border-gray-300 last:border-r-0 font-semibold text-left"
                  style={{
                    width: header.column.getSize(),
                    minWidth: header.column.columnDef.minSize,
                    maxWidth: header.column.columnDef.maxSize,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-gray-200",
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50",
                "hover:bg-blue-50 transition-colors",
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border-r border-gray-200 px-2 py-1"
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    maxWidth: cell.column.columnDef.maxSize,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(value: any, t: (key: string) => string): string {
  if (value === null) return t("dataTab.tableViewer.nullValue");
  if (value === undefined) return "";
  if (typeof value === "boolean")
    return value
      ? t("dataTab.tableViewer.trueValue")
      : t("dataTab.tableViewer.falseValue");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return t("dataTab.tableViewer.objectValue");
    }
  }

  // Apply scientific notation formatting for numeric values
  return formatScientificNotation(value);
}
