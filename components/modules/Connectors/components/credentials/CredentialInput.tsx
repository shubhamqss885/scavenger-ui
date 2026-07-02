"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { CredentialRequest } from "../../types";

export const CredentialInput = ({
  request,
  onSubmit,
}: Readonly<{
  request: CredentialRequest;
  onSubmit: (value: string) => void;
}>) => {
  const [value, setValue] = useState("");
  const [showValue, setShowValue] = useState(false);

  const isMultiline = request.credential_type === "ssh_private_key";

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <div className="space-y-2 px-3 pb-2 pt-3">
      <div className="flex items-center gap-1.5">
        <Icon name="Lock" size="xs" variant="primary" />
        <p className="text-xs font-medium text-primary">Secure input</p>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        {request.prompt_message}
      </p>

      <div className="flex gap-2">
        {isMultiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Paste your private key here..."
            rows={4}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 font-mono text-sm",
              "border-slate-200 bg-slate-50 text-slate-700",
              "placeholder:text-slate-400",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
              "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              "dark:placeholder:text-slate-500",
            )}
          />
        ) : (
          <div className="relative flex-1">
            <input
              type={showValue ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Enter securely..."
              autoFocus
              className={cn(
                "w-full rounded-md border px-3 py-2 pr-9 text-sm",
                "border-slate-200 bg-slate-50 text-slate-700",
                "placeholder:text-slate-400",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                "dark:placeholder:text-slate-500",
              )}
            />
            <button
              type="button"
              onClick={() => setShowValue((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showValue ? (
                <Icon name="EyeOff" size="sm" />
              ) : (
                <Icon name="Eye" size="sm" />
              )}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            value.trim()
              ? "bg-primary text-white hover:bg-primary/90"
              : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
          )}
        >
          <Icon name="Send" size="sm" variant="white" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {isMultiline
          ? "Cmd+Enter to submit. Value is never shown in chat."
          : "Enter to submit. Value is never shown in chat."}
      </p>
    </div>
  );
};
