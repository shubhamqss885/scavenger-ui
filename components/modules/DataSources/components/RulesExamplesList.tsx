import { useMemo, ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import { EmptyState } from "@/components/blocks/EmptyState";
import { useTranslation } from "@/lib/i18n/client";
import { Shield, FileText } from "lucide-react";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

interface BaseItem {
  orgdb_rule_id?: string;
  orgdb_example_id?: string;
  category: string;
  title: string;
  is_active: boolean;
}

const getItemId = (item: BaseItem): string =>
  item.orgdb_rule_id || item.orgdb_example_id || "";

interface RulesExamplesListProps<T extends BaseItem> {
  variant: "rules" | "examples";
  items: T[];
  searchQuery: string;
  showOnlyActive: boolean;
  onEdit: (item: T, index: number) => void;
  onDelete: (index: number) => void;
  onToggleActive: (index: number, active: boolean, item: T) => void;
  onAdd: () => void;
  onValidate?: (content: string) => Promise<any>;
  readOnly?: boolean;
  renderCard: (
    item: T,
    index: number,
    props: {
      onEdit: () => void;
      onDelete: () => void;
      onToggleActive: (index: number, active: boolean) => void;
      onValidate?: (content: string) => Promise<any>;
      isLast: boolean;
    },
  ) => ReactNode;
  getSearchableContent: (item: T) => string;
}

export const RulesExamplesList = <T extends BaseItem>({
  variant,
  items,
  searchQuery,
  showOnlyActive,
  onEdit,
  onDelete,
  onToggleActive,
  onAdd,
  onValidate,
  readOnly,
  renderCard,
  getSearchableContent,
}: RulesExamplesListProps<T>) => {
  const { t } = useTranslation("database");
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_DATASOURCES) && !readOnly;

  const isRules = variant === "rules";
  const translationPrefix = isRules ? "businessRules" : "queryExamples";
  const itemLabel = isRules ? "rule" : "example";
  const itemLabelPlural = isRules ? "rules" : "examples";
  const EmptyIcon = isRules ? Shield : FileText;

  // Group all items by category (for counts)
  const originalGroupedItems = useMemo(() => {
    const grouped: Record<string, { items: T[]; indices: number[] }> = {};

    if (!items) return grouped;

    items.forEach((item, index) => {
      const category = item.category || "general";

      if (!grouped[category]) {
        grouped[category] = { items: [], indices: [] };
      }

      grouped[category].items.push(item);
      grouped[category].indices.push(index);
    });

    return grouped;
  }, [items]);

  // Filter items based on search and active status
  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSearchableContent(item)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Active filter
      const matchesActive = !showOnlyActive || item.is_active;

      return matchesSearch && matchesActive;
    });
  }, [items, searchQuery, showOnlyActive, getSearchableContent]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const grouped: Record<string, { items: T[]; indices: number[] }> = {};

    filteredItems.forEach((item) => {
      const category = item.category || "general";
      const originalIndex =
        items?.findIndex((i) => getItemId(i) === getItemId(item)) ?? -1;

      if (!grouped[category]) {
        grouped[category] = { items: [], indices: [] };
      }

      grouped[category].items.push(item);
      grouped[category].indices.push(originalIndex);
    });

    return grouped;
  }, [filteredItems, items]);

  const categories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
  }, [groupedItems]);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <EmptyState
          icon={EmptyIcon}
          iconClassName="h-12 w-12 text-muted-foreground"
          title={t(`${translationPrefix}.empty.title`)}
          subtitle={
            canEdit
              ? t(`${translationPrefix}.empty.description`)
              : t(`${translationPrefix}.empty.readOnlyDescription`)
          }
        />
        {canEdit && (
          <Button onClick={onAdd} className="mt-6">
            {t(
              `${translationPrefix}.actions.add${isRules ? "Rule" : "Example"}`,
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={isRules ? "my-6" : ""}>
      <Accordion
        type="multiple"
        defaultValue={categories}
        className={`space-y-4 ${!isRules ? "my-6" : ""}`}
      >
        {categories.map((category) => {
          const { items: categoryItems, indices } = groupedItems[category];
          const originalCategoryItems =
            originalGroupedItems[category]?.items || [];
          const totalCount = originalCategoryItems.length;
          const activeCount = originalCategoryItems.filter(
            (item) => item.is_active,
          ).length;

          return (
            <AccordionItem
              key={category}
              value={category}
              className="rounded-lg border"
            >
              <Card className="border-0 shadow-none">
                <AccordionTrigger className="rounded-t-lg bg-slate-100 px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <H3 className="text-base font-medium capitalize text-muted-foreground">
                      {category}
                    </H3>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {totalCount}{" "}
                      {totalCount === 1
                        ? t(`${translationPrefix}.labels.${itemLabel}`)
                        : t(`${translationPrefix}.labels.${itemLabelPlural}`)}
                    </Badge>
                    {activeCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-xs font-medium text-green-700"
                      >
                        {activeCount} {t(`${translationPrefix}.labels.active`)}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="border-t">
                    <div className="space-y-0">
                      {categoryItems.map((item, categoryIndex) => {
                        const originalIndex = indices[categoryIndex];
                        return renderCard(item, originalIndex, {
                          onEdit: () => onEdit(item, originalIndex),
                          onDelete: () => onDelete(originalIndex),
                          onToggleActive: (index, active) =>
                            onToggleActive(index, active, item),
                          onValidate,
                          isLast: categoryIndex === categoryItems.length - 1,
                        });
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
