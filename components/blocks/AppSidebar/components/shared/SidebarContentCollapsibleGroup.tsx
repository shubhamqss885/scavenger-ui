"use client";

import { useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar";
import { Icon, type IconName } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

const INITIAL_COUNT = 10;

type SidebarContentCollapsibleGroupProps = Readonly<{
  title: string;
  icon?: IconName;
  badge?: ReactNode;
  children: ReactNode[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  searchActive?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchClick?: () => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
}>;

export const SidebarContentCollapsibleGroup = ({
  title,
  icon,
  badge,
  children,
  collapsed,
  onToggleCollapse,
  searchActive,
  searchQuery,
  onSearchChange,
  onSearchClick,
  onSearchClear,
  searchPlaceholder,
}: SidebarContentCollapsibleGroupProps) => {
  const { t } = useTranslation("home");
  const [expanded, setExpanded] = useState(false);

  const itemCount = children.length;

  if (itemCount === 0 && !searchActive) return null;

  const visibleChildren = expanded
    ? children
    : children.slice(0, INITIAL_COUNT);
  const hasMore = itemCount > INITIAL_COUNT;

  return (
    <Collapsible open={!collapsed} onOpenChange={() => onToggleCollapse()}>
      <SidebarGroup className="gap-0 p-0">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="group/header flex w-full items-center py-1.5 pl-3 pr-3 text-left transition-colors hover:bg-muted/50">
            {icon && (
              <Icon
                name={icon}
                size="xs"
                className="mr-1.5 shrink-0 text-muted-foreground"
              />
            )}
            <span className="flex-1 text-sm font-medium text-muted-foreground">
              {title}
              {badge && <span className="ml-1.5">{badge}</span>}
            </span>
            {onSearchClick && !searchActive && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onSearchClick();
                  }
                }}
                className="group/search mr-1 p-1 text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover/header:opacity-100"
              >
                <Icon
                  name="Search"
                  size="xs"
                  className="transition-transform group-hover/search:rotate-12 group-hover/search:scale-110"
                />
              </span>
            )}
            <Icon
              name={collapsed ? "ChevronRight" : "ChevronDown"}
              size="xs"
              className="text-muted-foreground"
            />
          </button>
        </CollapsibleTrigger>

        {/* Search */}
        {searchActive && onSearchChange && onSearchClear && (
          <SidebarGroupContent className="relative px-3 py-1">
            <Icon
              name="Search"
              size="xs"
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <SidebarInput
              placeholder={searchPlaceholder}
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchQuery) onSearchClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") onSearchClear();
              }}
              className="h-7 border-0 bg-gray-100 pl-7 pr-7 text-xs focus-visible:ring-0"
              autoFocus
            />
            <button
              onClick={onSearchClear}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size="xs" />
            </button>
          </SidebarGroupContent>
        )}

        {/* Content */}
        <CollapsibleContent>
          <SidebarGroupContent>
            {visibleChildren}
            {itemCount === 0 && searchActive && (
              <div className="px-8 py-2 text-xs text-muted-foreground">
                {t("sidebar.search.noResults", "No results")}
              </div>
            )}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-3 py-1.5 pl-8 text-left text-xs text-muted-foreground hover:underline"
              >
                {expanded
                  ? t("sidebar.search.showLess", "Show less")
                  : t("sidebar.search.showMore", {
                      count: itemCount - INITIAL_COUNT,
                      defaultValue: `Show ${itemCount - INITIAL_COUNT} more`,
                    })}
              </button>
            )}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};
