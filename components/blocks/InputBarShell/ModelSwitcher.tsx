"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export type ModelProvider = "claude" | "ollama-qwen" | "ollama-gemma4";

// Brand names are intentionally literal (not translated). The trigger tooltip
// is the only translated string — see chat.modelSwitcher in agentic-chat.json.
const MODEL_OPTIONS: ReadonlyArray<{
  value: ModelProvider;
  label: string;
}> = [
  { value: "claude", label: "Claude" },
  { value: "ollama-qwen", label: "Qwen" },
  { value: "ollama-gemma4", label: "Gemma" },
];

export const DEFAULT_MODEL_PROVIDER: ModelProvider = "claude";

export const isModelProvider = (value: unknown): value is ModelProvider =>
  MODEL_OPTIONS.some((m) => m.value === value);

type ModelSwitcherProps = Readonly<{
  provider: ModelProvider;
  onProviderChange: (model: ModelProvider) => void;
  // "Agno" backend toggle. Off → Claude-only via the cloud WS; on → all models via the Agno WS.
  agno: boolean;
  onAgnoChange: (agno: boolean) => void;
  disabled?: boolean;
}>;

const ModelSwitcher = ({
  provider,
  onProviderChange,
  agno,
  onAgnoChange,
  disabled = false,
}: ModelSwitcherProps) => {
  const { t } = useTranslation("agentic-chat");
  // Agno off restricts the menu (and selection) to Claude.
  const options = agno
    ? MODEL_OPTIONS
    : MODEL_OPTIONS.filter((m) => m.value === "claude");
  const selected =
    options.find((m) => m.value === provider) ?? MODEL_OPTIONS[0];
  const label = t("chat.modelSwitcher");

  const handleAgnoToggle = (checked: boolean) => {
    onAgnoChange(checked);
    // Leaving Agno snaps the provider back to Claude (the only cloud option).
    if (!checked && provider !== "claude") onProviderChange("claude");
  };

  return (
    <div className="inline-flex items-center gap-1">
      <label
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-500 transition-colors",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
        )}
      >
        <Checkbox
          checked={agno}
          onCheckedChange={(c) => handleAgnoToggle(c === true)}
          disabled={disabled}
          className="h-3.5 w-3.5 [&_svg]:h-2.5 [&_svg]:w-2.5"
        />
        <span className="leading-none">Agno</span>
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            aria-label={label}
            className="h-7 gap-1 px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800"
          >
            <Icon name="Bot" size="xs" className="text-current" />
            <span className="max-w-[120px] truncate">{selected.label}</span>
            <Icon name="ChevronDown" size="xxs" className="text-current" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[160px]">
          {options.map((model) => (
            <DropdownMenuItem
              key={model.value}
              onClick={() => {
                if (model.value !== provider) onProviderChange(model.value);
              }}
              className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1.5"
            >
              <div className="flex h-4 w-4 items-center justify-center">
                {model.value === provider && (
                  <Icon name="Check" size="sm" className="text-slate-500" />
                )}
              </div>
              <span className="text-xs font-medium">{model.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ModelSwitcher;
