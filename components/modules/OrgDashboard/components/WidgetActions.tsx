"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

type WidgetActionsProps = Readonly<{
  // View the widget's SQL (flips the card). Always available.
  onViewSql: () => void;
  // Edit the widget in a chat. Omitted for viewers; disabled if its datasource is gone.
  onEdit?: () => void;
  datasourceAvailable?: boolean;
  // Remove the widget. Omitted when the user can't edit or during a refresh.
  onRemove?: () => void;
}>;

// Hover kebab menu on a dashboard widget: View SQL, Edit, Delete.
const WidgetActions = ({
  onViewSql,
  onEdit,
  datasourceAvailable = true,
  onRemove,
}: WidgetActionsProps) => {
  const { t } = useTranslation("dashboard");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="EllipsisVertical" size="xs" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onViewSql();
          }}
        >
          <Icon name="Code" size="xs" className="mr-2" />
          {t("orgDashboard.widget.viewSql")}
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem
            disabled={!datasourceAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Icon name="Pencil" size="xs" className="mr-2" />
            {datasourceAvailable
              ? t("orgDashboard.widget.edit")
              : t("orgDashboard.widget.datasourceUnavailable")}
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Icon
              name="Trash2"
              size="xs"
              variant="destructive"
              className="mr-2"
            />
            {t("orgDashboard.widget.remove")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WidgetActions;
