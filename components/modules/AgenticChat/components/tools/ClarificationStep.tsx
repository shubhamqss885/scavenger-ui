import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { ClarificationData } from "../../types";

type ClarificationStepProps = Readonly<{
  data: ClarificationData;
}>;

// Extract the actual answer from the verbose wrapper the backend persists:
// "Response of Clarification Question: <question> IS Answer: <answer>" → "<answer>".
// Uses lastIndexOf so a question that itself contains " IS Answer: " can't
// hijack the match, and so multi-line answers don't fall back to the raw blob.
const ANSWER_MARKER = " IS Answer: ";
const parseAnswer = (raw: string): string => {
  const idx = raw.lastIndexOf(ANSWER_MARKER);
  return idx >= 0 ? raw.slice(idx + ANSWER_MARKER.length) : raw;
};

export const ClarificationStep = ({ data }: ClarificationStepProps) => {
  const { t } = useTranslation("agentic-chat");

  const answer = parseAnswer(data.answer);

  // Show "Other:" only when answer doesn't match any provided option
  const isOtherAnswer =
    !!data.options?.length && !data.options.some((opt) => answer.includes(opt));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">{t("clarification.questionLabel")}</span>{" "}
        {data.question}
      </p>

      {data.options && data.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.options.map((option) => {
            const isSelected = answer.includes(option);
            return (
              <span
                key={option}
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-xs",
                  isSelected
                    ? "border border-primary bg-primary/10 font-medium text-primary"
                    : "border border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400",
                )}
              >
                {option}
              </span>
            );
          })}
        </div>
      )}

      {isOtherAnswer && answer && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium">{t("clarification.otherLabel")}</span>{" "}
          {answer}
        </p>
      )}
    </div>
  );
};
