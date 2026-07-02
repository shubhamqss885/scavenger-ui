"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "@/lib/i18n/client";
import { flattenFields } from "../../config/connectorData";
import type { Connector } from "../../config/connectorData";
import type { SecurityConfig } from "../../types";
import { buildDefaults, buildZodSchema } from "./formHelpers";
import { ConnectorFormLeftPanel } from "./ConnectorFormLeftPanel";

type Props = {
  connector: Connector;
  onSubmit: (url: string, display: string, security?: SecurityConfig) => void;
};

/**
 * Minimal form for file/path connectors (SQLite, DuckDB, CSV, etc.).
 * A single path input — no tabs, no connection-string paste mode.
 */
export const FileConnectorForm = ({ connector, onSubmit }: Readonly<Props>) => {
  const { t } = useTranslation("connectors");
  const formSchema = useMemo(
    () => buildZodSchema(connector.fields),
    [connector.fields],
  );

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(connector.fields),
  });

  const fields = useMemo(
    () => flattenFields(connector.fields),
    [connector.fields],
  );

  const handleFormSubmit = (data: Record<string, string>) => {
    onSubmit(connector.buildUrl(data), connector.buildDisplayUrl(data));
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <ConnectorFormLeftPanel connector={connector} previewText={null} />

          {/* Right panel */}
          <div className="p-5">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-3"
              >
                {fields.map((field) => (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: rhf }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{field.label}</FormLabel>
                        <FormControl>
                          <Input placeholder={field.placeholder} {...rhf} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                ))}

                <Button type="submit" size="sm" className="w-full gap-1.5">
                  <Icon name="Lock" size="xxs" />
                  {t("form.connectSecurely")}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
