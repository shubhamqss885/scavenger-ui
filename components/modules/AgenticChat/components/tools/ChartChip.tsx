"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useContextSelector } from "use-context-selector";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { MaximizeBackdrop } from "@/components/ui/maximize-backdrop";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import { getToolCallChartData } from "@/lib/services/agenticChatService";
import { renderChartToCanvas } from "@/lib/utils/renderUtils";
import type { AgenticChartSpec, ChartBlock } from "../../types";
import ChartSkeleton from "./ChartSkeleton";
import { AgenticChatContext } from "../../AgenticChatContext";
import WidgetResultActions from "@/components/blocks/WidgetResultActions";

// recharts (~250-340 kB) is split out of the agent route's First Load JS and
// loaded on demand. The chunk is prefetched on idle and also eagerly preloaded
// on chat mount (see AgenticChatLayout) so history charts render with no wait.
const AgenticChart = dynamic(
  () => import(/* webpackPrefetch: true */ "./AgenticChart"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const ChartChip = ({
  block,
  toolCallId,
  needsFetch,
  isError: isErrorProp,
  isCancelled,
  title,
  durationMs,
  showCorrection,
  onSendCorrection,
  isFirst,
  isLast,
}: Readonly<{
  block: ChartBlock | null;
  toolCallId?: string;
  needsFetch?: boolean;
  isError?: boolean;
  isCancelled?: boolean;
  title?: string;
  durationMs?: number;
  showCorrection?: boolean;
  onSendCorrection?: (query: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}>) => {
  const { t } = useTranslation("agentic-chat");
  const orgdbId = useContextSelector(AgenticChatContext, (ctx) => ctx?.orgdbId);
  const groupId = useContextSelector(AgenticChatContext, (ctx) => ctx?.groupId);
  const isGroupChat = Boolean(groupId);
  const [expanded, setExpanded] = useState(true);
  const [fetchedSpec, setFetchedSpec] = useState<AgenticChartSpec | null>(null);
  const [fetchedLegacyImage, setFetchedLegacyImage] = useState<string | null>(
    null,
  );
  const [fetchError, setFetchError] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Lazy-fetch chart data from history when not provided via WS
  useEffect(() => {
    if (block || !toolCallId || !needsFetch || isCancelled) return;

    let cancelled = false;
    getToolCallChartData(toolCallId)
      .then((result) => {
        if (cancelled) return;
        if (typeof result === "string") {
          // Legacy: base64 data URL from old chart_image
          setFetchedLegacyImage(result);
        } else {
          setFetchedSpec(result);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [block, toolCallId, needsFetch, isCancelled]);

  // Auto-expand when maximized
  useEffect(() => {
    if (isMaximized) setExpanded(true);
  }, [isMaximized]);

  // Auto-focus textarea when correction opens
  useEffect(() => {
    if (correctionOpen) textareaRef.current?.focus();
  }, [correctionOpen]);

  // Clean up copy-feedback timer on unmount
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const chartSpec = block?.chart_spec ?? fetchedSpec;
  const legacyImage = fetchedLegacyImage;
  const hasError = isErrorProp || fetchError;
  const isReady = !!chartSpec || !!legacyImage;
  const isLoading = !isCancelled && !isReady && !hasError;
  const displayTitle = chartSpec?.title || title || t("status.generatingChart");

  const handleSendCorrection = () => {
    if (!correctionText.trim() || !onSendCorrection) return;

    const message = [
      t("chart.correction.prefix", { title: displayTitle }),
      t("chart.correction.instruction"),
      correctionText.trim(),
      t("chart.correction.suffix"),
    ].join("\n");

    onSendCorrection(message);
    setCorrectionText("");
    setCorrectionOpen(false);
  };

  const handleCopyChart = useCallback(async () => {
    setIsCopying(true);

    // Yield to let React paint "Copying..." before the heavy html2canvas work
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

    try {
      if (legacyImage) {
        const res = await fetch(legacyImage);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        setCopied(true);
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
        return;
      }

      const wrapperEl = chartContainerRef.current;

      if (!wrapperEl) return;

      const canvas = await renderChartToCanvas(wrapperEl, {
        height: wrapperEl.scrollHeight + 48,
        backgroundColor: "#ffffff",
        // The legacy Text2SQL adjustments (-4px wrapper, -14px label margin)
        // are tuned for that card's layout and don't apply here — the agentic
        // card has no `.legend-label` elements and a different wrapper offset.
        adjustLegend: false,
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll<HTMLElement>("[data-chart-title]")
            .forEach((titleEl) => {
              titleEl.style.lineHeight = "1.8";
              titleEl.style.paddingTop = "8px";
              titleEl.style.paddingBottom = "16px";
            });

          const el = clonedDoc.querySelector("[data-chart]") as HTMLElement;

          if (el) {
            el.style.aspectRatio = "auto";
            el.style.paddingBottom = "24px";
            el.style.backgroundColor = "#ffffff";
            void el.offsetHeight; // force reflow in clone
          }

          // Recharts' default legend renders each item with an inline-block
          // <svg> icon next to a <span> text label. html2canvas mis-rasterizes
          // the baseline so the icon sits a few px above the text. Modern CSS
          // (flexbox, vertical-align) gets ignored at rasterization, and the
          // text is a <span> so margin-top has no effect — relative + top is
          // the only thing html2canvas honors here. Same magic-number style
          // of fix as the legacy Text2SQL legend tweak in renderUtils.ts.
          clonedDoc
            .querySelectorAll<HTMLElement>(".recharts-legend-item-text")
            .forEach((text) => {
              text.style.position = "relative";
              text.style.top = "-5px";
            });
        },
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1),
      );

      if (!blob) throw new Error("Failed to create image blob");
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("chart.copyFailed"));
    } finally {
      setIsCopying(false);
    }
  }, [legacyImage, t]);

  const cardContent = (
    <div
      className={cn(
        "w-full border border-slate-200 bg-white text-left transition-colors dark:border-slate-700 dark:bg-slate-900",
        !isMaximized && isFirst !== false && "rounded-t-lg",
        !isMaximized && isLast !== false && "rounded-b-lg",
        !isMaximized && !isFirst && "border-t-0",
        isMaximized &&
          "fixed inset-0 z-[70] m-16 flex w-auto flex-col overflow-hidden rounded-[24px] border bg-background p-6 shadow-2xl",
      )}
    >
      {!isMaximized && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
          >
            <Icon
              name="ChevronRight"
              size="xxs"
              className={cn(
                "shrink-0 text-slate-400 transition-transform dark:text-slate-500",
                expanded && "rotate-90",
              )}
            />
            {isLoading ? (
              <span className="flex shrink-0 items-center gap-0.5">
                <span
                  className="h-2 w-2 rounded-full bg-amber-400"
                  style={{ animation: "sqlPulse 1.4s step-end infinite" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-amber-400"
                  style={{
                    opacity: 0.15,
                    animation: "sqlPulse 1.4s step-end infinite 0.7s",
                  }}
                />
              </span>
            ) : (
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  isCancelled && !isReady
                    ? "bg-slate-300 dark:bg-slate-600"
                    : hasError && !isReady
                      ? "bg-red-400"
                      : "bg-green-500",
                )}
              />
            )}
            {/* Bar chart icon */}
            <Icon name="BarChart2" size="xs" className="shrink-0" />
            <span className="truncate">
              {isCancelled && !isReady
                ? t("chart.cancelled")
                : hasError && !isReady
                  ? t("chart.failedToGenerate")
                  : displayTitle}
            </span>
            {durationMs != null && (
              <span className="ml-1 shrink-0 whitespace-nowrap tabular-nums text-slate-400 dark:text-slate-500">
                {durationMs >= 1000
                  ? `${(durationMs / 1000).toFixed(1)} s`
                  : `${durationMs} ms`}
              </span>
            )}
          </button>

          <div className="flex shrink-0 items-center gap-2.5">
            {showCorrection && isReady && !isGroupChat && (
              <button
                onClick={() => setCorrectionOpen((v) => !v)}
                className="shrink-0 text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                {t("chart.suggestCorrection")}
              </button>
            )}
            {isReady && (
              <button
                onClick={handleCopyChart}
                disabled={isCopying}
                className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <Icon
                  name={copied ? "Check" : isCopying ? "Loader2" : "Copy"}
                  size="xxs"
                  className={
                    isCopying ? "animate-spin text-inherit" : "text-inherit"
                  }
                />
              </button>
            )}
            {chartSpec && orgdbId && block?.sql && !isGroupChat && (
              <WidgetResultActions
                widgetType="chart"
                title={displayTitle}
                sqlQuery={block.sql}
                cachedResult={chartSpec}
                orgdbId={orgdbId}
              />
            )}
          </div>
        </div>
      )}

      {(expanded || isMaximized) && isReady && (
        <div
          className={cn(
            "rounded-b-lg border-t border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950",
            isMaximized && "min-h-0 flex-1 border-t-0",
          )}
        >
          {chartSpec ? (
            <div
              ref={chartContainerRef}
              className={cn(isMaximized && "h-full")}
            >
              <AgenticChart spec={chartSpec} isMaximized={isMaximized} />
            </div>
          ) : legacyImage ? (
            // Legacy chart image is a runtime URL of unknown dimensions/origin
            // (often a data URL), so next/image isn't appropriate here; we
            // lazy-load the raw <img> instead.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={legacyImage}
              alt={displayTitle}
              className="rounded w-full"
              loading="lazy"
              decoding="async"
            />
          ) : null}

          {!isMaximized && showCorrection && correctionOpen && (
            <div className="mt-2 flex gap-2">
              <textarea
                ref={textareaRef}
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCorrection();
                  }
                }}
                placeholder={t("chart.correctionPlaceholder")}
                rows={2}
                className="flex-1 resize-none rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              <button
                onClick={handleSendCorrection}
                disabled={!correctionText.trim()}
                className={cn(
                  "shrink-0 self-end rounded-md px-3 py-1.5 text-xs font-medium",
                  correctionText.trim()
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                )}
              >
                {t("chart.send")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isMaximized) {
    return createPortal(
      <>
        <MaximizeBackdrop onClose={() => setIsMaximized(false)} />
        {cardContent}
      </>,
      document.body,
    );
  }

  return cardContent;
};
