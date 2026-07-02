"use client";

import { useContextSelector } from "use-context-selector";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { AgenticChatContext } from "../../AgenticChatContext";

// Floating opt-in for high-latency runs. Visibility + click handler come
// from the hook (see NOTIFY_BANNER_THRESHOLD_MS / requestNotifyOnDone).
const NotifyMeBanner = () => {
  const { t } = useTranslation("agentic-chat");
  const showNotifyBanner = useContextSelector(
    AgenticChatContext,
    (c) => c!.showNotifyBanner,
  );
  const notifyOnDone = useContextSelector(
    AgenticChatContext,
    (c) => c!.notifyOnDone,
  );
  const requestNotifyOnDone = useContextSelector(
    AgenticChatContext,
    (c) => c!.requestNotifyOnDone,
  );

  if (!showNotifyBanner) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 sm:top-6",
        "duration-200 animate-in fade-in slide-in-from-top-2",
      )}
    >
      <button
        type="button"
        onClick={notifyOnDone ? undefined : requestNotifyOnDone}
        disabled={notifyOnDone}
        className={cn(
          "pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full",
          "border px-5 py-2.5 text-sm font-medium shadow-md",
          "transition-colors duration-300",
          notifyOnDone
            ? "cursor-default border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        )}
      >
        {/* Bell ↔ Check crossfade; stacked so the label doesn't shift. */}
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <Icon
            name="Bell"
            size="sm"
            variant="primary"
            className={cn(
              "absolute inset-0 transition-all duration-300",
              notifyOnDone ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Icon
            name="Check"
            size="sm"
            variant="success"
            className={cn(
              "absolute inset-0 transition-all duration-300",
              notifyOnDone ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
        {t("chat.notifyOnDone")}
      </button>
    </div>
  );
};

export default NotifyMeBanner;
