"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardStatsState } from "@/lib/context/DashboardStatsProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const formatTokens = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} k`;
  return String(value);
};

type SidebarUsageIndicatorProps = Readonly<{
  variant: "expanded" | "collapsed";
  onOpenUsage: () => void;
}>;

export const SidebarUsageIndicator = ({
  variant,
  onOpenUsage,
}: SidebarUsageIndicatorProps) => {
  const { t } = useTranslation("home");
  const { dashboardStats } = useDashboardStatsState();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const { userProfile } = useUserContext();

  const isPaywallEnabled = isFeatureEnabled(FEATURE_FLAGS.PAYWALL_ENABLED);
  const isPrivateUser = userProfile?.user_role_name === "private-user";
  const canOpenUsage = !isPaywallEnabled && isPrivateUser;

  const { tokensUsed, tokenLimit } = dashboardStats;

  if (!canOpenUsage || tokenLimit <= 0) return null;

  const ratio = Math.min(tokensUsed / tokenLimit, 1);
  const percent = Math.round(ratio * 100);
  const isAtLimit = ratio >= 1;
  const isWarning = ratio >= 0.7 && !isAtLimit;

  const trackColor = "bg-slate-200/80 dark:bg-slate-700/60";
  const fillColor = cn(
    "h-full transition-[width,background-color] duration-500 ease-out",
    isAtLimit && "bg-rose-500",
    isWarning && "bg-amber-400",
    !isAtLimit && !isWarning && "bg-emerald-500",
  );

  const detailLabel = `${formatTokens(tokensUsed)} / ${formatTokens(tokenLimit)}`;
  const tooltipLabel = t("sidebar.usage.tooltip", {
    used: tokensUsed.toLocaleString(),
    total: tokenLimit.toLocaleString(),
    percent,
  });

  if (variant === "collapsed") {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenUsage}
            aria-label={tooltipLabel}
            className="rounded group h-7 w-7 p-1"
          >
            <span
              className={cn(
                "block h-1 w-5 overflow-hidden rounded-full",
                trackColor,
              )}
            >
              <span
                className={cn("block", fillColor)}
                style={{ width: `${percent}%` }}
              />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <span className="font-medium">{t("sidebar.usage.tokens")}</span>
          <span className="ml-2 opacity-70">{detailLabel}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={onOpenUsage}
      aria-label={tooltipLabel}
      className="group flex h-auto w-full flex-col items-stretch gap-1.5 whitespace-normal rounded-none px-3 pb-2 pt-2.5 text-left"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground/60 group-hover:text-muted-foreground">
          {t("sidebar.usage.tokens")}
        </span>
        <span
          className={cn(
            "text-[11px] font-medium",
            isAtLimit
              ? "text-rose-600 dark:text-rose-400"
              : isWarning
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground/70 group-hover:text-muted-foreground",
          )}
        >
          {detailLabel}
        </span>
      </div>
      <span
        className={cn(
          "block h-[3px] w-full overflow-hidden rounded-full",
          trackColor,
        )}
      >
        <span
          className={cn("block", fillColor)}
          style={{ width: `${percent}%` }}
        />
      </span>
    </Button>
  );
};
