"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { useVault, VAULT_DIRECTORIES } from "../context/VaultContext";
import type { VaultFile } from "@/lib/services/vaultService";

const OVERLAY_MAP: Record<string, "rules" | "examples"> = {
  rules: "rules",
  golden_queries: "examples",
};

type Props = Readonly<{
  directory: (typeof VAULT_DIRECTORIES)[number];
}>;

export const VaultDirectoryGroup = ({ directory }: Props) => {
  const { t } = useTranslation("database");
  const {
    filesByDir,
    collapsedDirs,
    toggleDir,
    selectedFile,
    editingFile,
    draft,
    handleNewFile,
    selectFile,
    isReadOnlyDir,
    overlayPanel,
    toggleOverlay,
  } = useVault();

  const files = filesByDir[directory] ?? [];
  const count = files.length;
  const isCollapsed = collapsedDirs.has(directory);
  const hasDraft = draft?.directory === directory;
  const isCreating = draft !== null;
  const readOnly = isReadOnlyDir(directory);
  const overlayKey = OVERLAY_MAP[directory];
  const isOverlayActive = overlayKey && overlayPanel === overlayKey;

  const getFilename = (file: VaultFile) =>
    file.path?.split("/").pop() ?? file.path ?? "";

  const hasItems = files.length > 0 || hasDraft;
  const chevronIcon = hasItems
    ? isCollapsed
      ? "ChevronRight"
      : "ChevronDown"
    : null;

  return (
    <div>
      {/* Directory header */}
      <div
        className={cn(
          "group/dir flex items-center transition-colors hover:bg-muted/100",
          isOverlayActive && "bg-primary/10",
        )}
      >
        <Button
          variant="ghost"
          className="flex h-auto flex-1 items-center justify-start gap-1.5 rounded-none px-3 py-2.5 text-left"
          onClick={() => hasItems && toggleDir(directory)}
        >
          {chevronIcon ? (
            <Icon name={chevronIcon} size="xs" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span
            className={cn(
              "truncate text-xs font-semibold uppercase tracking-wider",
              isOverlayActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {t(`vault.directories.${directory}`, {
              defaultValue: directory.replace(/_/g, " "),
            })}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground/70">
            {count}
          </span>
        </Button>
        {readOnly ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "mr-1.5 h-6 w-6 shrink-0 transition-opacity",
              isOverlayActive
                ? "opacity-100"
                : "opacity-0 group-hover/dir:opacity-100",
            )}
            onClick={() => overlayKey && toggleOverlay(overlayKey)}
          >
            <Icon name="Eye" size="xxs" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="mr-1.5 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover/dir:opacity-100"
            onClick={() => handleNewFile(directory)}
          >
            <Icon name="Plus" size="xxs" />
          </Button>
        )}
      </div>

      {/* File list + draft */}
      {!isCollapsed && (files.length > 0 || hasDraft) && (
        <div>
          {files.map((file) => {
            const filename = getFilename(file);
            const isSelected =
              (selectedFile?.path === file.path && !isCreating) ||
              editingFile?.path === file.path;

            return (
              <Button
                key={file.path}
                variant="ghost"
                className={cn(
                  "flex h-auto w-full items-center justify-start gap-2 rounded-none px-3 py-1.5 pl-8 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-gray-600 hover:bg-muted/50",
                )}
                onClick={() => selectFile(file)}
              >
                <Icon name="FileText" size="xs" className="text-inherit" />
                <span className="truncate text-xs">
                  {file.title || filename.replace(".md", "")}
                </span>
              </Button>
            );
          })}
          {hasDraft && (
            <div
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 pl-8 text-sm",
                "bg-primary/10 font-medium text-primary",
              )}
            >
              <Icon name="FileText" size="xs" className="text-inherit" />
              <span className="truncate text-xs italic">
                {draft.title || t("vault.newFile")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
