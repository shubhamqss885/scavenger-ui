"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, IconName } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  onPromptSelect: (prompt: string) => void;
}>;

// "operations" is defined in the locale files but intentionally not shown yet.
const CATEGORY_KEYS = [
  "growth",
  "forecasting",
  "efficiency",
  "customers",
  "risk",
  "understand",
  "dataQuality",
  // "operations",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_ICONS: Record<CategoryKey, IconName> = {
  growth: "TrendingUp",
  efficiency: "Timer",
  understand: "Lightbulb",
  dataQuality: "ShieldAlert",
  risk: "AlertTriangle",
  customers: "User",
  forecasting: "BarChart2",
};

const HomeSuggestedCategories = ({ onPromptSelect }: Props) => {
  const { t } = useTranslation("home");
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(
    null,
  );

  const handleCategoryClick = (category: CategoryKey) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const getPrompts = (category: CategoryKey): string[] => {
    const result = t(`suggestedPrompts.${category}.prompts`, {
      returnObjects: true,
    });
    return Array.isArray(result) ? (result as string[]) : [];
  };

  return (
    <div className="mt-3 flex h-[250px] w-full flex-col items-start gap-2 overflow-y-auto">
      <div className="sticky top-0 z-10 flex min-h-8 w-full gap-2 overflow-x-auto bg-background pb-1">
        {CATEGORY_KEYS.map((category) => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            onClick={() => handleCategoryClick(category)}
            className={cn(
              "h-7 shrink-0 gap-1.5 rounded-md border-none bg-transparent px-1.5 text-xs font-medium shadow-none transition-colors hover:bg-slate-100 sm:px-3",
              activeCategory === category
                ? "text-primary hover:text-primary"
                : "text-slate-600",
            )}
          >
            <Icon
              name={CATEGORY_ICONS[category]}
              size="xxs"
              className={
                activeCategory === category ? "text-primary" : "text-slate-500"
              }
            />
            {t(`suggestedPrompts.${category}.label`)}
          </Button>
        ))}
      </div>

      {activeCategory && (
        <div className="flex w-full flex-col items-start gap-2">
          {getPrompts(activeCategory).map((prompt, index) => (
            <Card
              key={`${activeCategory}-${index}`}
              onClick={() => onPromptSelect(prompt)}
              className="flex min-h-[34px] w-fit max-w-full cursor-pointer items-center justify-between space-x-3 rounded-md border border-solid px-3 py-1.5 shadow-none hover:bg-slate-50"
            >
              <p className="whitespace-normal text-left text-xs font-normal leading-5 text-slate-900">
                {prompt}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeSuggestedCategories;
