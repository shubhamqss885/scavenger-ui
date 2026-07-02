"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MultiComboboxProps = Readonly<{
  options: { value: string; label: string }[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}>;

export const MultiCombobox = ({
  options,
  selected,
  onSelectedChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
}: MultiComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
          <div className="ml-2 flex items-center gap-1">
            {selected.length > 0 && (
              <button
                className="rounded-full hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectedChange([]);
                }}
              >
                <Icon
                  name="X"
                  size="xs"
                  className="opacity-50 hover:opacity-100"
                />
              </button>
            )}
            <Icon name="ChevronsUpDown" size="xs" className="opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onSelectedChange(
                      selected.includes(currentValue)
                        ? selected.filter((v) => v !== currentValue)
                        : [...selected, currentValue],
                    );
                  }}
                >
                  <Icon
                    name="Check"
                    size="xs"
                    className={cn(
                      "mr-2",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
