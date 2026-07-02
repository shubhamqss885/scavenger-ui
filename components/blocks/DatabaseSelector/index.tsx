import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { P, Detail } from "@/components/ui/typography";
import { useOrganizationDbData } from "@/lib/context/OrganizationDbProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatabaseDropdownItem } from "./DatabaseDropdownItem";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DatabaseSelectorProps {
  value: string;
  onChange: (databaseId: string) => void;
  className?: string;
  iconClassName?: string;
  align?: "center" | "start" | "end";
  showSelectedLabel?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DatabaseSelector({
  value,
  onChange,
  className,
  iconClassName = "h-3.5 w-3.5 text-primary",
  align = "center",
  showSelectedLabel = false,
  isLoading = false,
  disabled = false,
}: DatabaseSelectorProps) {
  const { organizationDbs, loading: isLoadingOrganizationDbs } =
    useOrganizationDbData();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isText2SqlOnlyModeEnabled = isFeatureEnabled(
    FEATURE_FLAGS.TEXT_TO_SQL_ONLY_MODE,
  );
  const { t } = useTranslation("agentic-chat");
  const { t: tDatabase } = useTranslation("database");

  const selectedDatabase = organizationDbs?.find((db) => db.orgdb_id === value);

  // Sort a *copy* — organizationDbs is the context state array, so sorting it
  // in place would mutate React state on every render.
  const sortedDbs = useMemo(
    () =>
      [...organizationDbs].sort((a, b) => {
        const nameA = a.display_name || a.orgdb_name_decrypted || "";
        const nameB = b.display_name || b.orgdb_name_decrypted || "";

        // Un-named rows (legacy NULL display_name) sort to the bottom rather
        // than clustering at the top as "". Removable once display_name is
        // backfilled.
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;
        return nameA.localeCompare(nameB);
      }),
    [organizationDbs],
  );

  // Determine label to show in the selector button
  let selectedLabel: string | undefined;
  const isSelectorLoading = isLoading || isLoadingOrganizationDbs;

  if (isLoading || isLoadingOrganizationDbs) {
    selectedLabel = t("database.loading");
  } else if (selectedDatabase) {
    // orgdb_name_decrypted is only populated once a db's detail page is opened
    // (decryption is lazy), so lists lean on display_name with a placeholder.
    selectedLabel =
      selectedDatabase.display_name ||
      selectedDatabase.orgdb_name_decrypted ||
      "Database";
  } else if (value === "") {
    selectedLabel = t("database.selectDatabase");
  } else {
    // Database ID provided but not found (deleted or invalid)
    selectedLabel = t("database.selectDatabase");
  }

  const isDatabaseSelected = Boolean(value);

  const handleDatabaseChange = (databaseId: string) => {
    const normalizedDbId = databaseId === "none" ? "" : databaseId;

    // Optimization: Don't call onChange if selecting same database
    if (normalizedDbId === value) {
      return;
    }

    onChange(normalizedDbId);
  };

  const renderNoneOption = () => {
    if (isText2SqlOnlyModeEnabled) return null;

    return (
      <DropdownMenuItem
        onClick={() => handleDatabaseChange("none")}
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-slate-500 hover:bg-slate-100"
      >
        <div className="flex h-4 w-4 items-center justify-center">
          {value === "" && (
            <Icon name="Check" size="sm" className="text-slate-500" />
          )}
        </div>
        <P className="text-xs font-medium">{t("database.none")}</P>
      </DropdownMenuItem>
    );
  };

  const selectorButton = (
    <Button
      variant="outline"
      size={showSelectedLabel ? "default" : "icon"}
      disabled={isSelectorLoading}
      className={cn(
        "transition-colors",
        showSelectedLabel
          ? "flex h-8 max-w-[180px] gap-1 rounded-sm px-1.5 pr-2.5 font-normal"
          : "h-8 w-8 rounded-[4px] p-0",
        showSelectedLabel &&
          isDatabaseSelected &&
          !isLoading &&
          "border border-primary",
        className,
      )}
    >
      <Icon name="Database" className={iconClassName} />
      {showSelectedLabel && (
        <>
          <span className="truncate text-xs font-medium text-slate-500">
            {selectedLabel}
          </span>
          {isSelectorLoading ? (
            <Icon
              name="Loader2"
              size="xxs"
              className="animate-spin"
              variant="primary"
              aria-label={t("database.loadingDatabase")}
            />
          ) : (
            !disabled && (
              <Icon name="ChevronDown" size="xxs" className="text-slate-500" />
            )
          )}
        </>
      )}
    </Button>
  );

  // Render disabled state with tooltip
  if (disabled) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{selectorButton}</TooltipTrigger>
          <TooltipContent>
            <Detail className="text-white">
              {tDatabase("selector.tooltips.locked")}
            </Detail>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{selectorButton}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[200px] pl-1 pr-0">
        <ScrollArea className="truncate [&>[data-radix-scroll-area-viewport]]:max-h-[40vh]">
          {sortedDbs.map((db) => (
            <DatabaseDropdownItem
              key={db.orgdb_id}
              db={db}
              value={value}
              onChange={handleDatabaseChange}
            />
          ))}
          {renderNoneOption()}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
