"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import type { LogoutReason } from "@/lib/services/axiosInstances/logoutReasonTypes";

const AUTO_REDIRECT_DELAY = 30000;

type Props = Readonly<{
  reason: LogoutReason;
}>;

const ForceLogoutModal = ({ reason }: Props) => {
  const { t } = useTranslation("auth");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auto-redirect after 30s if user doesn't click OK
  useEffect(() => {
    const timeout = setTimeout(() => {
      globalThis.location.href = "/api/auth/logout";
    }, AUTO_REDIRECT_DELAY);

    return () => clearTimeout(timeout);
  }, []);

  const handleLogout = () => {
    setIsRedirecting(true);
    globalThis.location.href = "/api/auth/logout";
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Icon name="ShieldAlert" size="md" variant="destructive" />
            </div>
            <AlertDialogTitle>
              {t("session.forceLogout.title")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {t(`session.forceLogout.${reason}`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogout} disabled={isRedirecting}>
            {isRedirecting ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : (
              t("session.forceLogout.ok")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ForceLogoutModal;
