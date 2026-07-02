"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  getShareToken,
  generateShareToken,
  revokeShareToken,
} from "@/lib/services/orgDashboardService";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";

type ShareLinkSectionProps = Readonly<{
  dashboardId: string;
}>;

const ShareLinkSection = ({ dashboardId }: ShareLinkSectionProps) => {
  const { t } = useTranslation("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // SSR guard: window is client-only.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = token
    ? `${origin}/dashboard/${dashboardId}?share=${token}`
    : "";

  // Load the current token when the dialog (and this section) mounts.
  useEffect(() => {
    (async () => {
      try {
        setToken(await getShareToken(dashboardId));
      } catch {
        toast.error(t("orgDashboard.shareLink.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [dashboardId, t]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      setToken(await generateShareToken(dashboardId));
    } catch {
      toast.error(t("orgDashboard.shareLink.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("orgDashboard.shareLink.copied"));
    } catch {
      toast.error(t("orgDashboard.shareLink.copyFailed"));
    }
  };

  const handleRevoke = async () => {
    // First click arms, second click revokes.
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }
    setRevoking(true);
    try {
      await revokeShareToken(dashboardId);
      setToken(null);
      setConfirmRevoke(false);
      toast.success(t("orgDashboard.shareLink.revoked"));
    } catch {
      toast.error(t("orgDashboard.shareLink.revokeFailed"));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t("orgDashboard.shareLink.section")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("orgDashboard.shareLink.helper")}
      </p>

      {loading ? (
        <div className="flex justify-center py-2">
          <Icon name="Loader2" size="sm" className="animate-spin" />
        </div>
      ) : token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="h-8 flex-1 text-xs"
              aria-label={t("orgDashboard.shareLink.urlLabel")}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={handleCopy}
              aria-label={t("orgDashboard.shareLink.copy")}
            >
              <Icon name="Copy" size="xs" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-destructive/50"
            onClick={handleRevoke}
            disabled={revoking}
          >
            {revoking ? (
              <Icon name="Loader2" size="xs" className="mr-1 animate-spin" />
            ) : (
              <Icon
                name="Trash2"
                size="xs"
                variant="destructive"
                className="mr-1"
              />
            )}
            {confirmRevoke
              ? t("orgDashboard.shareLink.revokeConfirm")
              : t("orgDashboard.shareLink.revoke")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Icon name="Loader2" size="xs" className="mr-1 animate-spin" />
          ) : (
            <Icon name="Link" size="xs" className="mr-1" />
          )}
          {t("orgDashboard.shareLink.generate")}
        </Button>
      )}
    </div>
  );
};

export default ShareLinkSection;
