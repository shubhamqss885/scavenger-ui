"use client";

import React, { useEffect, useRef } from "react";
import { Icon, IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

export type SlashCommand = {
  command: string;
  i18nKey: string;
  icon: IconName;
};

const SLASH_COMMANDS: SlashCommand[] = [
  { command: "/chat", i18nKey: "chat", icon: "MessageSquare" },
  { command: "/interrogate", i18nKey: "interrogate", icon: "BrainCircuit" },
  { command: "/golden", i18nKey: "golden", icon: "Star" },
  { command: "/understand", i18nKey: "understand", icon: "Lightbulb" },
  { command: "/reset", i18nKey: "reset", icon: "RefreshCw" },
];

type SlashCommandMenuProps = Readonly<{
  filter: string;
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}>;

export function filterSlashCommands(
  commands: SlashCommand[],
  filter: string,
  t: (key: string) => string,
) {
  const query = filter.slice(1).toLowerCase();
  return commands.filter((cmd) => {
    const label = t(`slashCommands.${cmd.i18nKey}.label`).toLowerCase();
    return cmd.command.toLowerCase().includes(query) || label.includes(query);
  });
}

const SlashCommandMenu = ({
  filter,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) => {
  const { t } = useTranslation("agentic-chat");
  const menuRef = useRef<HTMLDivElement>(null);
  const filtered = filterSlashCommands(SLASH_COMMANDS, filter, t);

  // Scroll selected item into view
  useEffect(() => {
    const el = menuRef.current?.querySelector("[data-selected='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-lg border border-sidebar-border bg-white shadow-lg dark:bg-slate-900"
    >
      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t("slashCommands.heading")}
      </div>
      {filtered.map((cmd, idx) => (
        <button
          key={cmd.command}
          type="button"
          data-selected={idx === selectedIndex}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd);
          }}
          className={cn(
            "flex w-full items-center gap-3 px-2.5 py-2 text-left text-sm transition-colors",
            idx === selectedIndex
              ? "bg-slate-100 dark:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
          )}
        >
          <Icon
            name={cmd.icon}
            size="sm"
            className="shrink-0 text-slate-500 dark:text-slate-400"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {t(`slashCommands.${cmd.i18nKey}.label`)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {cmd.command}
              </span>
            </div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {t(`slashCommands.${cmd.i18nKey}.description`)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SlashCommandMenu;

export { SLASH_COMMANDS };
