"use client";

import { Icon, IconSize, IconVariant } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
  size?: IconSize;
  variant?: IconVariant;
}

export const InfoTooltip = ({
  text,
  size = "xxs",
  variant = "default",
}: InfoTooltipProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <Icon name="Info" size={size} variant={variant} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
