"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TypeaheadOption = Readonly<{
  value: string;
  label: string;
  // Label + search aliases, e.g. "Tuesday Tue 2" so "2", "tue", "Tuesday" all match.
  searchText: string;
}>;

type Props = Readonly<{
  value: string;
  options: TypeaheadOption[];
  onValueChange: (next: string) => void;
  searchPlaceholder: string;
  emptyText: string;
}>;

/**
 * Single-select combobox where the *input itself* doubles as the search field.
 * Use this when you want the user to type-to-filter inline, with the dropdown
 * appearing below — distinct from `multi-combobox.tsx` which uses a separate
 * button trigger and an in-popover search.
 *
 * Substring match on `searchText`. Keyboard: ↑↓ navigate, Enter selects, Esc
 * closes. Dropdown flips upward when there's no room below.
 */
export const TypeaheadCombobox = ({
  value,
  options,
  onValueChange,
  searchPlaceholder,
  emptyText,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  // Flips up when there's no room below — relevant in tight modals on mobile.
  const [direction, setDirection] = useState<"down" | "up">("down");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);
  // Links input → listbox → active option for screen readers.
  const listboxId = useId();
  const optionId = (idx: number) => `${listboxId}-opt-${idx}`;

  const openDropdown = () => {
    const rect = inputRef.current?.getBoundingClientRect();

    if (rect) {
      // 280px ≈ max-h-64 (256) + mt-1 + border + buffer.
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < 280 && rect.top > spaceBelow ? "up" : "down");
    }
    setOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return options;
    return options.filter((o) => o.searchText.toLowerCase().includes(q));
  }, [options, query]);

  // Filtering shrinks the list — reset so the highlight stays in bounds.
  useEffect(() => {
    setHighlighted(0);
  }, [query, open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (optValue: string) => {
    onValueChange(optValue);
    close();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openDropdown();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const pick = filtered[highlighted];

      if (pick) handleSelect(pick.value);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={open ? query : (selected?.label ?? "")}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) openDropdown();
        }}
        onFocus={openDropdown}
        // Defer close so a list item's onClick lands before blur unmounts it.
        onBlur={() => setTimeout(close, 120)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          open && filtered.length > 0 ? optionId(highlighted) : undefined
        }
        className="pr-8"
      />
      <Icon
        name="ChevronsUpDown"
        size="xs"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50"
      />
      {open && (
        <ul
          id={listboxId}
          className={cn(
            "absolute left-0 right-0 z-50 max-h-64 overflow-auto rounded-md border bg-popover py-1 shadow-md",
            direction === "down" ? "top-full mt-1" : "bottom-full mb-1",
          )}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.value}
                id={optionId(idx)}
                role="option"
                aria-selected={value === opt.value}
                // Keep focus on the input so onBlur→close doesn't beat onClick.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center px-3 py-1.5 text-sm",
                  idx === highlighted && "bg-accent",
                )}
              >
                <Icon
                  name="Check"
                  size="xs"
                  className={cn(
                    "mr-2",
                    value === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
