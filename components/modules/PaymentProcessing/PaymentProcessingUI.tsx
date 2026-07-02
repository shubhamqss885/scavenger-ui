"use client";

import { Icon } from "@/components/ui/icon";
import { Detail, Small } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";

export interface PaymentProcessingUIProps {
  step: 1 | 2 | 3;
  isLoading: boolean;
  error?: Error | null;
  statusMessage?: string;
  onRetry?: () => void;
  stepLabels?: {
    step1: string;
    step2: string;
    step3: string;
  };
}

export const PaymentProcessingUI = ({
  step,
  isLoading,
  error,
  statusMessage,
  onRetry,
  stepLabels,
}: PaymentProcessingUIProps) => {
  const { t } = useTranslation("settings");

  // Use translations as defaults if not provided
  const labels = stepLabels ?? {
    step1: t("billing.checkoutCompleted"),
    step2: t("billing.processingSubscription"),
    step3: t("billing.settingUpAccount"),
  };

  const message = statusMessage ?? t("billing.verifyingActivation");

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 max-w-md">
      {/* Processing Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Icon
            name="Loader2"
            className="h-10 w-10 animate-spin text-primary"
          />
        </div>

        <div className="space-y-2">
          <Detail className="text-xl font-semibold">
            {t("billing.processing")}
          </Detail>
          <Small className="text-muted-foreground max-w-md">
            {t("billing.processingDescription")}
          </Small>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-3 max-w-sm">
        {/* Step 1 */}
        <div className="flex items-center gap-3">
          <Icon name="Check" className="h-4 w-4 text-primary shrink-0" />
          <Small>{labels.step1}</Small>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-3">
          <Icon
            name={step >= 2 && isLoading ? "Loader2" : "Check"}
            className={`h-4 w-4 shrink-0 ${
              step >= 2 && isLoading
                ? "animate-spin text-primary"
                : step >= 2
                  ? "text-primary"
                  : "text-muted-foreground"
            }`}
          />
          <Small className={step >= 2 ? "" : "text-muted-foreground"}>
            {labels.step2}
          </Small>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-3">
          <Icon
            name={step >= 3 ? "Check" : "Clock"}
            className={`h-4 w-4 shrink-0 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}
          />
          <Small className={step >= 3 ? "" : "text-muted-foreground"}>
            {labels.step3}
          </Small>
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center">
        <Small className="text-muted-foreground">
          {isLoading
            ? message
            : error
              ? t("billing.havingTrouble")
              : t("billing.almostReady")}
        </Small>
      </div>

      {/* Error state with retry option */}
      {error && !isLoading && onRetry && (
        <div className="text-center space-y-3 pt-4">
          <Small className="text-destructive">
            {t("billing.unableToComplete")}
          </Small>
          <button
            onClick={onRetry}
            className="text-primary hover:underline text-sm"
          >
            {t("billing.retry")}
          </button>
        </div>
      )}
    </div>
  );
};
