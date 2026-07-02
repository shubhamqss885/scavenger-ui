"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type AgnoToggleProps = Readonly<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}>;

const AgnoToggle = ({
  checked,
  onCheckedChange,
  disabled = false,
}: AgnoToggleProps) => {
  return (
    <label
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-500 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        disabled={disabled}
        className="h-3.5 w-3.5 [&_svg]:h-2.5 [&_svg]:w-2.5"
      />
      <span className="leading-none">Agno</span>
    </label>
  );
};

export default AgnoToggle;
