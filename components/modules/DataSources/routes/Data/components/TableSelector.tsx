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
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import type { DatabaseTable } from "@/lib/services/organizationDbService";

type TableSelectorProps = Readonly<{
  value?: string;
  onValueChange: (tableName: string) => void;
  disabled?: boolean;
}>;

type ItemRowProps = Readonly<{ item: DatabaseTable }>;

const ItemRow = ({ item }: ItemRowProps) => {
  const { t } = useTranslation("database");
  return (
    <div className="flex items-center gap-1.5">
      <Icon
        name={item.object_type === "view" ? "Eye" : "Table"}
        size="xs"
        className="shrink-0"
      />
      <Small className="text-sm">{item.table_name}</Small>
      {item.row_count !== undefined && (
        <Muted className="text-xs">
          ({item.row_count_approx ? "~" : ""}
          {item.row_count.toLocaleString()} {t("dataTab.rows")})
        </Muted>
      )}
    </div>
  );
};

export const TableSelector = ({
  value,
  onValueChange,
  disabled = false,
}: TableSelectorProps) => {
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

  const selectedItem = useMemo(
    () => allItems.find((item) => item.table_name === value),
    [allItems, value],
  );

  const triggerLabel =
    selectedItem?.object_type === "view"
      ? t("dataTab.view")
      : t("dataTab.table");

  return (
    <div className="flex items-center gap-2">
      <Small className="text-sm">{triggerLabel}:</Small>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id="table-select" className="h-8 w-fit sm:w-[300px]">
          <SelectValue placeholder={t("dataTab.selectTable")} />
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
                  {tables.map((table) => (
                    <SelectItem key={table.table_name} value={table.table_name}>
                      <ItemRow item={table} />
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
                  {views.map((view) => (
                    <SelectItem key={view.table_name} value={view.table_name}>
                      <ItemRow item={view} />
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
