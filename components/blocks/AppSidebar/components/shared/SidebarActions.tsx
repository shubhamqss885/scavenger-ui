"use client";

import { Link } from "next-view-transitions";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";

// --- CTA Button (expanded sidebar) ---

type CtaButtonProps = Readonly<{
  label: string;
  isAnimating: boolean;
  onClick: () => void;
}>;

export const CtaButton = ({ label, isAnimating, onClick }: CtaButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:translate-x-0.5 focus-visible:outline-none"
    >
      <span
        className={`shrink-0 ${isAnimating ? "animate-[spin-60_300ms_ease-out]" : ""}`}
      >
        <Icon name="Plus" size="xs" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
};

// --- Selection Bar ---

type SelectionBarProps = Readonly<{
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}>;

export const SelectionBar = ({
  count,
  onDelete,
  onCancel,
}: SelectionBarProps) => {
  const { t } = useTranslation("home");

  return (
    <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
      <span className="text-xs text-muted-foreground">
        {t("sidebar.selection.selected", { count })}
      </span>
      <span className="flex-1" />
      <button
        onClick={onDelete}
        className="text-xs text-destructive hover:underline"
      >
        {t("sidebar.projectActions.delete")}
      </button>
      <button
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:underline"
      >
        {t("sidebar.projectActions.cancel")}
      </button>
    </div>
  );
};

// --- Collapsed Action Item (button only, no nav link) ---

type CollapsedActionItemProps = Readonly<{
  icon: IconName;
  tooltip: string;
  onClick: () => void;
}>;

export const CollapsedActionItem = ({
  icon,
  tooltip,
  onClick,
}: CollapsedActionItemProps) => {
  return (
    <div className="group/cta relative flex h-9 w-9 items-center justify-center">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="rounded absolute inset-0 flex items-center justify-center text-muted-foreground hover:bg-muted/50"
          >
            <span className="transition-opacity group-hover/cta:opacity-0">
              <Icon name={icon} size="sm" />
            </span>
            <span className="absolute opacity-0 transition-opacity group-hover/cta:opacity-100">
              <Icon name="Plus" size="sm" />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
};

// --- Collapsed CTA Item ---

type CollapsedCtaItemProps = Readonly<{
  href: string;
  icon: IconName;
  tooltip: string;
  ctaTooltip: string;
  isAnimating: boolean;
  onCtaClick: () => void;
}>;

export const CollapsedCtaItem = ({
  href,
  icon,
  tooltip,
  ctaTooltip,
  isAnimating,
  onCtaClick,
}: CollapsedCtaItemProps) => {
  return (
    <div className="group/cta relative flex h-9 w-9 items-center justify-center">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="absolute inset-0">
            <Link
              href={href}
              className="rounded flex h-full w-full items-center justify-center text-muted-foreground transition-opacity hover:bg-muted/50 group-hover/cta:opacity-0"
            >
              <Icon name={icon} size="sm" />
            </Link>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onCtaClick}
            className="rounded absolute inset-0 flex items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:bg-muted/50 group-hover/cta:opacity-100"
          >
            <span
              className={isAnimating ? "animate-[spin-60_300ms_ease-out]" : ""}
            >
              <Icon name="Plus" size="sm" />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{ctaTooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
};
