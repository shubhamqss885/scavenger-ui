"use client";

import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type WebSearchToggleButtonProps = Readonly<{
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}>;

const WebSearchToggleButton = ({
  enabled,
  onToggle,
  disabled = false,
}: WebSearchToggleButtonProps) => {
  const { t } = useTranslation("agentic-chat");
  const label = enabled ? t("chat.webSearchEnabled") : t("chat.webSearch");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={enabled}
          aria-label={label}
          className={cn(
            "inline-flex h-7 items-center justify-center rounded-md px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            enabled
              ? "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          <Icon
            name="Globe"
            size="xs"
            className={cn(
              "transition-colors",
              enabled ? "text-primary" : "text-current",
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
};

export default WebSearchToggleButton;
