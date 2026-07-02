"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type InputBarShellProps = Readonly<{
  // Core
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  submitDisabled?: boolean;
  isLoading?: boolean;
  onStop?: () => void;

  // Textarea
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onFormClick?: () => void;
  autoFocus?: boolean;
  maxHeight?: number;

  // Layout
  viewTransitionName?: string;
  formDataTour?: string;
  className?: string;
  formClassName?: string;
  textareaRowClassName?: string;
  textareaClassName?: string;
  toolbarClassName?: string;

  // Slots
  topContent?: React.ReactNode;
  aboveTextarea?: React.ReactNode;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  belowShell?: React.ReactNode;
  // When provided, replaces the textarea+submit row (e.g. dictation waveform).
  inputOverride?: React.ReactNode;
}>;

const InputBarShell = ({
  input,
  onInputChange,
  onSubmit,
  placeholder,
  disabled = false,
  submitDisabled,
  isLoading = false,
  onStop,
  textareaRef: externalRef,
  onKeyDown,
  onFocus,
  onFormClick,
  autoFocus = false,
  maxHeight = 200,
  viewTransitionName,
  formDataTour,
  className,
  formClassName,
  textareaRowClassName,
  textareaClassName,
  toolbarClassName,
  topContent,
  aboveTextarea,
  toolbarLeft,
  toolbarRight,
  belowShell,
  inputOverride,
}: InputBarShellProps) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;

  // Auto-resize textarea. Also re-runs when `inputOverride` toggles off so the
  // freshly-remounted textarea picks up the right inline height instead of
  // falling back to the browser default (~60px for rows=2 with py-2.5).
  const isOverridden = !!inputOverride;
  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    const base = 40;
    el.style.height = `${base}px`;
    const target = Math.min(Math.max(el.scrollHeight, base), maxHeight);
    el.style.height = `${target}px`;
    el.style.overflowY = target >= maxHeight ? "auto" : "hidden";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, maxHeight, isOverridden]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      if (e.defaultPrevented) return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleFormClick = () => {
    onFormClick?.();
    textareaRef.current?.focus();
  };

  const isButtonDisabled = submitDisabled ?? (disabled || !input.trim());
  const hasToolbar = toolbarLeft || toolbarRight;

  return (
    <div className={cn("mx-auto w-full shrink-0", className)}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <form
        onSubmit={handleFormSubmit}
        onClick={handleFormClick}
        data-tour={formDataTour}
        style={
          viewTransitionName
            ? ({ viewTransitionName } as React.CSSProperties)
            : undefined
        }
        className={cn(
          "cursor-text rounded-lg border border-sidebar-border bg-white shadow-md outline-none dark:bg-slate-900",
          formClassName,
        )}
      >
        {topContent}

        {/* Textarea + send button row (or override, e.g. dictation waveform) */}
        {inputOverride ? (
          <div className="relative w-full">{inputOverride}</div>
        ) : (
          <div
            className={cn(
              "relative flex min-w-0 items-center gap-2 p-2 pl-3",
              textareaRowClassName,
            )}
          >
            {aboveTextarea}
            <Textarea
              ref={textareaRef}
              value={input}
              disabled={disabled}
              autoFocus={autoFocus}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder={placeholder}
              className={cn(
                "input-no-ios-zoom min-w-0 flex-1 resize-none !border-0 bg-transparent py-2.5 text-sm !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!shadow-none focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0",
                textareaClassName,
              )}
            />
            {isLoading ? (
              onStop ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className="h-8 w-8 shrink-0 rounded-md"
                  aria-label="Stop"
                >
                  <Icon
                    name="Pause"
                    size="xs"
                    className="fill-white text-white"
                  />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  disabled
                  className="h-8 w-8 shrink-0 rounded-md"
                >
                  <Icon
                    name="Pause"
                    size="xs"
                    className="fill-white text-white"
                  />
                </Button>
              )
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={isButtonDisabled}
                className="h-8 w-8 shrink-0 rounded-md"
              >
                <Icon name="ArrowUp" size="xs" className="text-white" />
              </Button>
            )}
          </div>
        )}

        {/* Bottom toolbar */}
        {/* min-h accommodates h-8 (32px) toolbar buttons + py-1.5 (12px) padding + buffer */}
        {hasToolbar && (
          <div
            className={cn(
              "flex min-h-[46px] items-center gap-1 border-t border-sidebar-border px-2 py-1.5 max-[440px]:flex-wrap",
              toolbarClassName,
            )}
          >
            {toolbarLeft}
            <div className="flex-1 max-[440px]:hidden" />
            {toolbarRight}
          </div>
        )}
      </form>

      {belowShell}
    </div>
  );
};

export default InputBarShell;
