"use client";

import Link from "next/link";
// import { X } from "lucide-react";
import { useUIState } from "@/lib/context/UIStateContext";
import { useTranslation } from "@/lib/i18n/client";
import { Small } from "@/components/ui/typography";

const formatMaintenanceTime = (isoString: string): string => {
  const date = new Date(isoString);

  // Handle invalid dates - show raw string as fallback
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const TopBar = () => {
  const {
    isTopBarActive,
    topBarMode,
    maintenanceFromTime,
    maintenanceUntilTime,
  } = useUIState();
  const { t } = useTranslation("common");

  if (!isTopBarActive) return null;

  return (
    <div className="h-[var(--top-bar-height)] bg-slate-900 flex justify-between items-center px-2 border-b border-transparent relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[3px] after:bg-gradient-to-r after:from-primary after:via-blue-600 after:to-purple-800 z-50">
      {topBarMode === "maintenance" ? (
        <>
          <div className="shrink" />
          <div className="flex items-center justify-center flex-1">
            <Small className="text-white tracking-wide mt-0 text-center">
              {t("topBar.maintenance.prefix")}{" "}
              <span className="text-primary font-medium">
                {maintenanceFromTime
                  ? formatMaintenanceTime(maintenanceFromTime) + " CET"
                  : ""}
              </span>{" "}
              {t("topBar.maintenance.to")}{" "}
              <span className="text-primary font-medium">
                {maintenanceUntilTime
                  ? formatMaintenanceTime(maintenanceUntilTime) + " CET"
                  : ""}
              </span>
              . {t("topBar.maintenance.suffix")}
            </Small>
          </div>
          <div className="flex justify-end shrink">
            {/* <button
              onClick={toggleTopBar}
              className="p-1 rounded text-white hover:bg-primary-foreground/10"
              aria-label="Dismiss maintenance banner"
            >
              <X size={14} />
            </button> */}
          </div>
        </>
      ) : (
        <>
          <div className="shrink" />
          <div className="flex items-center justify-center flex-1">
            <Link href="/pricing" className="text-white">
              <Small className="text-white tracking-wide mt-0">
                {t("topBar.cta.text")}
                <span className="ml-1 text-primary underline-offset-2 hover:underline">
                  {t("topBar.cta.action")}
                </span>
              </Small>
            </Link>
          </div>
          <div className="flex justify-end shrink" />
        </>
      )}
    </div>
  );
};
