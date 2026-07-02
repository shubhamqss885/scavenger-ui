"use client";

import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { useVault, VAULT_DIRECTORIES } from "../context/VaultContext";
import { VaultSearchResults } from "./VaultSearch";
import { VaultDirectoryGroup } from "./VaultDirectoryGroup";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

export const VaultSidebar = () => {
  const { t } = useTranslation("database");
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const {
    showAudit,
    setShowAudit,
    setDraft,
    clearSelection,
    loadAuditHistory,
    searchQuery,
    setSearchQuery,
    clearSearch,
  } = useVault();

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Search bar — always visible */}
      <div className="flex h-12 items-center border-b px-2.5 py-1.5">
        <div className="relative flex-1">
          <Icon
            name="Search"
            size="xs"
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 select-none opacity-50"
          />
          <Input
            className="h-8 bg-background pl-7 pr-7 text-xs shadow-none"
            placeholder={t("vault.searchContextPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
            >
              <Icon name="X" size="xs" />
            </Button>
          )}
        </div>
      </div>

      {/* Search results */}
      <VaultSearchResults />

      {/* Directory tree */}
      {VAULT_DIRECTORIES.map((dir) => (
        <VaultDirectoryGroup key={dir} directory={dir} />
      ))}

      {/* Audit row */}
      {isFeatureEnabled(FEATURE_FLAGS.VIEW_VAULT_AUDIT) && (
        <div className="border-t pt-1">
          <Button
            variant="ghost"
            className={cn(
              "flex h-auto w-full items-center justify-start gap-1.5 rounded-none px-3 py-2 text-left transition-colors",
              showAudit
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/50",
            )}
            onClick={() => {
              setShowAudit(true);
              setDraft(null);
              clearSelection();
              loadAuditHistory();
            }}
          >
            <Icon name="History" size="xs" className="text-inherit" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("vault.audit")}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
