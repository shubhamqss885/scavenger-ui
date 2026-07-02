"use client";

import { Badge } from "@/components/ui/badge";
import { Icon, IconName } from "@/components/ui/icon";
import { H1, H2, H4, Muted } from "@/components/ui/typography";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface DataQualityScoreProps {
  data: CSVProfileResponse;
}

interface ScoreRating {
  labelKey: string;
  descriptionKey: string;
  icon: IconName;
  iconVariant: "success" | "primary" | "warning" | "destructive";
  badgeClasses: string;
  scoreClasses: string;
}

const getScoreRating = (score: number): ScoreRating => {
  if (score >= 90) {
    return {
      labelKey: "profiler.qualityScore.outstanding.label",
      descriptionKey: "profiler.qualityScore.outstanding.description",
      icon: "CheckCircle2",
      iconVariant: "success",
      badgeClasses: "border-green-600 text-green-600 bg-green-50",
      scoreClasses: "text-green-600",
    };
  } else if (score >= 75) {
    return {
      labelKey: "profiler.qualityScore.great.label",
      descriptionKey: "profiler.qualityScore.great.description",
      icon: "ThumbsUp",
      iconVariant: "primary",
      badgeClasses: "border-primary text-primary bg-teal-50",
      scoreClasses: "text-primary",
    };
  } else if (score >= 60) {
    return {
      labelKey: "profiler.qualityScore.acceptable.label",
      descriptionKey: "profiler.qualityScore.acceptable.description",
      icon: "AlertCircle",
      iconVariant: "warning",
      badgeClasses: "border-amber-500 text-amber-700 bg-amber-50",
      scoreClasses: "text-amber-600",
    };
  } else {
    return {
      labelKey: "profiler.qualityScore.needsAttention.label",
      descriptionKey: "profiler.qualityScore.needsAttention.description",
      icon: "AlertTriangle",
      iconVariant: "destructive",
      badgeClasses: "border-red-500 text-red-700 bg-red-50",
      scoreClasses: "text-red-600",
    };
  }
};

export function DataQualityScore({ data }: DataQualityScoreProps) {
  const { t } = useTranslation("database");
  const { quality_score } = data.table_stats;
  const rating = getScoreRating(quality_score);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-4 sm:flex-nowrap sm:pt-6">
        {/* Left side - Rating info */}
        <div className="flex flex-1 items-center gap-4">
          <Icon name={rating.icon} size="xl" variant={rating.iconVariant} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <H4 className="text-lg">{t(rating.labelKey)}</H4>
              <Badge
                variant="outline"
                className={cn("text-xs", rating.badgeClasses)}
              >
                {t("profiler.qualityScore.badge")}
              </Badge>
            </div>
            <Muted className="text-gray-600">{t(rating.descriptionKey)}</Muted>
          </div>
        </div>

        {/* Right side - Score */}
        <div className="mx-auto flex items-center gap-1 sm:mx-0 sm:ml-6">
          <H1 className={cn(rating.scoreClasses)}>{quality_score}</H1>
          <H2 className={cn("border-none", rating.scoreClasses)}>%</H2>
        </div>
      </CardContent>
    </Card>
  );
}
