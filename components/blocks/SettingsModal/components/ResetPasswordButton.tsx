"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/services/userService";
import { useTranslation } from "@/lib/i18n/client";

const SENT_DISPLAY_MS = 3000;
const COOLDOWN_SECONDS = 60;

export const ResetPasswordButton = () => {
  const { t } = useTranslation("settings");
  const [isSending, setIsSending] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(
      () => setCooldownSeconds((prev) => prev - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!showSent) return;
    const timer = setTimeout(() => setShowSent(false), SENT_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [showSent]);

  const handleClick = async () => {
    setIsSending(true);
    try {
      await requestPasswordReset();
      setShowSent(true);
      setCooldownSeconds(COOLDOWN_SECONDS);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast.error(t("account.messages.resetEmailFailed"));
    } finally {
      setIsSending(false);
    }
  };

  const label = (() => {
    if (isSending) return t("account.password.sendingButton");
    if (showSent) return t("account.password.sentButton");
    if (cooldownSeconds > 0)
      return t("account.password.cooldown", { seconds: cooldownSeconds });
    return t("account.password.resetButton");
  })();

  const disabled = isSending || showSent || cooldownSeconds > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("account.password.description")}
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={disabled}
        aria-live="polite"
      >
        {label}
      </Button>
    </div>
  );
};
