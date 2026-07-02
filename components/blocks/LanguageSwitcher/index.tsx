"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { languages } from "@/lib/i18n/settings";
import { useUserContext } from "@/lib/context/UserDataContext";

interface LanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

const LanguageSwitcher = ({
  variant = "ghost",
  size = "sm",
}: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation("home");
  const { userProfile, updateUserProfile } = useUserContext();

  const handleLanguageChange = async (languageCode: string): Promise<void> => {
    try {
      // Change language in i18n
      await i18n.changeLanguage(languageCode);

      // Update user profile with new language preference if authenticated
      if (userProfile && updateUserProfile) {
        await updateUserProfile({ locale: languageCode });
      } else {
        // Profile not available (e.g., verify page) - store pending preference
        localStorage.setItem("pendingLocale", languageCode);
      }
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Icon name="Languages" size="sm" />
          <span>{t(`sidebar.languages.${i18n.language}`)}</span>
          <Icon name="ChevronDown" size="xs" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {languages.map((languageCode) => (
          <DropdownMenuCheckboxItem
            key={languageCode}
            checked={i18n.language === languageCode}
            onCheckedChange={() => handleLanguageChange(languageCode)}
          >
            {t(`sidebar.languages.${languageCode}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
