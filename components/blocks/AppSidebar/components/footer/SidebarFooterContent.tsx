"use client";

import { useState, useCallback, forwardRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Icon, IconName } from "@/components/ui/icon";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n/client";
import { languages } from "@/lib/i18n/settings";
import { useSettingsModal } from "@/lib/hooks/useSettingsModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrganizationSwitcher from "@/components/blocks/OrganizationSwitcher";
import { NotificationBell } from "@/components/blocks/NotificationBell";
import { SidebarUsageIndicator } from "./SidebarUsageIndicator";

// --- Shared Icon Button ---

const iconButtonClass = "p-2 rounded hover:bg-muted/50 text-muted-foreground";

type FooterIconButtonProps = Readonly<{
  icon: IconName;
  onClick?: () => void;
  className?: string;
}>;

const FooterIconButton = forwardRef<HTMLButtonElement, FooterIconButtonProps>(
  ({ icon, onClick, className, ...props }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={className || iconButtonClass}
      {...props}
    >
      <Icon name={icon} size="sm" />
    </button>
  ),
);
FooterIconButton.displayName = "FooterIconButton";

// --- Language Menu ---

type LanguageMenuProps = Readonly<{
  isCollapsed: boolean;
  currentLang: string;
  onLangChange: (lang: string) => void;
}>;

const LanguageMenu = ({
  isCollapsed,
  currentLang,
  onLangChange,
}: LanguageMenuProps) => {
  const { t } = useTranslation("home");
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <FooterIconButton icon="Languages" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={isCollapsed ? "right" : "top"}>
          {t("sidebar.profile.language")}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side={isCollapsed ? "right" : "top"}
        align={isCollapsed ? "end" : "start"}
        className="w-32"
      >
        {languages.map((lang) => (
          <DropdownMenuCheckboxItem
            key={lang}
            checked={currentLang === lang}
            onCheckedChange={() => {
              setOpen(false);
              onLangChange(lang);
            }}
          >
            {t(`sidebar.languages.${lang}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Settings Menu ---

type SettingsMenuProps = Readonly<{
  isCollapsed: boolean;
  onTabChange: (tab: string) => void;
}>;

const SettingsMenu = ({ isCollapsed, onTabChange }: SettingsMenuProps) => {
  const { t } = useTranslation("home");
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const isPaywallEnabled = isFeatureEnabled(FEATURE_FLAGS.PAYWALL_ENABLED);
  const [open, setOpen] = useState(false);

  const handleSelect = (tab: string) => {
    setOpen(false);
    onTabChange(tab);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <FooterIconButton icon="Settings" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={isCollapsed ? "right" : "top"}>
          {t("sidebar.profile.settings")}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side={isCollapsed ? "right" : "top"}
        align={isCollapsed ? "end" : "start"}
        className="w-44"
      >
        {/* The SettingsModal currently ignores the selected tab (tabs were
            removed). Both items open the same simplified panel. Kept as-is so
            the menu can be reinstated when paywall is re-enabled. */}
        <DropdownMenuItem onClick={() => handleSelect("accounts")}>
          {t("sidebar.settings.account")}
        </DropdownMenuItem>
        {isPaywallEnabled && (
          <DropdownMenuItem onClick={() => handleSelect("billing")}>
            {t("sidebar.settings.billing")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <a href="/api/auth/logout">
          <DropdownMenuItem>{t("sidebar.profile.logout")}</DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Main Footer Component ---

export const SidebarFooterContent = () => {
  const { userProfile, auth0User, updateUserProfile } = useUserContext();
  const { t, i18n } = useTranslation("home");
  const { open, toggleSidebar } = useSidebar();
  const { handleTabChange } = useSettingsModal();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();

  const IS_ORG_SWITCHER_ENABLED = isFeatureEnabled(FEATURE_FLAGS.ORG_SWITCHER);

  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      await i18n.changeLanguage(languageCode);
      if (userProfile) {
        await updateUserProfile({ locale: languageCode });
      }
    },
    [i18n, userProfile, updateUserProfile],
  );

  const email = auth0User?.email;

  const orgSwitcherTrigger = <FooterIconButton icon="Layers" />;

  const toggleButton = (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <FooterIconButton
          icon={open ? "PanelRightOpen" : "PanelRightClose"}
          onClick={toggleSidebar}
        />
      </TooltipTrigger>
      <TooltipContent side={open ? "top" : "right"}>
        {open
          ? t("sidebar.navigation.collapseSidebar", "Collapse")
          : t("sidebar.navigation.expandSidebar", "Expand")}
      </TooltipContent>
    </Tooltip>
  );

  const openUsageTab = useCallback(
    () => handleTabChange("usage"),
    [handleTabChange],
  );

  // --- Collapsed state ---
  if (!open) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <SidebarUsageIndicator variant="collapsed" onOpenUsage={openUsageTab} />
        <NotificationBell />
        <LanguageMenu
          isCollapsed
          currentLang={i18n.language}
          onLangChange={handleLanguageChange}
        />
        {IS_ORG_SWITCHER_ENABLED && (
          <OrganizationSwitcher trigger={orgSwitcherTrigger} />
        )}
        <SettingsMenu isCollapsed onTabChange={handleTabChange} />
        {toggleButton}
      </div>
    );
  }

  // --- Expanded state ---
  return (
    <div className="flex flex-col">
      <SidebarUsageIndicator variant="expanded" onOpenUsage={openUsageTab} />
      {email && (
        <button
          onClick={() => handleTabChange("accounts")}
          className="px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <span className="block truncate text-[11px] text-muted-foreground/50">
            {email}
          </span>
        </button>
      )}
      <div className="flex items-center gap-1 px-3 py-2">
        <NotificationBell />
        <LanguageMenu
          isCollapsed={false}
          currentLang={i18n.language}
          onLangChange={handleLanguageChange}
        />
        {IS_ORG_SWITCHER_ENABLED && (
          <OrganizationSwitcher trigger={orgSwitcherTrigger} />
        )}
        <SettingsMenu isCollapsed={false} onTabChange={handleTabChange} />
        <span className="flex-1" />
        {toggleButton}
      </div>
    </div>
  );
};
