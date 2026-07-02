"use client";

import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";

import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "@/lib/i18n/client";
import { GcpOAuthButton } from "../credentials/GcpOAuthButton";
import type { FieldConfig, FieldRow } from "../../config/connectorData";

/**
 * Encapsulates the field-rendering state (password visibility) and returns
 * renderField / renderFields helpers for use inside connector form components.
 */
export const useConnectorFormFields = (
  form: UseFormReturn<Record<string, string>>,
) => {
  const { t } = useTranslation("connectors");
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});

  const toggleVisibility = (name: string) =>
    setVisiblePasswords((prev) => ({ ...prev, [name]: !prev[name] }));

  const renderField = (field: FieldConfig): JSX.Element => {
    if (field.type === "gcp-oauth") {
      return (
        <FormField
          key={field.name}
          control={form.control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormControl>
                <GcpOAuthButton
                  label={field.label}
                  required={field.required}
                  value={rhf.value ?? ""}
                  // Store only the refresh_token in the form field (not the full credentials JSON).
                  onChange={(refreshToken) => rhf.onChange(refreshToken)}
                  onBlur={rhf.onBlur}
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />
      );
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: rhf }) => (
          <FormItem>
            <FormLabel className="text-xs">
              {field.label}
              {!field.required && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  {t("form.fieldOptional")}
                </span>
              )}
            </FormLabel>
            <FormControl>
              {field.type === "password" ? (
                <div className="relative">
                  <Input
                    type={visiblePasswords[field.name] ? "text" : "password"}
                    className="pr-8"
                    placeholder={field.placeholder}
                    {...rhf}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.name)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {visiblePasswords[field.name] ? (
                      <Icon name="EyeOff" size="xs" />
                    ) : (
                      <Icon name="Eye" size="xs" />
                    )}
                  </button>
                </div>
              ) : field.type === "textarea" ? (
                <Textarea
                  className="min-h-[140px] resize-none font-mono text-xs"
                  placeholder={field.placeholder}
                  {...rhf}
                />
              ) : field.type === "select" && field.options ? (
                <Select value={rhf.value} onValueChange={rhf.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder={field.placeholder} {...rhf} />
              )}
            </FormControl>
            <FormMessage className="text-[11px]" />
          </FormItem>
        )}
      />
    );
  };

  const renderFields = (rows: FieldRow[]): JSX.Element[] =>
    rows.map((row) => {
      if ("fields" in row) {
        return (
          <div
            key={row.fields[0].name}
            className={`grid ${row.gridCols ?? "grid-cols-2"} gap-2`}
          >
            {row.fields.map(renderField)}
          </div>
        );
      }

      return renderField(row);
    });

  return { renderField, renderFields };
};
