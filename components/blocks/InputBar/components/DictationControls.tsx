"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/client";

type StartButtonProps = Readonly<{
  onStart: () => void;
  isRequesting: boolean;
  disabled?: boolean;
}>;

export const DictationStartButton = ({
  onStart,
  isRequesting,
  disabled = false,
}: StartButtonProps) => {
  const { t } = useTranslation("agentic-chat");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          onClick={onStart}
          disabled={disabled || isRequesting}
          aria-label={t("chat.dictation.start")}
          aria-pressed={false}
          className="group h-8 w-8 rounded-sm bg-white px-0 py-0 hover:border-primary"
        >
          {isRequesting ? (
            <Icon
              name="Loader2"
              size="sm"
              variant="primary"
              className="animate-spin"
            />
          ) : (
            <Icon
              name="Mic"
              size="sm"
              variant="primary"
              className="group-hover:text-white"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{t("chat.dictation.start")}</p>
      </TooltipContent>
    </Tooltip>
  );
};

type ActiveControlsProps = Readonly<{
  isProcessing: boolean;
  onAccept: () => void;
  onCancel: () => void;
}>;

export const DictationActiveControls = ({
  isProcessing,
  onAccept,
  onCancel,
}: ActiveControlsProps) => {
  const { t } = useTranslation("agentic-chat");

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={onCancel}
            aria-label={t("chat.dictation.cancel")}
            className="h-8 w-8 rounded-sm border border-destructive bg-white px-0 py-0 hover:bg-destructive/10"
          >
            <Icon name="X" size="sm" variant="destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t("chat.dictation.cancel")}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={onAccept}
            disabled={isProcessing}
            aria-label={
              isProcessing
                ? t("chat.dictation.processing")
                : t("chat.dictation.accept")
            }
            className="h-8 w-8 rounded-sm bg-teal-400 px-0 py-0 hover:bg-teal-300"
          >
            {isProcessing ? (
              <Icon
                name="Loader2"
                size="sm"
                variant="foreground"
                className="animate-spin"
              />
            ) : (
              <Icon name="Check" size="sm" variant="foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            {isProcessing
              ? t("chat.dictation.processing")
              : t("chat.dictation.accept")}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
