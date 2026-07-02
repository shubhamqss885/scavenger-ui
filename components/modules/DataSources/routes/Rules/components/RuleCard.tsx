import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { H4, P } from "@/components/ui/typography";
import { OrgDbRule } from "@/lib/services/organizationDbService";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

type RuleCardProps = {
  rule: OrgDbRule;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleActive: (index: number, active: boolean) => void;
  isLast: boolean;
  readOnly?: boolean;
};

export const RuleCard = ({
  rule,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  isLast,
  readOnly,
}: RuleCardProps) => {
  const { t } = useTranslation("database");
  const { toggleLoading } = useOrgDbConfig();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_DATASOURCES) && !readOnly;

  const isToggleLoading = toggleLoading[rule.orgdb_rule_id] || false;

  return (
    <Card
      className={cn(
        "mb-4 rounded-lg border-none shadow-none",
        isLast && "mb-0",
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between rounded-t-lg bg-slate-50 px-4 py-2">
          <div className="flex flex-col">
            <H4 className="text-sm font-medium">
              {rule.title || `${t("rules.labels.rule")} ${index + 1}`}
            </H4>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center space-x-2",
                (isToggleLoading || !canEdit) && "pointer-events-none",
              )}
            >
              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) => onToggleActive(index, checked)}
                id={`rule-active-${index}`}
                disabled={isToggleLoading || !canEdit}
                className={cn((isToggleLoading || !canEdit) && "opacity-50")}
              />
              <Label
                htmlFor={`rule-active-${index}`}
                className={cn(
                  "cursor-pointer text-xs text-muted-foreground",
                  (isToggleLoading || !canEdit) && "opacity-50",
                )}
              >
                {rule.is_active
                  ? t("common.active") || "Active"
                  : t("common.inactive") || "Inactive"}
              </Label>
            </div>
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(index)}
                  className="h-8 px-3"
                >
                  <Icon name="Edit" size="xs" className="mr-1" />
                  {t("businessRules.actions.edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(index)}
                  className="h-8 px-3 text-destructive hover:text-destructive"
                >
                  <Icon
                    name="Trash2"
                    size="xs"
                    className="mr-1"
                    variant="destructive"
                  />
                  {t("businessRules.actions.remove")}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="p-4">
          <P className="[&:first-child]:mt-0">{rule.rule}</P>
        </div>
      </CardContent>
    </Card>
  );
};
