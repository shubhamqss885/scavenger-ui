"use client";

import { LucideIcon } from "lucide-react";

type EmptyStateProps = Readonly<{
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  variant?: "default" | "error" | "loading";
}>;

export function EmptyState({
  icon: Icon,
  iconClassName = "h-12 w-12 text-slate-400",
  title,
  subtitle,
  variant = "default",
}: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          titleClass: "text-red-600 text-sm",
          subtitleClass: "text-slate-500 text-xs mt-1",
        };
      case "loading":
      default:
        return {
          titleClass: "text-slate-600 text-sm",
          subtitleClass: "text-slate-500 text-xs mt-1",
        };
    }
  };

  const { titleClass, subtitleClass } = getVariantStyles();

  return (
    <div className="text-center py-12">
      <div className="flex flex-col items-center gap-4">
        <Icon className={iconClassName} />
        <div>
          <p className={titleClass}>{title}</p>
          {subtitle && <p className={subtitleClass}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
