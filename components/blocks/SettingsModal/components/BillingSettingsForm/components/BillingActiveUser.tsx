"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Detail, Small, H3, H4 } from "@/components/ui/typography";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useDashboardStatsState } from "@/lib/context/DashboardStatsProvider";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { plans } from "@/components/modules/Pricing/pricingData";
import { AlertDialogWithoutTrigger } from "@/components/blocks/AlertDialog";
import { createBillingPortalSession } from "@/lib/services/paymentService";
import { SUPPORT_EMAIL, MAX_CALENDAR_MEETING_LINK } from "@/lib/constants";
import Link from "next/link";

export function BillingActiveUser() {
  const { t } = useTranslation("settings");
  const { t: tPricing } = useTranslation("pricing");
  const { userProfile, cancelUserSubscription } = useUserContext();
  const { dashboardStats } = useDashboardStatsState();

  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [isManageLoading, setIsManageLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [clickedButton, setClickedButton] = useState<"manage" | "renew" | null>(
    null,
  );

  // Calculate usage percentages for progress bars
  const usageMB = +dashboardStats.storageUsage.toFixed(0);
  const totalMB = +dashboardStats.totalStorage.toFixed(0);
  const storagePercentage =
    totalMB > 0 ? Math.round((usageMB / totalMB) * 100) : 0;

  const projectPercentage = dashboardStats?.projectLimit
    ? Math.round(
        (dashboardStats.totalProjects / dashboardStats.projectLimit) * 100,
      )
    : 0;

  const messagePercentage = dashboardStats?.messageLimit
    ? Math.round(
        (dashboardStats.totalMessage / dashboardStats.messageLimit) * 100,
      )
    : 0;

  const dataSourcePercentage = dashboardStats?.dataSourcesLimit
    ? Math.round(
        (dashboardStats.totalDataSources / dashboardStats.dataSourcesLimit) *
          100,
      )
    : 0;

  // Get current plan data from pricing
  const currentPlan = plans.find((plan) => plan.id === "private") || plans[1]; // Default to private plan
  const currentPlanName = currentPlan.displayName;

  // Determine billing frequency from plan_name ("Annual Plan" or "Monthly Plan")
  const planName = userProfile?.subscription?.plan_name || "";
  const isYearly = planName.toLowerCase().includes("annual");

  // Get price from centralized pricing data
  const monthlyPrice = currentPlan.price.monthly as number;
  const yearlyPrice = currentPlan.price.yearly as number;
  const yearlyTotalPrice = yearlyPrice * 12;

  const currentPrice = isYearly ? yearlyTotalPrice : monthlyPrice;
  const displayPrice = `€${currentPrice}`;

  const handleCancelSubscription = () => {
    if (!userProfile?.subscription?.subscription_id) {
      toast.error(t("billing.noSubscription"));
      return;
    }

    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!userProfile?.subscription?.subscription_id) return;

    setIsCancelLoading(true);
    setShowCancelDialog(false);
    try {
      await cancelUserSubscription(userProfile.subscription.subscription_id);
    } catch {
      // Error handling is done in UserContext
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleManageBilling = async (source: "manage" | "renew" = "manage") => {
    setClickedButton(source);
    setIsManageLoading(true);
    try {
      const baseUrl = globalThis.location.origin;
      const currentPath = globalThis.location.pathname;
      const returnUrl = `${baseUrl}${currentPath}?modal=settings&tab=billing`;
      const response = await createBillingPortalSession({
        return_url: returnUrl,
      });

      if (response.data?.portal_url) {
        globalThis.location.href = response.data.portal_url;
      } else {
        toast.error(t("billing.portalError"));
      }
    } catch (error) {
      console.error("Failed to create billing portal session:", error);
      toast.error(t("billing.portalError"));
    } finally {
      setIsManageLoading(false);
      setClickedButton(null);
    }
  };

  const handleContactSupport = () => {
    globalThis.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <>
      {/* Current Plan Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <H3>
            {t("billing.currentPlan")}: {tPricing(currentPlanName)}
          </H3>
          {/* active since */}
          {userProfile?.subscription?.subscribed_at && (
            <Small className="text-muted-foreground">
              {t("billing.activeSince")}:{" "}
              {new Date(
                userProfile.subscription.subscribed_at,
              ).toLocaleDateString(userProfile?.locale || "en-US", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Small>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant={
              userProfile?.subscription?.status === "active"
                ? "default"
                : "secondary"
            }
            className="pointer-events-none"
          >
            {userProfile?.subscription?.status === "active"
              ? t("billing.statusActive", "Active")
              : t("billing.statusInactive", "Inactive")}
          </Badge>
        </div>
      </div>
      {/* Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Current Plan Details */}
        <div className="">
          {/* Pricing Display */}
          <div className="bg-muted rounded-lg p-4">
            <H4>
              {displayPrice}/{isYearly ? t("billing.year") : t("billing.month")}
            </H4>
            {/* Next Billing */}
            {userProfile?.subscription?.next_billing_date && (
              <div>
                <Small className="text-muted-foreground">
                  {t("billing.nextBilling")}:{" "}
                  {new Date(
                    userProfile.subscription.next_billing_date,
                  ).toLocaleDateString(userProfile?.locale || "en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Small>
              </div>
            )}
            {/* active till */}
            {userProfile?.subscription?.cancelled_at && (
              <div className="flex flex-row items-end justify-between">
                <div>
                  <Badge
                    variant="destructive"
                    className="-ml-1 bg-yellow-50 text-yellow-700 border-yellow-100 px-1.5 mt-2 shadow-none pointer-events-none"
                  >
                    <Icon
                      name="AlertTriangle"
                      size="xxs"
                      variant="warning"
                      className="mr-1.5"
                    />
                    {t("billing.subscriptionCancelled")}
                  </Badge>
                  <Small className="text-muted-foreground mt-2">
                    {t("billing.activeTill")}:{" "}
                    {new Date(
                      userProfile.subscription.cancelled_at,
                    ).toLocaleDateString(userProfile?.locale || "en-US", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </Small>
                </div>
                <Button
                  onClick={() => handleManageBilling("renew")}
                  disabled={isManageLoading}
                  size="sm"
                  className="w-[52px] h-5 text-[10px] leading-none -mb-1"
                >
                  {isManageLoading && clickedButton === "renew" ? (
                    <Icon name="Loader2" size="xxs" className="animate-spin" />
                  ) : (
                    t("billing.renew", "Renew")
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="space-y-2 mt-6">
            {currentPlan.features.slice(0, 4).map((feature, index) => {
              const featureKey =
                typeof feature === "string" ? feature : feature.key;
              return (
                <div key={index} className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-600" />
                  <Small>{tPricing(featureKey)}</Small>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Usage Overview */}
        <div className="space-y-3">
          {/* Usage Header */}
          <div className="flex items-center justify-between">
            <Detail className="font-semibold ">
              {t("billing.usageOverview", "Usage Overview")}
            </Detail>
          </div>

          {/* Usage Metrics */}
          <div className="space-y-4">
            {/* Data Sources */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Small className="font-medium">
                  {t("billing.dataSources", "Data Sources")}
                </Small>
                <Small className="text-muted-foreground">
                  {dashboardStats?.totalDataSources || 0}/
                  {dashboardStats?.dataSourcesLimit === -1
                    ? "∞"
                    : dashboardStats?.dataSourcesLimit || 0}
                </Small>
              </div>
              {dashboardStats?.dataSourcesLimit !== -1 && (
                <Progress
                  value={dataSourcePercentage}
                  className="h-2 bg-muted"
                />
              )}
            </div>
            {/* Storage */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Small className="font-medium">Storage Used</Small>
                <Small className="text-muted-foreground">
                  {usageMB}
                  MB/
                  {totalMB}
                  MB
                </Small>
              </div>
              <Progress value={storagePercentage} className="h-2 bg-muted" />
            </div>

            {/* Projects */}
            {/* <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Small className="font-medium">
                  {t("billing.projects", "Projects")}
                </Small>
                <Small className="text-muted-foreground">
                  {dashboardStats?.totalProjects || 0}/
                  {dashboardStats?.projectLimit === -1
                    ? "∞"
                    : dashboardStats?.projectLimit || 0}
                </Small>
              </div>
              {dashboardStats?.projectLimit !== -1 && (
                <Progress value={projectPercentage} className="h-2 bg-muted" />
              )}
            </div> */}

            {/* Messages */}
            {/* <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Small className="font-medium">
                  {t("billing.messages", "Messages")}
                </Small>
                <Small className="text-muted-foreground">
                  {dashboardStats?.totalMessage || 0}/
                  {dashboardStats?.messageLimit === -1
                    ? "∞"
                    : dashboardStats?.messageLimit || 0}
                </Small>
              </div>
              {dashboardStats?.messageLimit !== -1 && (
                <Progress value={messagePercentage} className="h-2 bg-muted" />
              )}
            </div> */}

            {userProfile?.subscription?.status === "active" && (
              <div className="flex justify-end items-center">
                <Small className="">{t("billing.needMoreSpace")}</Small>
                <Button
                  asChild
                  size="sm"
                  variant="link"
                  className="h-6leading-none px-1"
                >
                  <Link
                    href={MAX_CALENDAR_MEETING_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("billing.upgradeToEnterprise")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Billing Management */}
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <Detail className="font-semibold">
            {t("billing.management", "Billing Management")}
          </Detail>
          <Small className="text-muted-foreground">
            {t(
              "billing.managementDescription",
              "Manage your payment methods and billing history",
            )}
          </Small>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => handleManageBilling("manage")}
            disabled={isManageLoading}
            className="w-full sm:w-44"
          >
            {isManageLoading && clickedButton === "manage" ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                {t("billing.managingPayment", "Opening portal...")}
              </>
            ) : (
              <>
                <Icon name="ExternalLink" className="mr-2 h-4 w-4" />
                {t("billing.managePayment", "Manage Payments")}
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Refund Request */}
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between mb-10">
        <div className="space-y-1">
          <Detail className="font-semibold">
            {t("billing.refundRequest.title", "Refund Request")}
          </Detail>
          <Small className="text-muted-foreground">
            {t(
              "billing.refundRequest.description",
              "Need a refund? Contact our customer support team for assistance",
            )}
          </Small>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleContactSupport} className="w-full sm:w-44">
            <Icon name="Mail" className="mr-2 h-4 w-4" />
            {t("billing.refundRequest.button", "Contact Support")}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      {userProfile?.subscription?.next_billing_date && (
        <>
          <Separator className="mb-10" />
          <div className="flex flex-row">
            <div className="w-1/2">
              <Small>{t("billing.cancelSubscription.title")}</Small>
            </div>
            <div className="w-1/2">
              <Button
                type="button"
                variant="destructive"
                className="w-full mb-1.5"
                onClick={handleCancelSubscription}
                disabled={isCancelLoading}
              >
                {isCancelLoading
                  ? t("billing.cancelSubscription.downgradingButton")
                  : t("billing.cancelSubscription.button")}
              </Button>
              <Small className="text-xs text-slate-500 leading-5">
                {t("billing.cancelSubscription.description")}
              </Small>
            </div>
          </div>
        </>
      )}

      <AlertDialogWithoutTrigger
        isOpen={showCancelDialog}
        setIsOpen={setShowCancelDialog}
        title={t("billing.cancelDialog.title")}
        description={t("billing.cancelDialog.description")}
        cancelText={t("billing.cancelDialog.cancel")}
        actionText={t("billing.cancelDialog.confirm")}
        onCancel={() => setShowCancelDialog(false)}
        onAction={handleConfirmCancel}
      />
    </>
  );
}
