"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@/components/ui/icon";
import { Large, Muted, P } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

type RulesExamplesHeaderProps = {
  variant: "rules" | "examples";
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyActive: boolean;
  onToggleActiveFilter: (checked: boolean) => void;
  onAdd: () => void;
  /** Optional override for the add button (e.g. popover with suggestions) */
  addButtonSlot?: React.ReactNode;
  /** When true, hides the add button and shows read-only hint */
  readOnly?: boolean;
};

export const RulesExamplesHeader = ({
  variant,
  searchQuery,
  onSearchChange,
  showOnlyActive,
  onToggleActiveFilter,
  onAdd,
  addButtonSlot,
  readOnly,
}: RulesExamplesHeaderProps) => {
  const { t } = useTranslation("database");
  const { rules, examples } = useOrgDbConfig();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_DATASOURCES);

  const isRules = variant === "rules";
  const items = isRules ? rules : examples;
  const itemCount = items?.length || 0;

  // Translation keys based on variant
  const label = isRules ? t("tabs.rules") : t("tabs.examples");
  const translationPrefix = isRules ? "businessRules" : "queryExamples";

  const howItWorksTitle = t(`${translationPrefix}.howItWorks.title`);
  const howItWorksDescription = t(
    `${translationPrefix}.howItWorks.description`,
  );
  const howItWorksHint = t(`${translationPrefix}.howItWorks.hint`);

  return (
    <div className="flex items-center justify-between border-b px-6 py-[7.5px]">
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-600">
          <span>
            {label}: <strong className="text-gray-900">{itemCount}</strong>
          </span>
        </div>
        {/* Search Input */}
        <div className="relative w-64">
          <Icon
            name="Search"
            className="absolute left-2 top-2"
            size="sm"
            variant="muted"
          />
          <Input
            placeholder={t(`${translationPrefix}.search.placeholder`)}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t(`${translationPrefix}.howItWorks.cta`)}
              className="hidden md:inline-flex"
            >
              {t(`${translationPrefix}.howItWorks.cta`)}
              <Icon
                name="HelpCircle"
                size="xs"
                className="ml-1.5 text-muted-foreground"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" side="bottom" align="end">
            <div className="space-y-2">
              <Large className="font-medium">{howItWorksTitle}</Large>
              <P className="leading-normal text-muted-foreground">
                {howItWorksDescription}
              </P>
              <P className="leading-normal text-muted-foreground">
                {howItWorksHint}
              </P>
            </div>
          </PopoverContent>
        </Popover>
        {/* Show Only Active Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            checked={showOnlyActive}
            onCheckedChange={onToggleActiveFilter}
            id="show-only-active"
          />
          <Label htmlFor="show-only-active" className="cursor-pointer">
            <Muted className="text-xs">
              {t(`${translationPrefix}.filters.showOnlyActive`)}
            </Muted>
          </Label>
        </div>

        {canEdit &&
          !readOnly &&
          (addButtonSlot || (
            <Button onClick={onAdd} size="sm" variant="outline">
              <Icon
                name="Plus"
                size="sm"
                className="mr-1"
                variant="foreground"
              />
              {t(
                `${translationPrefix}.actions.${isRules ? "addRule" : "addExample"}`,
              )}
            </Button>
          ))}

        {readOnly && (
          <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <Icon name="MessageSquare" size="sm" />
            <span>{t("vault.editInChat")}</span>
          </div>
        )}
      </div>
    </div>
  );
};
