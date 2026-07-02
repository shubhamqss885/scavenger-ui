"use client";

import Image from "next/image";

import { Icon, type IconName } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { Connector } from "../../config/connectorData";

type InfoItemKey =
  | "leftPanel.db.encrypted"
  | "leftPanel.db.autoDiscovery"
  | "leftPanel.db.readOnly"
  | "leftPanel.bi.encrypted"
  | "leftPanel.bi.apiBased"
  | "leftPanel.bi.readAccess";

type InfoItem = Readonly<{
  icon: IconName;
  key: InfoItemKey;
}>;

const DB_INFO_ITEMS: readonly InfoItem[] = [
  { icon: "ShieldCheck", key: "leftPanel.db.encrypted" },
  { icon: "ScanSearch", key: "leftPanel.db.autoDiscovery" },
  { icon: "DatabaseZap", key: "leftPanel.db.readOnly" },
];

const BI_INFO_ITEMS: readonly InfoItem[] = [
  { icon: "ShieldCheck", key: "leftPanel.bi.encrypted" },
  { icon: "KeyRound", key: "leftPanel.bi.apiBased" },
  { icon: "ScanSearch", key: "leftPanel.bi.readAccess" },
];

type Props = {
  connector: Connector;
  previewText: string | null;
};

export const ConnectorFormLeftPanel = ({
  connector,
  previewText,
}: Readonly<Props>) => {
  const { t } = useTranslation("connectors");
  const infoItems =
    connector.category === "bi-tools" ? BI_INFO_ITEMS : DB_INFO_ITEMS;

  return (
    <div className="border-b border-border bg-muted/50 p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 lg:flex-col lg:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card">
          <Image
            src={connector.logoSrc}
            alt={connector.name}
            width={32}
            height={32}
            className={cn(
              "w-auto object-contain",
              connector.logoHeight === "h-8" ? "h-6" : "h-5",
            )}
            unoptimized
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              {connector.name}
            </h3>
            {connector.setupInstructions && (
              <Popover>
                <PopoverTrigger
                  aria-label={t("leftPanel.setupInstructions.ariaLabel")}
                  className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  <Icon name="HelpCircle" size="xs" />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="bottom"
                  className="max-h-[60vh] w-80 overflow-y-auto"
                >
                  <div
                    className="prose prose-sm max-w-none text-xs leading-relaxed text-foreground prose-p:my-0 prose-p:mb-2 prose-strong:font-semibold prose-strong:text-foreground prose-ol:my-0 prose-ol:list-decimal prose-ol:pl-4 prose-li:my-1"
                    dangerouslySetInnerHTML={{
                      __html: t(connector.setupInstructions),
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("leftPanel.configureConnection")}
          </p>
        </div>
      </div>

      <div className="mt-5 hidden space-y-3.5 lg:block">
        {infoItems.map(({ icon, key }) => (
          <div key={key} className="flex items-start gap-2">
            <Icon
              name={icon}
              size="xs"
              variant="primary"
              className="mt-px shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                {t(`${key}.title`)}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(`${key}.desc`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {connector.category !== "bi-tools" && (
        <div className="mt-5 hidden lg:block">
          <div className="flex items-start gap-2">
            <Icon
              name="Network"
              size="xs"
              variant="primary"
              className="mt-px shrink-0"
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                {t("leftPanel.ipWhitelist.title")}
              </p>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                {t("leftPanel.ipWhitelist.desc")}
              </p>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://calendar.app.google/3RixcwF2mHmFCA7V7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                >
                  {t("leftPanel.ipWhitelist.scheduleCall")}
                </a>
                <a
                  href="mailto:support@scavenger-ai.com?subject=IP%20Allowlist%20Request"
                  className="inline-flex items-center justify-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {t("leftPanel.ipWhitelist.emailSupport")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewText && (
        <div className="mt-4 hidden rounded-md border border-border bg-card p-2.5 lg:block">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("leftPanel.preview")}
          </p>
          <code className="block break-all font-mono text-[11px] leading-relaxed text-foreground">
            {previewText}
          </code>
        </div>
      )}
    </div>
  );
};
