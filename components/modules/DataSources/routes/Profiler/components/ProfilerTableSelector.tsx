"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { Small, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { DatabaseTable } from "@/lib/services/organizationDbService";
import type { BatchTableStatus } from "@/components/modules/DataSources/types";

type ProfilerTableSelectorProps = Readonly<{
  value?: string;
  onValueChange: (tableName: string) => void;
  disabled?: boolean;
  profiledTables: Set<string>;
  batchStatus?: Record<string, BatchTableStatus>;
  isBatchProfiling?: boolean;
}>;

type ProfilerItemRowProps = Readonly<{
  item: DatabaseTable;
  profiledTables: Set<string>;
  batchStatus?: BatchTableStatus;
}>;

const ProfilerItemRow = ({
  item,
  profiledTables,
  batchStatus,
}: ProfilerItemRowProps) => {
  const isRunning = batchStatus?.status === "running";
  const isDone =
    batchStatus?.status === "done" || profiledTables.has(item.table_name);
  const isError = batchStatus?.status === "error";
  const isSkipped = batchStatus?.status === "skipped";

  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <Icon name="Loader2" size="xxs" className="animate-spin text-primary" />
      ) : isDone ? (
        <Icon name="CheckCircle" size="xxs" className="text-green-500" />
      ) : isError ? (
        <Icon name="XCircle" size="xxs" className="text-destructive" />
      ) : isSkipped ? (
        <Icon name="AlertTriangle" size="xxs" className="text-yellow-600" />
      ) : (
        <Icon name="Circle" size="xxs" className="text-gray-300" />
      )}
      <Small
        className={cn(
          "text-sm",
          isRunning && "text-primary",
          isError && "text-destructive",
        )}
      >
        {item.table_name}
      </Small>
    </div>
  );
};

export const ProfilerTableSelector = ({
  value,
  onValueChange,
  disabled = false,
  profiledTables,
  batchStatus = {},
  isBatchProfiling = false,
}: ProfilerTableSelectorProps) => {
  const { t } = useTranslation("database");
  const { database } = useDatabaseDescription();

  const { allItems, tables, views } = useMemo(() => {
    const sorted = (database?.tables ?? [])
      .filter((item) => !!item.table_name)
      .sort((a, b) => a.table_name.localeCompare(b.table_name));
    const result = sorted.reduce<{
      tables: DatabaseTable[];
      views: DatabaseTable[];
    }>(
      (acc, item) =>
        item.object_type === "view"
          ? { ...acc, views: [...acc.views, item] }
          : { ...acc, tables: [...acc.tables, item] },
      { tables: [], views: [] },
    );
    return { allItems: sorted, ...result };
  }, [database?.tables]);

  const isDisabled = disabled || isBatchProfiling;

  return (
    <div className="flex items-center gap-2">
      <Small className="text-sm font-medium">
        {t("profiler.selectTable")}:
      </Small>
      <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
        <SelectTrigger className="h-8 w-fit sm:w-[300px]">
          <SelectValue
            placeholder={t("profiler.selectTablePlaceholder")}
            className="placeholder:text-xs"
          />
        </SelectTrigger>
        <SelectContent>
          {allItems.length === 0 ? (
            <div className="px-2 py-1.5">
              <Muted>{t("dataTab.noTablesAvailable")}</Muted>
            </div>
          ) : (
            <>
              {tables.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon name="Table" size="xs" />
                    {t("dataTab.tables")}
                  </SelectLabel>
                  {tables.map((item) => (
                    <SelectItem key={item.table_name} value={item.table_name}>
                      <ProfilerItemRow
                        item={item}
                        profiledTables={profiledTables}
                        batchStatus={batchStatus[item.table_name]}
                      />
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {views.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon name="Eye" size="xs" />
                    {t("dataTab.views")}
                  </SelectLabel>
                  {views.map((item) => (
                    <SelectItem key={item.table_name} value={item.table_name}>
                      <ProfilerItemRow
                        item={item}
                        profiledTables={profiledTables}
                        batchStatus={batchStatus[item.table_name]}
                      />
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
