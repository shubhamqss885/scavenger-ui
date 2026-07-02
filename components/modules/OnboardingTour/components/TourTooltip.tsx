"use client";

import { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Large, P, Detail } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";

export const TourTooltip = ({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) => {
  const { t } = useTranslation("home");

  return (
    <div
      {...tooltipProps}
      className="relative grid w-[360px] max-w-[90vw] gap-4 rounded-lg bg-background p-6 shadow-lg"
    >
      <button
        {...closeProps}
        className="absolute right-5 top-5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Icon name="X" size="sm" variant="foreground" />
        <span className="sr-only">{step.locale.close}</span>
      </button>

      <div className="flex flex-col space-y-1.5 pr-6 text-left">
        <Detail>
          {t("onboardingTour.progress", "Step {{current}} of {{total}}", {
            current: index + 1,
            total: size,
          })}
        </Detail>
        {step.title && (
          <Large className="leading-none tracking-tight">{step.title}</Large>
        )}
        <P className="pt-2 leading-5 text-muted-foreground">{step.content}</P>
      </div>

      <div className="flex flex-row items-center justify-between gap-2">
        <Button variant="ghost" size="sm" {...skipProps}>
          {step.locale.skip}
        </Button>
        <div className="flex flex-row items-center gap-2">
          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              {step.locale.back}
            </Button>
          )}
          <Button variant="default" size="sm" {...primaryProps}>
            {isLastStep ? step.locale.last : step.locale.next}
          </Button>
        </div>
      </div>
    </div>
  );
};
