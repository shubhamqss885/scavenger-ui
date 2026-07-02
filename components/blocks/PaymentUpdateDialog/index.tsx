"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePaymentEvents } from "@/lib/context/EventsContext/hooks/usePaymentEvents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import { P } from "@/components/ui/typography";

export const PaymentUpdateDialog = () => {
  const { t } = useTranslation("pricing");
  const router = useRouter();
  const { events: paymentEvents, clearEvents: clearPaymentEvents } =
    usePaymentEvents();
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const currentEvent = paymentEvents[0]; // Show first event

  // Countdown timer and auto-logout after 30 seconds
  useEffect(() => {
    if (currentEvent?.type === "subscription_deleted") {
      router.push("/home");

      setCountdown(30);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-logout after 30 seconds
      const logoutTimer = setTimeout(async () => {
        try {
          await clearPaymentEvents();
        } catch (error) {
          console.error("Failed to clear payment events:", error);
        }
        window.location.href = "/api/auth/logout";
      }, 30000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(logoutTimer);
      };
    }
  }, [currentEvent, clearPaymentEvents, router]);

  const handlePaymentDialogConfirm = async () => {
    setIsProcessing(true);
    try {
      // Clear payment notification events on backend
      await clearPaymentEvents();
      globalThis.location.href = "/home";
    } catch (error) {
      console.error("Failed to clear payment notification events:", error);
      toast.error(t("billing.paymentUpdate.errorMessage"));
      setIsProcessing(false);
    }
  };

  // Generate message based on event type
  const getMessage = () => {
    if (currentEvent?.type === "subscription_deleted") {
      return t("billing.paymentUpdate.fallbackMessage");
    }
    return t("billing.paymentUpdate.fallbackMessage");
  };

  return (
    <AlertDialog
      open={currentEvent?.type === "subscription_deleted"}
      onOpenChange={() => undefined}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-4 mb-2">
          <AlertDialogTitle className="text-2xl font-bold leading-tight text-center">
            {t("billing.paymentUpdate.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {getMessage()}
          </AlertDialogDescription>
          <P className="text-sm text-muted-foreground text-center">
            Logging out in {countdown} seconds...
          </P>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handlePaymentDialogConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? t("billing.paymentUpdate.buttonProcessing")
              : t("billing.paymentUpdate.buttonOk")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
