"use client";

import { cn, formatSingleKey } from "@/lib/utils";

interface KeyboardShortcutProps {
  shortcut: string;
  forMac?: boolean;
  className?: string;
}

const KeyboardShortcut = ({
  shortcut,
  forMac = false,
  className,
}: KeyboardShortcutProps) => {
  // Split shortcut and create individual key buttons
  const keys = shortcut.split("+").map((key) => key.trim());

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center px-2 py-1 text-[10px] leading-none font-medium bg-muted border border-gray-300 rounded-[3px] shadow-sm min-w-[24px] h-6 text-slate-700 font-mono">
            {formatSingleKey(key, forMac)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-slate-700 text-xs font-medium">+</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default KeyboardShortcut;
