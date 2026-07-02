"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconLogoWordmark } from "@/lib/icons/logo-wordmark";
import LanguageSwitcher from "@/components/blocks/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/client";

interface SimpleHeaderProps {
  showLogout?: boolean;
  showLanguageSwitcher?: boolean;
}

const SimpleHeader = ({
  showLogout = true,
  showLanguageSwitcher = true,
}: SimpleHeaderProps) => {
  const { t } = useTranslation("home");

  return (
    <header className="my-0 flex h-[72px] w-full shrink-0 items-center justify-between px-4 py-0 sm:px-6">
      <Link href="/home" className="flex h-8 cursor-pointer items-center">
        <IconLogoWordmark className="h-6 w-auto text-slate-900" />
      </Link>
      {showLogout && (
        <div className="flex items-center gap-2">
          {showLanguageSwitcher && <LanguageSwitcher />}
          <Button variant="ghost" size="sm" asChild>
            <a
              href="/api/auth/logout"
              aria-label={t("sidebar.header.loginAsDifferentUser")}
            >
              <Icon
                name="LogOut"
                size="xs"
                variant="foreground"
                className="sm:hidden"
              />
              <span className="hidden sm:inline">
                {t("sidebar.header.loginAsDifferentUser")}
              </span>
            </a>
          </Button>
        </div>
      )}
    </header>
  );
};

export default SimpleHeader;
