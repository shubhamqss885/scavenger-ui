"use client";

import { Icon } from "@/components/ui/icon";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";

type EmptyColumnStateProps = Readonly<{
  type: "numerical" | "categorical" | "datetime";
}>;

const icons = {
  numerical: "Hash",
  categorical: "Type",
  datetime: "Calendar",
} as const;

export const EmptyColumnState = ({ type }: EmptyColumnStateProps) => {
  const { t } = useTranslation("database");

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon name={icons[type]} size="lg" variant="muted" className="mb-3" />
      <Muted>{t(`profiler.columnAnalysis.emptyStates.${type}`)}</Muted>
    </div>
  );
};
