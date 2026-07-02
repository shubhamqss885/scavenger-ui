"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Table, GitBranch, FileBarChart, BookLock, Share2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { useDatabaseDescription } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

type TabItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export function DataSourceHeaderTabs() {
  const { databaseId } = useDatabaseDescription();
  const { t } = useTranslation("database");
  const pathname = usePathname();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();

  const allTabs: TabItem[] = [
    {
      label: t("tabs.data"),
      href: `/data-sources/${databaseId}/data`,
      icon: Table,
    },
    {
      label: t("tabs.er"),
      href: `/data-sources/${databaseId}/diagram`,
      icon: GitBranch,
    },
    {
      label: t("tabs.context"),
      href: `/data-sources/${databaseId}/context`,
      icon: BookLock,
    },
    {
      label: t("tabs.knowledge"),
      href: `/data-sources/${databaseId}/knowledge`,
      icon: Share2,
    },
    {
      label: t("tabs.dataQuality"),
      href: `/data-sources/${databaseId}/profiler`,
      icon: FileBarChart,
    },
  ];

  const tabs = allTabs.filter((tab) => {
    if (
      !isFeatureEnabled(FEATURE_FLAGS.DATA_MODEL_TAB) &&
      tab.href.includes("/diagram")
    )
      return false;
    if (
      !isFeatureEnabled(FEATURE_FLAGS.KNOWLEDGE_TAB) &&
      tab.href.includes("/knowledge")
    )
      return false;
    return true;
  });

  const isTabActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="scrollbar-none flex items-center overflow-x-auto border-b">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = isTabActive(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 px-1 py-2.5 text-sm transition-all duration-200 sm:px-4",
              "h-10 after:absolute after:bottom-[0px] after:left-0 after:right-0 after:h-0.5 after:transition-all after:duration-200",
              isActive
                ? "font-medium text-gray-900 after:z-10 after:bg-primary"
                : "text-gray-600 after:bg-transparent hover:bg-slate-50 hover:text-gray-800 hover:after:bg-slate-200",
            )}
          >
            <Icon className="h-4 w-4 min-w-4 transition-colors duration-200" />
            <span
              className={cn(
                isActive ? "inline" : "hidden sidebar-breakpoint:inline",
                "whitespace-nowrap",
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
