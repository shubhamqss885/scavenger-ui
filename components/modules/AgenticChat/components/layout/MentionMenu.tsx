"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type MentionableMember = {
  id: string;
  name: string | null;
  email: string | null;
  sub: string;
};

type MentionMenuProps = Readonly<{
  members: MentionableMember[];
  filter: string;
  selectedIndex: number;
  onSelect: (member: MentionableMember) => void;
}>;

export function filterMembers(
  members: MentionableMember[],
  filter: string,
): MentionableMember[] {
  const query = filter.toLowerCase();
  return members.filter((m) => {
    const name = (m.name || "").toLowerCase();
    const email = (m.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });
}

const MentionMenu = ({
  members,
  filter,
  selectedIndex,
  onSelect,
}: MentionMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const filtered = filterMembers(members, filter);

  useEffect(() => {
    const el = menuRef.current?.querySelector("[data-selected='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-72 overflow-y-auto overflow-x-hidden rounded-lg border border-sidebar-border bg-white shadow-lg dark:bg-slate-900"
    >
      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Mention member
      </div>
      {filtered.map((member, idx) => (
        <button
          key={member.id}
          type="button"
          data-selected={idx === selectedIndex}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
          className={cn(
            "flex w-full items-center gap-3 px-2.5 py-2 text-left text-sm transition-colors",
            idx === selectedIndex
              ? "bg-slate-100 dark:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="User" size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-slate-800 dark:text-slate-100">
              {member.name || member.email || "Unknown"}
            </div>
            {member.email && member.name && (
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {member.email}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default MentionMenu;
