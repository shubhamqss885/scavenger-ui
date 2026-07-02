"use client";

import {
  Database,
  Table2,
  SearchX,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { H4, Muted } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";

type EmptyStateProps = Readonly<{
  type?:
    | "no-table"
    | "no-data"
    | "no-results"
    | "error"
    | "processing"
    | "setup-required"
    | "setup-failed";
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}>;

export function EmptyState({
  type = "no-table",
  message,
  onAction,
  actionLabel,
}: EmptyStateProps) {
  const { t } = useTranslation("database");

  const configs = {
    "no-table": {
      icon: Table2,
      title: t("dataTab.emptyStates.noTableSelected"),
      description: message || t("dataTab.emptyStates.noTableSelectedDesc"),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    "no-data": {
      icon: Database,
      title: t("dataTab.emptyStates.noDataAvailable"),
      description: message || t("dataTab.emptyStates.noDataAvailableDesc"),
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    "no-results": {
      icon: SearchX,
      title: t("dataTab.emptyStates.noResultsFound"),
      description: message || t("dataTab.emptyStates.noResultsFoundDesc"),
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    error: {
      icon: AlertCircle,
      title: t("dataTab.emptyStates.unableToLoadData"),
      description: message || t("dataTab.emptyStates.unableToLoadDataDesc"),
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    processing: {
      icon: Clock,
      title: t("dataTab.emptyStates.databaseProcessing"),
      description: message || t("dataTab.emptyStates.databaseProcessingDesc"),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    "setup-required": {
      icon: Database,
      title: t("dataTab.emptyStates.setupRequired"),
      description: message || t("dataTab.emptyStates.setupRequiredDesc"),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    "setup-failed": {
      icon: AlertTriangle,
      title: t("dataTab.emptyStates.setupFailed"),
      description: message || t("dataTab.emptyStates.setupFailedDesc"),
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className={`${config.iconBg} mb-4 rounded-full p-4`}>
        <Icon className={`h-8 w-8 ${config.iconColor}`} />
      </div>
      <H4 className="mb-2">{config.title}</H4>
      <Muted className="mb-6 block max-w-sm">{config.description}</Muted>
      {onAction && actionLabel && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
