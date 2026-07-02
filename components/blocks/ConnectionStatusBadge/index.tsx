"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatusBadge({
  isConnected,
  className,
}: Readonly<ConnectionStatusBadgeProps>) {
  const { t } = useTranslation("database");

  const getBadgeContent = () => {
    if (isConnected) {
      return {
        text: t("status.connected"),
        classes: "border-green-600 text-green-600",
        dotColor: "bg-green-600",
      };
    } else {
      return {
        text: t("status.disconnected"),
        classes: "border-red-500 text-red-700",
        dotColor: "bg-red-500",
      };
    }
  };

  const badgeContent = getBadgeContent();

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] py-0", badgeContent.classes, className)}
    >
      <div
        className={cn("w-1.5 h-1.5 rounded-full mr-1", badgeContent.dotColor)}
      />
      {badgeContent.text}
    </Badge>
  );
}
