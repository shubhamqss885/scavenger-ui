"use client";

import { useState } from "react";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { DeleteConfirmationAlert } from "@/components/modules/DataSources/components/DeleteConfirmationAlert";
import { RulesExamplesList } from "@/components/modules/DataSources/components/RulesExamplesList";
import { RuleCard } from "./RuleCard";
import { RulesExamplesHeader } from "@/components/modules/DataSources/components/RulesExamplesHeader";
import { RuleFormModal } from "./RuleFormModal";
import { OrgDbRule } from "@/lib/services/organizationDbService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RuleSuggestionsPopover } from "./RuleSuggestions/RuleSuggestionsPopover";
import { type RuleSuggestion } from "./RuleSuggestions/types";

type Props = Readonly<{
  readOnly?: boolean;
}>;

export const DatabaseRulesContent = ({ readOnly }: Props) => {
  const { t } = useTranslation("database");
  const { rules, addRule, updateRule, deleteRule } = useOrgDbConfig();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const showSuggestions = isFeatureEnabled(FEATURE_FLAGS.RULE_SUGGESTIONS);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

  // Suggestions state (lifted here so we can remove after successful save)
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([]);

  // Pre-fill state for suggestion "Edit & Accept"
  const [suggestionPrefill, setSuggestionPrefill] = useState<{
    category: string;
    title: string;
    rule: string;
  } | null>(null);

  // Track which suggestion is pending edit (removed only after save)
  const [pendingEditSuggestionId, setPendingEditSuggestionId] = useState<
    string | null
  >(null);

  const handleAddRule = () => {
    setSuggestionPrefill(null);
    setPendingEditSuggestionId(null);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleSuggestionAccept = async (suggestion: RuleSuggestion) => {
    if (suggestion.suggestion_type === "REMOVE") {
      // In a real implementation, this would find and delete the matching rule via API
      // For now it just removes the suggestion from the list (handled by the popover)
      return;
    }
    try {
      await addRule({
        title: suggestion.title,
        category: suggestion.category,
        rule: suggestion.rule_text,
      });
      toast.success(t("businessRules.messages.created"));
    } catch {
      // Error toast already shown by context provider
    }
  };

  const handleSuggestionEditAndAccept = (suggestion: RuleSuggestion) => {
    setSuggestionPrefill({
      category: suggestion.category,
      title: suggestion.title,
      rule: suggestion.rule_text,
    });
    setPendingEditSuggestionId(suggestion.id);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleSuggestionDecline = (_suggestion: RuleSuggestion) => {
    // In a real implementation, this would send feedback to the API
  };

  const handleModalSaved = () => {
    // If this save came from an "Edit & Accept", remove the suggestion now
    if (pendingEditSuggestionId) {
      setSuggestions((prev) =>
        prev.filter((s) => s.id !== pendingEditSuggestionId),
      );
      setPendingEditSuggestionId(null);
    }
  };

  const handleEditRule = (rule: OrgDbRule, originalIndex: number) => {
    setEditingIndex(originalIndex);
    setIsModalOpen(true);
  };

  const handleDeleteRule = (originalIndex: number) => {
    setRuleToDelete(originalIndex);
    setDeleteDialogOpen(true);
  };

  const handleToggleRuleActive = async (
    originalIndex: number,
    active: boolean,
    rule: OrgDbRule,
  ) => {
    await updateRule(originalIndex, {
      title: rule.title,
      category: rule.category,
      rule: rule.rule,
      is_active: active,
    });
  };

  const confirmDelete = async () => {
    if (ruleToDelete !== null) {
      await deleteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  return (
    <>
      <RulesExamplesHeader
        variant="rules"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onToggleActiveFilter={setShowOnlyActive}
        onAdd={handleAddRule}
        readOnly={readOnly}
        addButtonSlot={
          showSuggestions && !readOnly ? (
            <RuleSuggestionsPopover
              suggestions={suggestions}
              onSuggestionsChange={setSuggestions}
              onCreateManually={handleAddRule}
              onAccept={handleSuggestionAccept}
              onEditAndAccept={handleSuggestionEditAndAccept}
              onDecline={handleSuggestionDecline}
            />
          ) : undefined
        }
      />

      <ScrollArea className="h-full w-full px-6">
        <div className="mx-auto max-w-7xl">
          <RulesExamplesList
            variant="rules"
            items={rules}
            searchQuery={searchQuery}
            showOnlyActive={showOnlyActive}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggleActive={handleToggleRuleActive}
            onAdd={handleAddRule}
            readOnly={readOnly}
            renderCard={(rule, index, props) => (
              <RuleCard
                key={`rule-${rule.orgdb_rule_id}`}
                rule={rule}
                index={index}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                onToggleActive={props.onToggleActive}
                isLast={props.isLast}
                readOnly={readOnly}
              />
            )}
            getSearchableContent={(rule) => rule.rule}
          />
        </div>
      </ScrollArea>

      <RuleFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSuggestionPrefill(null);
            setPendingEditSuggestionId(null);
          }
        }}
        editingIndex={editingIndex}
        prefill={suggestionPrefill}
        onSaved={handleModalSaved}
      />

      <DeleteConfirmationAlert
        title={t("businessRules.delete.title")}
        description={t("businessRules.delete.description")}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
};
