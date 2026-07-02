"use client";

import { useTranslation } from "@/lib/i18n/client";
import { Icon, IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Large, Muted } from "@/components/ui/typography";

type EmptyStateVariant = "no-data" | "no-results";

interface FeedbackEmptyStateProps {
  variant: EmptyStateVariant;
  onClearFilters?: () => void;
}

const config: Record<
  EmptyStateVariant,
  { icon: IconName; titleKey: string; descKey: string }
> = {
  "no-data": {
    icon: "Inbox",
    titleKey: "feedbackTab.empty.noData.title",
    descKey: "feedbackTab.empty.noData.description",
  },
  "no-results": {
    icon: "Search",
    titleKey: "feedbackTab.empty.noResults.title",
    descKey: "feedbackTab.empty.noResults.description",
  },
};

export const FeedbackEmptyState = ({
  variant,
  onClearFilters,
}: FeedbackEmptyStateProps) => {
  const { t } = useTranslation("database");
  const { icon, titleKey, descKey } = config[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-white">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon name={icon} size="lg" className="text-gray-400" />
      </div>
      <Large className="text-gray-900 mb-2">{t(titleKey)}</Large>
      <Muted className="text-center max-w-sm mb-4">{t(descKey)}</Muted>
      {variant === "no-results" && onClearFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          {t("feedbackTab.filters.clearFilters")}
        </Button>
      )}
    </div>
  );
};
