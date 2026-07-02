import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Small } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icon";

export function SelectModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  };

  const renderTheme = (theme: string | undefined) => {
    switch (theme) {
      case "light":
        return (
          <div className="h-3 flex justify-between gap-2 items-center">
            <Icon name="Sun" className="mr-auto" size="xs" />
            <Small className="text-xs">Light</Small>
          </div>
        );
      case "dark":
        return (
          <div className="h-3 flex justify-between gap-2 items-center">
            <Icon name="Moon" className="mr-auto" size="xs" />
            <Small className="text-xs">Dark</Small>
          </div>
        );
      case "system":
        return (
          <div className="h-3 flex justify-between gap-2 items-center">
            <Icon name="Monitor" className="mr-auto" size="xs" />
            <Small className="text-xs">System</Small>
          </div>
        );
      default:
        return (
          <div className="h-3 flex justify-between gap-2 items-center">
            <Icon name="Monitor" className="mr-auto" size="xs" />
            <Small className="text-xs">System</Small>
          </div>
        );
    }
  };

  return (
    <Select onValueChange={handleThemeChange}>
      <SelectTrigger className="ml-auto w-[85px] py-1 px-1 h-5">
        <SelectValue placeholder={renderTheme(theme)} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {/* <SelectLabel>Themes</SelectLabel> */}
          <SelectItem value="light">{renderTheme("light")}</SelectItem>
          <SelectItem value="dark" className="flex justify-between">
            {renderTheme("dark")}
          </SelectItem>
          <SelectItem value="system" className="flex justify-between">
            {renderTheme("system")}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SelectModeToggle;
