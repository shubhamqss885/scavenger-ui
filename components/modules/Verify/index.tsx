"use client";

import React, { useEffect, useState, useContext } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/lib/context/UserDataContext";
import { AxiosContext } from "@/lib/context/AuthContext";
import { sendVerificationEmail } from "@/lib/services/userService";
import { H4, P } from "@/components/ui/typography";
import { toast } from "sonner";
import SimpleHeader from "@/components/blocks/SimpleHeader";
import { useTranslation } from "@/lib/i18n/client";

const COOLDOWN_PERIOD = 30; // seconds

export default withPageAuthRequired(function VerifyPage() {
  const { t } = useTranslation("onboarding");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const { auth0User } = useUserContext();
  const { refreshSession } = useContext(AxiosContext);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const handleVerificationEmail = async () => {
    try {
      setIsEmailSending(true);
      await sendVerificationEmail();
      toast.success(t("verify.toasts.emailSentSuccess"));
      setCooldownTime(COOLDOWN_PERIOD);
    } catch (error) {
      toast.error(t("verify.toasts.emailSentError"));
      console.error("Failed to send verification email:", error);
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleVerificationCheck = async () => {
    try {
      setIsCheckingVerification(true);

      await refreshSession();

      toast.success(t("verify.toasts.verifiedSuccess"));
    } catch (error) {
      toast.error(t("verify.toasts.verifiedError"));
      console.error("Failed to check verification:", error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  return (
    <div className="modal fixed left-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-start overflow-y-auto bg-background">
      <SimpleHeader />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center p-4 lg:p-0">
        <div className="flex w-full flex-col items-center gap-8 text-center sm:-mt-12 sm:flex-row sm:items-start sm:justify-between sm:gap-12 sm:text-left">
          {/* Left side - Text content */}
          <div className="flex w-full max-w-2xl flex-col items-center sm:items-start">
            <H4 className="mb-2 text-lg sm:mb-1 sm:text-base">
              {t("verify.title")}
            </H4>
            <P className="text-xs font-medium leading-5">
              {t("verify.description")}
              <span className="mx-1 text-primary">{auth0User?.email}</span>
            </P>
            <P className="mt-6 text-xs font-medium leading-5 sm:mt-4">
              {t("verify.supportText")}{" "}
              <a
                className="underline hover:text-primary"
                href="mailto:support@scavenger-ai.com"
              >
                {t("verify.supportLink")}
              </a>
            </P>
          </div>

          {/* Right side - Buttons */}
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <Button
              variant="default"
              onClick={handleVerificationEmail}
              disabled={isEmailSending || cooldownTime > 0}
              className="w-full justify-center sm:min-w-40"
            >
              {isEmailSending
                ? t("verify.buttons.sending")
                : cooldownTime > 0
                  ? t("verify.buttons.resendIn", { count: cooldownTime })
                  : t("verify.buttons.sendVerification")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center sm:min-w-40"
              onClick={handleVerificationCheck}
              disabled={isCheckingVerification}
            >
              {isCheckingVerification
                ? t("verify.buttons.checking")
                : t("verify.buttons.verified")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
