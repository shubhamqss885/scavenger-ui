"use client";

import { useContextSelector } from "use-context-selector";
import { AgenticChatContext } from "@/components/modules/AgenticChat/AgenticChatContext";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import PinToDashboardModal from "@/components/blocks/PinToDashboardModal";
import EditWidgetActions from "@/components/blocks/EditWidgetActions";

type WidgetResultActionsProps = Readonly<{
  widgetType: "chart" | "table";
  title: string;
  sqlQuery: string;
  cachedResult: unknown;
  orgdbId: string;
}>;

const WidgetResultActions = (props: WidgetResultActionsProps) => {
  const { t } = useTranslation("agentic-chat");
  const editContext = useContextSelector(
    AgenticChatContext,
    (ctx) => ctx?.editContext,
  );

  if (editContext) return <EditWidgetActions {...props} />;

  return (
    <Tooltip>
      <PinToDashboardModal
        widgetType={props.widgetType}
        title={props.title}
        sqlQuery={props.sqlQuery}
        cachedResult={props.cachedResult}
        orgdbId={props.orgdbId}
        trigger={
          <TooltipTrigger asChild>
            <button className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <Icon name="Pin" size="xxs" className="text-inherit" />
            </button>
          </TooltipTrigger>
        }
      />
      <TooltipContent side="top">{t("actions.pinToDashboard")}</TooltipContent>
    </Tooltip>
  );
};

export default WidgetResultActions;
