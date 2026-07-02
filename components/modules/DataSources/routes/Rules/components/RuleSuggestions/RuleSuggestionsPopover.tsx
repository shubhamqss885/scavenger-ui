"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { SuggestionCard } from "./SuggestionCard";
import { type RuleSuggestion } from "./types";

type RuleSuggestionsPopoverProps = {
  suggestions: RuleSuggestion[];
  onSuggestionsChange: (suggestions: RuleSuggestion[]) => void;
  onCreateManually: () => void;
  onAccept: (suggestion: RuleSuggestion) => void;
  onEditAndAccept: (suggestion: RuleSuggestion) => void;
  onDecline: (suggestion: RuleSuggestion) => void;
};

export const RuleSuggestionsPopover = ({
  suggestions,
  onSuggestionsChange,
  onCreateManually,
  onAccept,
  onEditAndAccept,
  onDecline,
}: RuleSuggestionsPopoverProps) => {
  const { t } = useTranslation("database");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDecline = (suggestion: RuleSuggestion) => {
    onSuggestionsChange(suggestions.filter((s) => s.id !== suggestion.id));
    onDecline(suggestion);
  };

  const handleAccept = (suggestion: RuleSuggestion) => {
    onSuggestionsChange(suggestions.filter((s) => s.id !== suggestion.id));
    onAccept(suggestion);
    if (suggestions.length <= 1) {
      setOpen(false);
    }
  };

  const handleEditAndAccept = (suggestion: RuleSuggestion) => {
    // Don't remove from list yet — only removed after successful save
    onEditAndAccept(suggestion);
    setOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // TODO: Replace with real API call to fetch suggestions
      await new Promise((resolve) => setTimeout(resolve, 1200));
      onSuggestionsChange([]);
    } catch {
      toast.error(t("businessRules.suggestions.refreshFailed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const suggestionCount = suggestions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="relative">
          <Icon name="Plus" size="sm" className="mr-1" variant="foreground" />
          {t("businessRules.actions.addRule")}
          {suggestionCount > 0 && (
            <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {suggestionCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[440px] p-0"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {/* Create manually option */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onCreateManually();
          }}
          className="flex w-full items-center gap-2 rounded-t-md border-b px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
        >
          <Icon name="Plus" size="sm" variant="muted" />
          <span>{t("businessRules.suggestions.createManually")}</span>
        </button>

        {/* Suggestions section */}
        <div className="flex items-center justify-between border-b bg-slate-50/50 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Icon name="Lightbulb" size="xs" variant="primary" />
            <span className="text-xs font-medium">
              {t("businessRules.suggestions.aiSuggestions")}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <Icon
              name="RefreshCw"
              size="xs"
              className={isRefreshing ? "mr-1 animate-spin" : "mr-1"}
            />
            {isRefreshing
              ? t("businessRules.suggestions.refreshing")
              : t("businessRules.suggestions.refresh")}
          </Button>
        </div>

        {suggestionCount > 0 ? (
          <div className="max-h-[420px] overflow-y-auto">
            <div className="space-y-2.5 p-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAccept}
                  onEditAndAccept={handleEditAndAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <Icon
              name="CheckCircle"
              size="md"
              variant="muted"
              className="mx-auto mb-2"
            />
            <p className="text-xs text-muted-foreground">
              {t("businessRules.suggestions.empty.title")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t("businessRules.suggestions.empty.description")}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
