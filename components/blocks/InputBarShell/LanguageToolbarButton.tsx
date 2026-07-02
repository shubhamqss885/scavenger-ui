"use client";

import React from "react";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";
import { languages } from "@/lib/i18n/settings";
import { useUserContext } from "@/lib/context/UserDataContext";

type LanguageToolbarButtonProps = Readonly<{
  align?: "start" | "end";
  disabled?: boolean;
}>;

const LanguageToolbarButton = ({
  align = "start",
  disabled = false,
}: LanguageToolbarButtonProps) => {
  const { i18n } = useTranslation("home");
  const { t: tHome } = useTranslation("home");
  const { userProfile, updateUserProfile } = useUserContext();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="inline-flex h-7 items-center justify-center rounded-md px-2 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800"
            >
              <Icon
                name="Languages"
                size="xs"
                className="text-slate-800 dark:text-slate-100"
              />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tHome(`sidebar.languages.${i18n.language}`)}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={align} className="min-w-[8rem]">
        {languages.map((code) => (
          <DropdownMenuCheckboxItem
            key={code}
            checked={i18n.language === code}
            onCheckedChange={async () => {
              await i18n.changeLanguage(code);
              if (userProfile && updateUserProfile) {
                await updateUserProfile({ locale: code });
              }
            }}
          >
            {tHome(`sidebar.languages.${code}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToolbarButton;
