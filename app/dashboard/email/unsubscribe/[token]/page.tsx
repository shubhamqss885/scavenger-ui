"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { unsubscribeByToken } from "@/lib/services/orgDashboardService";
import { useTranslation } from "@/lib/i18n/client";

type State = "loading" | "success" | "error";

const UnsubscribePage = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("dashboard");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    unsubscribeByToken(token)
      .then((res) => {
        setMessage(res.message);
        setState("success");
      })
      .catch(() => {
        setState("error");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icon
          name="Loader2"
          size="lg"
          className="animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      {state === "success" ? (
        <>
          <Icon name="CheckCircle2" size="lg" className="text-green-500" />
          <p className="text-base font-medium">{message}</p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              {t("orgDashboard.unsubscribe.successText")}
            </Button>
          </Link>
        </>
      ) : (
        <>
          <Icon name="AlertCircle" size="lg" variant="destructive" />
          <p className="text-sm text-muted-foreground">
            {t("orgDashboard.unsubscribe.errorText")}
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              {t("orgDashboard.unsubscribe.goToDashboards")}
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default UnsubscribePage;
