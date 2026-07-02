export type RuleSuggestion = {
  id: string;
  suggestion_type: "ADD" | "MODIFY" | "REMOVE";
  category: string;
  title: string;
  rule_text: string;
  reasoning: string;
  confidence: number;
  source_feedback_ids: string[];
  /** For MODIFY suggestions: the existing rule text before modification */
  existing_rule_text?: string;
};
