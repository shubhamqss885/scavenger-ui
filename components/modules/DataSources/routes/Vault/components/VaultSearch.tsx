"use client";

import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";
import { vaultRead } from "@/lib/services/vaultService";
import { useTranslation } from "@/lib/i18n/client";
import { useVault } from "../context/VaultContext";

export const VaultSearchResults = () => {
  const { t } = useTranslation("database");
  const {
    orgdbId,
    searchQuery,
    searchResults,
    searchLoading,
    selectFile,
    filesByDir,
  } = useVault();

  if (searchQuery.trim().length < 1) return null;

  return (
    <div className="border-b bg-muted/30 px-3 py-2">
      {searchLoading ? (
        <div className="flex items-center gap-1.5 py-1">
          <Icon
            name="LoaderCircle"
            size="xs"
            className="animate-spin text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground">
            {t("vault.searching")}
          </span>
        </div>
      ) : searchResults.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("vault.noMatches")}</p>
      ) : (
        <div className="max-h-40 space-y-0.5 overflow-y-auto">
          {searchResults.map((m, i) => (
            <button
              key={i}
              type="button"
              className="rounded flex w-full items-start gap-1.5 p-1.5 text-left text-xs hover:bg-muted"
              onClick={async () => {
                for (const files of Object.values(filesByDir)) {
                  const found = files.find((f) => f.path === m.path);

                  if (found) {
                    selectFile(found);

                    return;
                  }
                }
                try {
                  const file = await vaultRead(orgdbId, m.path);
                  selectFile(file);
                } catch {
                  toast.error(t("vault.failedToReadFile"));
                }
              }}
            >
              <Icon name="FileText" size="xs" className="mt-0.5" />
              <div className="min-w-0">
                <span className="block truncate font-medium">
                  {m.title || m.path}
                </span>
                <span className="line-clamp-1 block text-[10px] text-muted-foreground">
                  {m.match}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
