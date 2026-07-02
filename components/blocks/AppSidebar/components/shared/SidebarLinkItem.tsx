"use client";

import { memo } from "react";
import { Link } from "next-view-transitions";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UnreadKind } from "@/components/modules/AgenticChat/chatSession";

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  not_connected: "bg-red-500",
};

type SidebarLinkItemAction = Readonly<{
  label: string;
  onClick: () => void;
  variant?: "destructive";
}>;

type SidebarLinkItemProps = Readonly<{
  href: string;
  label: string;
  icon?: IconName;
  active: boolean;
  actions?: SidebarLinkItemAction[];
  selected?: boolean;
  onSelect?: () => void;
  selectionMode?: boolean;
  badge?: string;
  status?: "connected" | "connecting" | "not_connected";
  statusLabel?: string;
  isRenaming?: boolean;
  renameValue?: string;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
  // Shows a small pulsing dot indicating an in-flight agentic chat run.
  streaming?: boolean;
  streamingLabel?: string;
  // Steady dot when a run finished here while the chat was closed; cleared on open.
  unreadStatus?: UnreadKind;
  unreadLabel?: string;
}>;

export const SidebarLinkItem = memo(
  ({
    href,
    label,
    icon,
    active,
    actions,
    selected,
    onSelect,
    selectionMode,
    badge,
    status,
    statusLabel,
    isRenaming,
    renameValue,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
    streaming,
    streamingLabel,
    unreadStatus,
    unreadLabel,
  }: SidebarLinkItemProps) => {
    const hasActions =
      actions && actions.length > 0 && !selectionMode && !isRenaming;

    return (
      <div
        className={`group/item relative flex w-full items-center transition-all ${
          selected
            ? "bg-primary/5"
            : active
              ? "bg-primary/10"
              : "hover:translate-x-0.5"
        }`}
        style={{ maxWidth: "var(--sidebar-width)" }}
      >
        {selectionMode && onSelect && (
          <button
            onClick={onSelect}
            className="rounded p-0.5 pl-2 hover:bg-muted"
          >
            <div
              className={`rounded flex h-3.5 w-3.5 items-center justify-center border ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
            >
              {selected && (
                <Icon
                  name="Check"
                  size="xs"
                  className="text-primary-foreground"
                />
              )}
            </div>
          </button>
        )}
        {isRenaming ? (
          <div
            className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1 ${selectionMode ? "pl-2" : "pl-6"}`}
          >
            <input
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameSubmit?.();
                if (e.key === "Escape") onRenameCancel?.();
              }}
              onBlur={onRenameSubmit}
              className="rounded min-w-0 flex-1 border bg-white px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        ) : (
          <Link
            href={href}
            prefetch={true}
            className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 ${
              selectionMode ? "pl-2" : "pl-6"
            } ${active ? "font-medium text-primary" : "text-gray-600"}`}
          >
            {icon && (
              <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <Icon name={icon} size="xs" className="text-current" />
                {status && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {statusLabel ?? status.replace("_", " ")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            )}
            {!icon && status && (
              <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {statusLabel ?? status.replace("_", " ")}
                  </TooltipContent>
                </Tooltip>
              </span>
            )}
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate text-sm">{label}</span>
              {badge && (
                <span
                  className="shrink-0 text-muted-foreground/30"
                  title="Default"
                >
                  <Icon
                    name="Star"
                    size="xs"
                    className="h-2.5 w-2.5 fill-current"
                  />
                </span>
              )}
              {streaming && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                    </span>
                  </TooltipTrigger>
                  {streamingLabel && (
                    <TooltipContent side="right">
                      {streamingLabel}
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              {!streaming && unreadStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      aria-label={unreadLabel}
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        unreadStatus === "error"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                    />
                  </TooltipTrigger>
                  {unreadLabel && (
                    <TooltipContent side="right">{unreadLabel}</TooltipContent>
                  )}
                </Tooltip>
              )}
            </span>
          </Link>
        )}
        {hasActions && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="group/dots mr-1 shrink-0 p-2 text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover/item:opacity-100"
                onClick={(e) => e.preventDefault()}
              >
                <span className="flex items-center gap-[3px]">
                  <span
                    className="h-[3px] w-[3px] rounded-full bg-current group-hover/dots:animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-[3px] w-[3px] rounded-full bg-current group-hover/dots:animate-bounce"
                    style={{ animationDelay: "100ms" }}
                  />
                  <span
                    className="h-[3px] w-[3px] rounded-full bg-current group-hover/dots:animate-bounce"
                    style={{ animationDelay: "200ms" }}
                  />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={-6}
              className="w-40"
            >
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  className={
                    action.variant === "destructive"
                      ? "text-destructive focus:text-destructive"
                      : ""
                  }
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  },
);
SidebarLinkItem.displayName = "SidebarLinkItem";
