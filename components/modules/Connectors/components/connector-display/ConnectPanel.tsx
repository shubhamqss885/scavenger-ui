"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";
import { useDashboardStats } from "@/lib/context/DashboardStatsProvider";
import { HELP_CALENDAR_URL } from "@/lib/constants";
import PageHeader from "@/components/blocks/Header";
import { ConnectorGrid } from "./ConnectorGrid";
import { type ConnectorId } from "../../config/connectorData";

export const ConnectPanel = () => {
  const { t } = useTranslation("connectors");
  const router = useRouter();
  const { enforceLimit } = useDashboardStats();

  const handleSelectConnector = (id: ConnectorId) => {
    if (enforceLimit("datasource")) return;
    router.push(`/connectors/${id}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden px-6">
      <PageHeader
        title={t("panel.title")}
        subtitle={t("panel.subtitle")}
        className="mb-2"
      >
        <a
          href={HELP_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-xs items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:max-w-none sm:shrink-0"
        >
          <Icon name="Calendar" size="xs" />
          {t("panel.needHelp")}
        </a>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ConnectorGrid onSelect={handleSelectConnector} />
        </motion.div>
      </div>
    </div>
  );
};
