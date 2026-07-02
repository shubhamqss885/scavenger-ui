"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type FilterBadgeProps = Readonly<{
  type: "filter" | "reset";
  column?: string;
  value?: string;
  onRemove: (column?: string) => void | Promise<void>;
  className?: string;
}>;

export function FilterBadge({
  type,
  column,
  value,
  onRemove,
  className,
}: FilterBadgeProps) {
  const { t } = useTranslation("database");
  const baseClasses =
    "text-xs py-0.5 px-2 border-primary bg-transparent hover:bg-primary/5 transition-colors cursor-pointer";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRemove(column);
  };

  const handleReset = async () => {
    await onRemove();
  };

  if (type === "filter" && column && value) {
    return (
      <Badge
        variant="outline"
        className={cn(
          baseClasses,
          "font-normal text-muted-foreground",
          className,
        )}
      >
        <span className="font-mono font-medium">{column}</span>
        <span className="mx-1 ">{t("dataTab.filterBadge.matches")}</span>
        <span className="text-primary font-medium">&quot;{value}&quot;</span>
        <Button
          onClick={handleClick}
          variant="ghost"
          aria-label={t("dataTab.filterBadge.removeFilterAriaLabel", {
            column,
          })}
          className="ml-1 p-1 h-3 w-3"
        >
          <Icon name="X" size="xxs" />
        </Button>
      </Badge>
    );
  }

  if (type === "reset") {
    return (
      <Badge
        variant="outline"
        className={cn(baseClasses, "font-normal", className)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleReset();
          }
        }}
        aria-label={t("dataTab.filterBadge.resetAllFiltersAriaLabel")}
      >
        {t("dataTab.filterBadge.resetAllFilters")}
        <Button
          onClick={handleReset}
          variant="ghost"
          aria-label={t("dataTab.filterBadge.resetAllFiltersAriaLabel")}
          className="ml-1 p-1 h-3 w-3"
        >
          <Icon name="X" size="xxs" />
        </Button>
      </Badge>
    );
  }

  return null;
}
