"use client";

/**
 * BACKEND LIMITATIONS as of 26-Aug-2025:
 * - Only supports = operator for exact matching (no LIKE/wildcards)
 * - No support for contains/substring, numeric ranges, or comparison operators
 * - All filters combined with AND logic (no OR support)
 * - Case sensitivity depends on database collation
 *
 * Future enhancements would require backend API changes to:
 * - Accept operator type per filter (equals, contains, gt, lt, between, etc.)
 * - Support OR logic between conditions
 * - Handle NULL values explicitly
 */

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { H3, Detail, Small } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";
import { FilterBadge } from "./FilterBadge";

type TableFiltersProps = Readonly<{
  columns: string[];
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onApplyFilters: (filters?: Record<string, any>) => Promise<void>;
  onResetFilters: () => void;
  disabled?: boolean;
}>;

type FilterItem = Readonly<{
  id: string;
  column: string;
  value: string;
}>;

export function TableFilters({
  columns,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  disabled = false,
}: TableFiltersProps) {
  const { t } = useTranslation("database");
  const [filterItems, setFilterItems] = useState<FilterItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Generate unique stable ID for filter items
  const generateUniqueId = useCallback(() => {
    return `filter-${crypto.randomUUID()}`;
  }, []);

  // Initialize filter items from props filters
  useEffect(() => {
    const items: FilterItem[] = Object.entries(filters).map(
      ([column, value], index) => ({
        id: `filter-init-${index}-${Date.now()}`,
        column,
        value: value as string,
      }),
    );

    // If no filters, show one empty item for user to start with
    if (items.length === 0 && columns.length > 0) {
      setFilterItems([
        {
          id: generateUniqueId(),
          column: columns[0],
          value: "",
        },
      ]);
    } else {
      setFilterItems(items);
    }
  }, [filters, columns, generateUniqueId]);

  const handleFilterItemChange = useCallback(
    (id: string, field: "column" | "value", value: string) => {
      setFilterItems((items) =>
        items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const handleAddFilter = useCallback(() => {
    const nextColumn =
      columns.find((col) => !filterItems.some((item) => item.column === col)) ||
      columns[0] ||
      "";

    setFilterItems([
      ...filterItems,
      {
        id: generateUniqueId(),
        column: nextColumn,
        value: "",
      },
    ]);
  }, [filterItems, columns, generateUniqueId]);

  const handleRemoveFilter = useCallback(
    (id: string) => {
      const item = filterItems.find((f) => f.id === id);
      const isLastFilter = filterItems.length === 1;

      if (isLastFilter && item?.value) {
        // Clear value but keep the filter item for last filter
        handleFilterItemChange(id, "value", "");
      } else if (!isLastFilter) {
        // Remove entire filter item when multiple filters exist
        const newItems = filterItems.filter((item) => item.id !== id);
        setFilterItems(newItems);
      }
      // If last filter with no value, do nothing (button will be disabled)
    },
    [filterItems, handleFilterItemChange],
  );

  const handleBadgeRemove = useCallback(
    async (columnToRemove?: string) => {
      if (!columnToRemove) return;
      const newFilters = { ...filters };
      delete newFilters[columnToRemove];
      onFiltersChange(newFilters);
      await onApplyFilters(newFilters);
    },
    [filters, onFiltersChange, onApplyFilters],
  );

  const handleApply = useCallback(async () => {
    // Convert filter items to Record format, excluding empty values
    const newFilters: Record<string, any> = {};

    for (const item of filterItems) {
      if (item.value && item.column) {
        newFilters[item.column] = item.value;
      }
    }

    // Update parent filters state
    onFiltersChange(newFilters);
    // Close popover immediately for better UX
    setShowFilters(false);
    // Trigger data fetch with the new filters directly
    await onApplyFilters(newFilters);
  }, [filterItems, onFiltersChange, onApplyFilters]);

  const handleClearInputs = useCallback(() => {
    // Clear all input values without applying filters
    setFilterItems((items) => items.map((item) => ({ ...item, value: "" })));
  }, []);

  const handleReset = useCallback(() => {
    // Reset to single empty filter
    if (columns.length > 0) {
      setFilterItems([
        {
          id: generateUniqueId(),
          column: columns[0],
          value: "",
        },
      ]);
    }
    // Call parent reset which will clear filters and refetch data
    onResetFilters();
    setShowFilters(false);
  }, [columns, onResetFilters, generateUniqueId]);

  const handleResetFromBadge = useCallback(async () => {
    handleReset();
  }, [handleReset]);

  const activeFilterCount = Object.keys(filters).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-2">
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            disabled={disabled || columns.length === 0}
          >
            <Icon name="Filter" size="sm" className="mr-2" />
            {t("dataTab.filters")}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-white/20">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px]" align="start">
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <H3 className="text-sm">{t("dataTab.filterTableData")}</H3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearInputs}
                  className="h-auto p-1 font-normal"
                  disabled={
                    disabled ||
                    !filterItems.some((i) => i.value.trim().length > 0)
                  }
                >
                  {t("dataTab.filterActions.clearValues")}
                </Button>
              </div>
              <Detail className="mt-1">
                {t("dataTab.multipleFiltersNote")}
                {". "}
                {t("dataTab.filterActions.containsMatchingNote")}
              </Detail>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filterItems.map((item) => {
                return (
                  <div key={item.id} className="flex items-center gap-2 pt-0.5">
                    <Select
                      value={item.column}
                      onValueChange={(value) =>
                        handleFilterItemChange(item.id, "column", value)
                      }
                    >
                      <SelectTrigger className="w-[160px] h-8 focus:ring-0 focus:outline-none">
                        <SelectValue placeholder={t("dataTab.selectColumn")} />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        {columns.map((col) => {
                          const isDisabled = filterItems.some(
                            (fi) => fi.id !== item.id && fi.column === col,
                          );
                          return (
                            <SelectItem
                              key={col}
                              value={col}
                              disabled={isDisabled}
                            >
                              <span className="font-mono text-xs">{col}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Small className="text-muted-foreground px-1 whitespace-nowrap">
                      {t("dataTab.filterBadge.matches")}
                    </Small>

                    <div className="relative flex-1">
                      <Icon
                        name="Search"
                        size="xxs"
                        variant="muted"
                        className="absolute left-2 top-2.5"
                      />
                      <Input
                        placeholder={t("dataTab.searchValue")}
                        value={item.value}
                        onChange={(e) =>
                          handleFilterItemChange(
                            item.id,
                            "value",
                            e.target.value,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleApply();
                          }
                        }}
                        className="h-8 pl-7"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFilter(item.id)}
                      className="h-8 w-8 p-0"
                      disabled={filterItems.length === 1 && !item.value}
                    >
                      <Icon name="X" size="xxs" />
                    </Button>
                  </div>
                );
              })}

              {filterItems.length < columns.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddFilter}
                  className="w-full h-8"
                >
                  <Icon name="Plus" size="xxs" className="mr-1" />
                  {t("dataTab.addFilter")}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button size="sm" onClick={handleApply} className="flex-1">
                {t("dataTab.filterActions.applyFilters")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                {t("dataTab.filterActions.resetFilters")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active filters as badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {Object.entries(filters).map(([column, value]) => (
            <FilterBadge
              key={column}
              type="filter"
              column={column}
              value={value}
              onRemove={handleBadgeRemove}
            />
          ))}

          <FilterBadge type="reset" onRemove={handleResetFromBadge} />
        </div>
      )}
    </div>
  );
}
