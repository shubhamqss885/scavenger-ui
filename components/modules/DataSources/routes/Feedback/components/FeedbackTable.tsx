"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  ColumnResizeMode,
} from "@tanstack/react-table";
import { formatDistanceToNow, format } from "date-fns";
import { useTranslation } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Small } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FeedbackRecord,
  TextToSqlFeedbackRecord,
} from "@/lib/services/orgDbFeedbackService";
import { canSaveAsExample } from "../utils/canSaveAsExample";

type FeedbackTableProps = Readonly<{
  data: FeedbackRecord[];
  onRowClick?: (record: FeedbackRecord) => void;
  onSaveAsExample?: (record: FeedbackRecord) => void;
  onToggleResolved?: (record: FeedbackRecord) => void;
  resolvingId?: string | null;
}>;

export function FeedbackTable({
  data,
  onRowClick,
  onSaveAsExample,
  onToggleResolved,
  resolvingId,
}: FeedbackTableProps) {
  const { t } = useTranslation("database");

  const columns = useMemo<ColumnDef<FeedbackRecord>[]>(
    () => [
      // Feedback column (thumbs up/down) - FIXED
      {
        id: "feedback",
        accessorKey: "feedback",
        size: 48,
        minSize: 48,
        maxSize: 48,
        header: () => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Small className="block truncate">
                {t("feedbackTab.columns.feedback")}
              </Small>
            </TooltipTrigger>
            <TooltipContent>{t("feedbackTab.columns.feedback")}</TooltipContent>
          </Tooltip>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as "+1" | "-1";
          return (
            <div className="flex items-center justify-center">
              <Icon
                name={value === "+1" ? "ThumbsUp" : "ThumbsDown"}
                size="sm"
                className={value === "+1" ? "text-green-600" : "text-red-500"}
              />
            </div>
          );
        },
      },
      // Prompt column - FLEXIBLE (grows to fill)
      {
        id: "prompt",
        accessorKey: "prompt",
        size: 300,
        minSize: 200,
        // No maxSize - allows growth
        header: () => <Small>{t("feedbackTab.columns.prompt")}</Small>,
        cell: ({ getValue }) => (
          <div className="line-clamp-5" title={getValue() as string}>
            <Small className="leading-relaxed text-gray-900">
              {getValue() as string}
            </Small>
          </div>
        ),
      },
      // Response column - FLEXIBLE (grows to fill)
      // Shows smart content based on type: SQL query for text_to_sql, response for others
      {
        id: "response",
        accessorKey: "response",
        size: 300,
        minSize: 200,
        // No maxSize - allows growth
        header: () => <Small>{t("feedbackTab.columns.response")}</Small>,
        cell: ({ row }) => {
          const record = row.original;
          let displayText = record.response || "-";

          // For SQL types, show the generated SQL instead of response
          if (
            record.type === "text_to_sql" ||
            record.type === "text_to_nosql"
          ) {
            const sqlRecord = record as TextToSqlFeedbackRecord;
            displayText =
              sqlRecord.generated_sql ||
              sqlRecord.sql_explanation ||
              record.response ||
              "-";
          }

          return (
            <div className="line-clamp-5" title={displayText}>
              <Small className="leading-relaxed text-gray-600">
                {displayText}
              </Small>
            </div>
          );
        },
      },
      // Type column - FIXED
      {
        id: "type",
        accessorKey: "type",
        size: 55,
        minSize: 45,
        maxSize: 65,
        header: () => <Small>{t("feedbackTab.columns.type")}</Small>,
        cell: ({ row }) => {
          const type = row.original.type;
          const typeLabels: Record<string, string> = {
            chat: "CHAT",
            text_to_sql: "SQL",
            text_to_nosql: "NOSQL",
          };
          const label = typeLabels[type] ?? type;

          return (
            <div className="leading-tight">
              <Small className="block whitespace-normal text-xs text-gray-600">
                {label}
              </Small>
            </div>
          );
        },
      },
      // Comment column - FIXED with slight flex
      {
        id: "comment",
        accessorKey: "feedback_comment",
        size: 100,
        minSize: 80,
        maxSize: 125,
        header: () => <Small>{t("feedbackTab.columns.comment")}</Small>,
        cell: ({ getValue }) => {
          const comment = getValue() as string | null;

          return (
            <div className="line-clamp-3" title={comment || ""}>
              <Small className="text-gray-600">{comment || "-"}</Small>
            </div>
          );
        },
      },
      // Project column - FIXED
      {
        id: "project",
        accessorKey: "project_name",
        size: 60,
        minSize: 60,
        maxSize: 90,
        header: () => <Small>{t("feedbackTab.columns.project")}</Small>,
        cell: ({ getValue }) => (
          <div className="line-clamp-2">
            <Small className="text-gray-700">{getValue() as string}</Small>
          </div>
        ),
      },
      // User column - FIXED
      {
        id: "user",
        accessorKey: "user_email",
        size: 80,
        minSize: 70,
        maxSize: 120,
        header: () => <Small>{t("feedbackTab.columns.user")}</Small>,
        cell: ({ getValue }) => (
          <div className="line-clamp-2 break-all">
            <Small className="text-gray-600">{getValue() as string}</Small>
          </div>
        ),
      },
      // Time column - FIXED
      {
        id: "time",
        accessorKey: "created_at",
        size: 65,
        minSize: 65,
        maxSize: 80,
        header: () => <Small>{t("feedbackTab.columns.time")}</Small>,
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const isRecent = date > threeDaysAgo;

          return (
            <div className="line-clamp-2" title={date.toLocaleString()}>
              <Small className="text-xs text-gray-500">
                {isRecent
                  ? formatDistanceToNow(date, { addSuffix: true })
                  : format(date, "MMM d, yyyy")}
              </Small>
            </div>
          );
        },
      },
      // Actions column - FIXED
      {
        id: "actions",
        size: 80,
        minSize: 80,
        maxSize: 80,
        enableResizing: false,
        header: () => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Small className="block truncate">
                {t("feedbackTab.columns.save")}
              </Small>
            </TooltipTrigger>
            <TooltipContent>{t("feedbackTab.columns.save")}</TooltipContent>
          </Tooltip>
        ),
        cell: ({ row }) => {
          const record = row.original;

          return (
            <div className="flex items-center justify-start gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 min-w-7 p-0"
                    disabled={resolvingId === record.conversation_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolved?.(record);
                    }}
                  >
                    <Icon
                      name={record.is_resolved ? "CheckCircle2" : "Circle"}
                      size="sm"
                      variant="primary"
                      className={
                        record.is_resolved ? "text-primary" : undefined
                      }
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    record.is_resolved
                      ? "feedbackTab.actions.markUnresolved"
                      : "feedbackTab.actions.markResolved",
                  )}
                </TooltipContent>
              </Tooltip>
              {canSaveAsExample(record) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 min-w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveAsExample?.(record);
                      }}
                    >
                      <Icon
                        name="Bookmark"
                        size="sm"
                        variant="primary"
                        className="hover:fill-primary"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("feedbackTab.actions.saveAsExample")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [t, onSaveAsExample, onToggleResolved, resolvingId],
  );

  const columnResizeMode: ColumnResizeMode = "onChange";

  // Memoize data to prevent infinite re-renders
  // Spread is needed to convert readonly array to mutable for react-table
  // const mutableData = useMemo(() => [...data], [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
  });

  return (
    <div className="bg-white">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-gray-300 hover:bg-gray-100"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="relative h-auto border-r border-gray-300 px-2 py-4 text-left font-bold text-foreground last:border-r-0"
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
                  {/* Resize handle */}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none ${
                        header.column.getIsResizing()
                          ? "bg-primary"
                          : "hover:bg-gray-400"
                      }`}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className="cursor-pointer"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="px-2 py-3"
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    maxWidth: cell.column.columnDef.maxSize,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
