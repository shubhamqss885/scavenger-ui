"use client";

import { useCallback, useState } from "react";
import { DataSourceVaultModule } from "@/components/modules/DataSources/routes/Vault";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import type { FileActions } from "@/components/modules/DataSources/routes/Vault/components/VaultContent";

const ContextPage = () => {
  const { t } = useTranslation("database");
  const [fileActions, setFileActions] = useState<FileActions | null>(null);

  const handleFileActions = useCallback((actions: FileActions | null) => {
    setFileActions(actions);
  }, []);

  return (
    <AdminOnlyRoute>
      <div className="relative flex h-full flex-col">
        {/* Floating toolbar — file actions */}
        {fileActions && (
          <div className="absolute right-4 top-2 z-10 flex items-center gap-1 rounded-lg border bg-background/90 px-1 py-0.5 shadow-sm backdrop-blur-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    disabled={fileActions.readOnly}
                    onClick={fileActions.onEdit}
                  >
                    <Icon name="Pencil" size="sm" className="text-inherit" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {fileActions.readOnly
                  ? t("vault.editComingSoon")
                  : t("vault.edit")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-destructive"
                    disabled={fileActions.readOnly}
                    onClick={fileActions.onDelete}
                  >
                    <Icon name="Trash2" size="sm" className="text-inherit" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {fileActions.readOnly
                  ? t("vault.deleteComingSoon")
                  : t("vault.delete")}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Content — full height */}
        <div className="flex-1 overflow-auto">
          <DataSourceVaultModule onFileActions={handleFileActions} />
        </div>
      </div>
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(ContextPage);
