"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { DatabaseCard } from "./DatabaseCard";
import {
  CONNECTORS,
  type ConnectorId,
  type ConnectorCategory,
} from "../../config/connectorData";

type CategoryKey = ConnectorCategory | "all";

const CATEGORY_KEYS: CategoryKey[] = [
  "all",
  "relational",
  "warehouse",
  "files",
  "enterprise",
  "analytics",
  "nosql",
  "bi-tools",
];

// Maps ConnectorCategory → camelCase key suffix used inside the connectors namespace.
const CATEGORY_I18N_KEY: Record<CategoryKey, string> = {
  all: "all",
  relational: "relational",
  warehouse: "warehouse",
  analytics: "analytics",
  nosql: "nosql",
  "bi-tools": "biTools",
  files: "files",
  enterprise: "enterprise",
};

const CATEGORY_ORDER: ConnectorCategory[] = [
  "relational",
  "warehouse",
  "files",
  "enterprise",
  "analytics",
  "nosql",
  "bi-tools",
];

export const ConnectorGrid = ({
  onSelect,
}: Readonly<{ onSelect: (id: ConnectorId) => void }>) => {
  const { t } = useTranslation("connectors");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");

  const filtered = useMemo(() => {
    let list = CONNECTORS;

    if (category !== "all") {
      list = list.filter((c) => c.category === category);
    }

    const q = search.toLowerCase().trim();

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
    }

    return list;
  }, [search, category]);

  const grouped = useMemo(() => {
    if (category !== "all") {
      const live = filtered.filter((c) => c.status === "live");
      const soon = filtered.filter((c) => c.status === "coming_soon");
      return [{ key: category, label: "", connectors: [...live, ...soon] }];
    }

    return CATEGORY_ORDER.map((cat) => {
      const items = filtered.filter((c) => c.category === cat);
      const live = items.filter((c) => c.status === "live");
      const soon = items.filter((c) => c.status === "coming_soon");
      return {
        key: cat,
        label: t(`grid.sectionLabels.${CATEGORY_I18N_KEY[cat]}`),
        connectors: [...live, ...soon],
      };
    }).filter((g) => g.connectors.length > 0);
  }, [filtered, category, t]);

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none mb-0 flex items-center gap-1.5 overflow-x-auto">
          {CATEGORY_KEYS.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                "relative whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                category === key
                  ? "text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {category === key && (
                <motion.span
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">
                {t(`grid.categories.${CATEGORY_I18N_KEY[key]}`)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Icon
            name="Search"
            size="xs"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("grid.searchPlaceholder")}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center"
          >
            <Icon
              name="Search"
              size="xl"
              className="mx-auto mb-3 text-muted-foreground/25"
            />
            <p className="text-sm font-medium text-muted-foreground">
              {t("grid.empty.title")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {t("grid.empty.subtitle")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${category}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {grouped.map(({ key, label, connectors }) => (
              <div key={key}>
                {label && (
                  <div className="mb-3 flex items-center gap-3">
                    <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/50">
                      {t("grid.available", {
                        count: connectors.filter((c) => c.status === "live")
                          .length,
                      })}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {connectors.map((c, i) => (
                    <DatabaseCard
                      key={c.id}
                      name={c.name}
                      description={c.description}
                      logoSrc={c.logoSrc}
                      logoHeight={c.logoHeight}
                      status={c.status}
                      index={i}
                      onClick={
                        c.status === "live" ? () => onSelect(c.id) : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
