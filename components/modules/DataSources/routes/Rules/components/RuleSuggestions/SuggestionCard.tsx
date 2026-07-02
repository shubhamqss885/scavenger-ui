"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { RuleSuggestion } from "./types";

type SuggestionCardProps = {
  suggestion: RuleSuggestion;
  onAccept: (suggestion: RuleSuggestion) => void;
  onEditAndAccept: (suggestion: RuleSuggestion) => void;
  onDecline: (suggestion: RuleSuggestion) => void;
};

export const SuggestionCard = ({
  suggestion,
  onAccept,
  onEditAndAccept,
  onDecline,
}: SuggestionCardProps) => {
  const { t } = useTranslation("database");
  const [showReasoning, setShowReasoning] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const isAdd = suggestion.suggestion_type === "ADD";
  const isModify = suggestion.suggestion_type === "MODIFY";
  const isRemove = suggestion.suggestion_type === "REMOVE";

  if (isDeclining) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border bg-white p-3",
        isAdd && "border-l-4 border-l-emerald-400",
        isModify && "border-l-4 border-l-amber-400",
        isRemove && "border-l-4 border-l-red-400",
      )}
    >
      {/* Header row: type badge, category, confidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge
            className={cn(
              "px-1.5 py-0 text-[10px] font-semibold uppercase",
              isAdd &&
                "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
              isModify &&
                "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
              isRemove &&
                "border-red-200 bg-red-100 text-red-700 hover:bg-red-100",
            )}
          >
            {suggestion.suggestion_type}
          </Badge>
          <Badge
            variant="outline"
            className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
          >
            {suggestion.category}
          </Badge>
        </div>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {t("businessRules.suggestions.confidence", {
            value: Math.round(suggestion.confidence * 100),
          })}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-tight">{suggestion.title}</p>

      {/* Rule text */}
      {isRemove
        ? suggestion.rule_text && (
            <div className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5">
              <p className="text-xs leading-relaxed text-red-800 line-through decoration-red-300">
                {suggestion.rule_text}
              </p>
            </div>
          )
        : suggestion.rule_text && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {suggestion.rule_text}
            </p>
          )}

      {/* Diff view for MODIFY */}
      {isModify && suggestion.existing_rule_text && (
        <div className="space-y-1.5 rounded-md border bg-slate-50 p-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("businessRules.suggestions.changesToExisting")}
          </p>
          <div className="space-y-1">
            <div className="rounded border border-red-100 bg-red-50 px-2 py-1">
              <p className="text-[11px] leading-relaxed text-red-800">
                <span className="mr-1 font-medium text-red-500">-</span>
                {suggestion.existing_rule_text}
              </p>
            </div>
            <div className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1">
              <p className="text-[11px] leading-relaxed text-emerald-800">
                <span className="mr-1 font-medium text-emerald-500">+</span>
                {suggestion.rule_text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reasoning (expandable) */}
      <button
        type="button"
        onClick={() => setShowReasoning(!showReasoning)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name={showReasoning ? "ChevronDown" : "ChevronRight"} size="xs" />
        {t("businessRules.suggestions.reasoning")}
      </button>
      {showReasoning && (
        <p className="pl-4 text-[11px] italic leading-relaxed text-muted-foreground">
          {suggestion.reasoning}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {isRemove ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-red-200 px-2.5 text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => onAccept(suggestion)}
            >
              <Icon name="Trash2" size="xs" className="mr-1" />
              {t("businessRules.suggestions.actions.removeRule")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs text-muted-foreground"
              onClick={() => {
                setIsDeclining(true);
                onDecline(suggestion);
              }}
            >
              {t("businessRules.suggestions.actions.keepRule")}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-emerald-200 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => onAccept(suggestion)}
            >
              <Icon name="Check" size="xs" className="mr-1" />
              {t("businessRules.suggestions.actions.accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => onEditAndAccept(suggestion)}
            >
              <Icon name="Edit" size="xs" className="mr-1" />
              {t("businessRules.suggestions.actions.editAndAccept")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                setIsDeclining(true);
                onDecline(suggestion);
              }}
            >
              <Icon name="X" size="xs" className="mr-1" />
              {t("businessRules.suggestions.actions.decline")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
