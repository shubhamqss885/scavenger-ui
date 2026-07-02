"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

type Props = {
  label: string;
  required?: boolean;
  /** Refresh token when connected, empty string otherwise. */
  value: string;
  onChange: (refreshToken: string, accessToken: string) => void;
  onBlur?: () => void;
};

export const GcpOAuthButton = ({
  label,
  required,
  value,
  onChange,
  onBlur,
}: Props) => {
  const { t } = useTranslation("connectors");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // Stores the CSRF state nonce for the current in-flight OAuth attempt.
  const stateRef = useRef<string | null>(null);

  // Cancel pending listeners / timers on unmount.
  useEffect(() => () => cleanupRef.current?.(), []);

  const cleanup = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  };

  const handleConnect = () => {
    setLoading(true);
    setError(null);

    const state = crypto.randomUUID();
    stateRef.current = state;

    const popup = window.open(
      `/api/oauth/google/start?state=${state}`,
      "google_oauth",
      "width=520,height=640,scrollbars=yes,resizable=yes",
    );

    if (!popup) {
      setError(t("gcpButton.popupBlocked"));
      setLoading(false);
      return;
    }

    const onMessage = (event: MessageEvent) => {
      // Reject messages from any origin other than this app.
      if (event.origin !== globalThis.location.origin) return;

      const data = event.data as
        | {
            type: "google_oauth_success";
            refresh_token: string;
            email: string;
            access_token: string;
            state: string;
          }
        | { type: "google_oauth_error"; error: string; state: string }
        | null;

      if (!data) return;

      // Validate state to reject replayed / unrelated OAuth callbacks (CSRF).
      if (data.state !== stateRef.current) return;

      if (data.type === "google_oauth_success") {
        cleanup();
        setLoading(false);
        setEmail(data.email);
        onChange(data.refresh_token, data.access_token);
        onBlur?.();
      } else if (data.type === "google_oauth_error") {
        cleanup();
        setLoading(false);
        setError(data.error || t("gcpButton.authFailed"));
      }
    };

    const pollId = setInterval(() => {
      if (popup?.closed) {
        cleanup();
        setLoading(false);
      }
    }, 500);

    window.addEventListener("message", onMessage);
    cleanupRef.current = () => {
      clearInterval(pollId);
      window.removeEventListener("message", onMessage);
    };
  };

  const handleDisconnect = () => {
    cleanup();
    setEmail(null);
    setError(null);
    stateRef.current = null;
    onChange("", "");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}
        {!required && (
          <span className="ml-1 font-normal text-muted-foreground">
            {t("form.fieldOptional")}
          </span>
        )}
      </label>

      {value ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/30">
          <Icon
            name="CheckCircle2"
            size="xs"
            className="mt-px shrink-0 text-green-600 dark:text-green-400"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-green-800 dark:text-green-200">
              {t("gcpButton.connected")}
            </p>
            {email && (
              <p className="truncate text-[11px] text-green-700 dark:text-green-300">
                {email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            aria-label={t("gcpButton.disconnect")}
            className="shrink-0 text-green-500 hover:text-green-700 dark:hover:text-green-300"
          >
            <Icon name="X" size="xs" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          onBlur={onBlur}
          disabled={loading}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5",
            "text-xs font-medium transition-colors",
            error
              ? "border-destructive/60 text-foreground hover:border-destructive"
              : "border-border text-foreground hover:border-primary/50 hover:bg-muted/40",
            loading && "cursor-wait opacity-70",
          )}
        >
          {loading ? (
            <Icon name="Loader2" size="xs" className="shrink-0 animate-spin" />
          ) : (
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="flex-1 text-left">
            {loading ? t("gcpButton.connecting") : t("gcpButton.signIn")}
          </span>
        </button>
      )}

      {error && (
        <div className="flex items-start gap-1.5">
          <Icon
            name="AlertCircle"
            size="xxs"
            variant="destructive"
            className="mt-px shrink-0"
          />
          <p className="text-[11px] text-destructive">{error}</p>
        </div>
      )}

      {!value && !error && (
        <p className="text-[11px] text-muted-foreground">
          {t("gcpButton.grantsReadAccess")}
        </p>
      )}
    </div>
  );
};
