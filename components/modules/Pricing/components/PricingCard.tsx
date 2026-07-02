import NumberFlow from "@number-flow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/blocks/InfoTooltip";
import { H3, Large, Muted, Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { Icon, IconName } from "@/components/ui/icon";
import type { Plan } from "../pricingData";

export type PricingCardVariant = "default" | "popular" | "current";

type PricingCardProps = Readonly<{
  plan: Plan;
  frequency: "monthly" | "yearly";
  variant: PricingCardVariant;
  onSubscribe: (planId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}>;

export const PricingCard = ({
  plan,
  frequency,
  variant,
  onSubscribe,
  disabled = false,
  isLoading = false,
}: PricingCardProps) => {
  const { t } = useTranslation("pricing");
  const isCurrentPlan = variant === "current";
  const isPopular = variant === "popular";

  const cardClasses = cn("relative w-full text-left transition-transform", {
    "ring-2 ring-primary pricing-card-popular": isPopular && !isCurrentPlan,
    "ring-2 ring-foreground": isCurrentPlan,
  });

  const getButtonVariant = () => {
    // Current Private plan - primary CTA for managing billing
    if (isCurrentPlan && plan.id === "private") return "dark";

    // Popular plan - primary CTA
    if (isPopular && !isCurrentPlan) return "default";

    // All other cases - secondary
    return "secondary";
  };

  const buttonVariant = getButtonVariant();

  const renderPriceBadge = () => {
    if (isCurrentPlan) {
      return (
        <Badge
          variant="secondary"
          className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 rounded-full"
        >
          {t("badges.currentPlan")}
        </Badge>
      );
    }

    if (isPopular) {
      return (
        <Badge className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 rounded-full pointer-events-none">
          {t("badges.popular")}
        </Badge>
      );
    }

    return null;
  };

  const renderPrice = () => {
    const price = plan.price[frequency];

    if (typeof price === "number") {
      return (
        <NumberFlow
          className="font-medium text-foreground text-xl text-wrap text-center"
          format={{
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }}
          suffix={t(`plans.private.monthBilled.${frequency}`)}
          value={price}
        />
      );
    }

    return <Large className="text-foreground">{t(price)}</Large>;
  };

  const renderButtonContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("badges.loading")}
        </>
      );
    }

    // Current plan - Private (manage billing)
    if (isCurrentPlan && plan.id === "private") {
      return (
        <>
          <Settings className="mr-2 h-4 w-4" />
          {t("badges.manageBilling")}
        </>
      );
    }

    // Current plan - other plans (disabled)
    if (isCurrentPlan) {
      return t("badges.currentPlan");
    }

    // Regular CTA with arrow (except demo)
    return (
      <>
        {t(plan.cta)}
        {plan.id !== "demo" && <ArrowRight className="ml-2 h-4 w-4" />}
      </>
    );
  };

  return (
    <Card className={cn("flex flex-col shadow-none", cardClasses)}>
      {renderPriceBadge()}

      <CardHeader>
        <CardTitle>
          <H3 className="mt-0">{t(plan.name)}</H3>
        </CardTitle>
        <CardDescription className="space-y-2">
          <Muted>{t(plan.description)}</Muted>
          <div>{renderPrice()}</div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <TooltipProvider>
          {plan.features.map((feature) => {
            const isFeatureObject = typeof feature === "object";
            const featureKey = isFeatureObject ? feature.key : feature;
            const tooltipKey = isFeatureObject ? feature.tooltipKey : undefined;
            const iconName = isFeatureObject ? feature.icon : undefined;

            return (
              <div className="flex items-start gap-2" key={featureKey}>
                <Icon
                  name={(iconName as IconName) || "Check"}
                  size="xs"
                  variant="success"
                />
                <div className="flex items-center gap-1 flex-1">
                  <Small className="text-muted-foreground leading-tight">
                    {t(featureKey)}
                  </Small>
                  {tooltipKey && <InfoTooltip text={t(tooltipKey)} />}
                </div>
              </div>
            );
          })}
        </TooltipProvider>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={buttonVariant}
          disabled={disabled}
          onClick={() => onSubscribe(plan.id)}
        >
          {renderButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
};
