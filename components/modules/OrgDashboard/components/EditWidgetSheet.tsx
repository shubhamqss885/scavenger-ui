"use client";

import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import type { DashboardWidget } from "@/lib/services/orgDashboardService";
import type { WidgetEditContext } from "@/components/modules/AgenticChat/types";

// Lazy-load so the chat stays out of the dashboard route's first-load JS.
const EmbeddedEditChat = dynamic(() => import("./EmbeddedEditChat"), {
  ssr: false,
});

type EditWidgetSheetProps = Readonly<{
  projectId: string | null;
  widget: DashboardWidget | null;
  edit: WidgetEditContext | null;
  onClose: () => void;
  onDeleteChat: () => void;
}>;

const EditWidgetSheet = ({
  projectId,
  widget,
  edit,
  onClose,
  onDeleteChat,
}: EditWidgetSheetProps) => {
  const { t } = useTranslation("dashboard");
  const open = !!projectId && !!widget;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        // Don't auto-focus the header's delete button on open — its tooltip
        // (shadcn opens on focus, not just hover) would otherwise pop on open.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b px-4 py-3 pr-12 text-left">
          <SheetTitle className="min-w-0 truncate text-sm font-medium">
            {t("orgDashboard.widget.editingWidget", {
              title: widget?.title ?? "",
            })}
          </SheetTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                onClick={onDeleteChat}
              >
                <Icon name="Trash2" size="xs" variant="destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("orgDashboard.widget.deleteChat")}
            </TooltipContent>
          </Tooltip>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          {projectId && edit && (
            <EmbeddedEditChat projectId={projectId} edit={edit} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditWidgetSheet;
