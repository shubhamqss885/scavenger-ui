"use client";

import { useState } from "react";
import { useContextSelector } from "use-context-selector";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgenticChatContext } from "@/components/modules/AgenticChat/AgenticChatContext";
import {
  updateWidget,
  addWidget,
  type DashboardWidget,
} from "@/lib/services/orgDashboardService";
import { useTranslation } from "@/lib/i18n/client";

type EditWidgetActionsProps = Readonly<{
  widgetType: "chart" | "table";
  title: string;
  sqlQuery: string;
  cachedResult: unknown;
  orgdbId: string;
}>;

// Update / Add actions on a chat result during a widget edit session. Update
// replaces the original widget in place; Add pins a new one to the same
// dashboard. Both push live via editContext (no refetch).
const EditWidgetActions = ({
  widgetType,
  title,
  sqlQuery,
  cachedResult,
  orgdbId,
}: EditWidgetActionsProps) => {
  const editContext = useContextSelector(
    AgenticChatContext,
    (ctx) => ctx?.editContext,
  );
  const { t } = useTranslation("dashboard");
  const [busy, setBusy] = useState<"update" | "add" | null>(null);

  if (!editContext) return null;

  // Shared busy/try/catch shell; actions differ only in `perform` + toast keys.
  const runAction = async (
    kind: "update" | "add",
    perform: () => Promise<void>,
    successKey: string,
    errorKey: (err: any) => string,
  ) => {
    if (busy) return;
    setBusy(kind);
    try {
      await perform();
      toast.success(t(successKey));
    } catch (err: any) {
      toast.error(t(errorKey(err)));
    } finally {
      setBusy(null);
    }
  };

  const handleUpdate = () =>
    runAction(
      "update",
      async () => {
        const updated = await updateWidget(
          editContext.dashboardId,
          editContext.widgetId,
          {
            widget_type: widgetType,
            title,
            sql_query: sqlQuery,
            cached_result: cachedResult,
          },
        );
        editContext.onWidgetUpdated(updated);
      },
      "orgDashboard.widget.updated",
      (err) =>
        err?.response?.status === 404
          ? "orgDashboard.widget.updateGone"
          : "orgDashboard.widget.updateFailed",
    );

  const handleAdd = () =>
    runAction(
      "add",
      async () => {
        const { widget_id, position } = await addWidget(
          editContext.dashboardId,
          {
            orgdb_id: orgdbId,
            widget_type: widgetType,
            title,
            sql_query: sqlQuery,
            cached_result: cachedResult,
          },
        );
        editContext.onWidgetAdded({
          widget_id,
          orgdb_id: orgdbId,
          widget_type: widgetType,
          title,
          sql_query: sqlQuery,
          cached_result: (cachedResult ??
            null) as DashboardWidget["cached_result"],
          // BE recomputes chart_config on add; null here falls back to
          // cached_result for the spec until the next refetch.
          chart_config: null,
          position,
          last_refreshed_at: new Date().toISOString(),
          refresh_error: null,
        });
      },
      "orgDashboard.widget.added",
      () => "orgDashboard.widget.addFailed",
    );

  return (
    <div className="ml-2 flex shrink-0 items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleUpdate}
            disabled={busy !== null}
            className="group/upd flex shrink-0 items-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              name={busy === "update" ? "Loader2" : "Upload"}
              size="xxs"
              className={cn(
                "text-slate-400 group-hover/upd:text-primary dark:text-slate-500",
                busy === "update" && "animate-spin",
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("orgDashboard.widget.update")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleAdd}
            disabled={busy !== null}
            className="group/add flex shrink-0 items-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              name={busy === "add" ? "Loader2" : "Plus"}
              size="xxs"
              className={cn(
                "text-slate-400 group-hover/add:text-primary dark:text-slate-500",
                busy === "add" && "animate-spin",
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("orgDashboard.widget.add")}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default EditWidgetActions;
