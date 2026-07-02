"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { TFunction } from "i18next";

type MockProps = Readonly<{
  t: TFunction;
}>;

const CONNECTOR_LOGOS = [
  { src: "/logos/databases/postgresql.png", alt: "PostgreSQL" },
  { src: "/logos/databases/mysql.svg", alt: "MySQL" },
  { src: "/logos/databases/snowflake.png", alt: "Snowflake" },
  { src: "/logos/databases/databricks.png", alt: "Databricks" },
  { src: "/logos/databases/bigquery.svg", alt: "BigQuery" },
  { src: "/logos/databases/tableau.svg", alt: "Tableau" },
  { src: "/logos/databases/powerbi.svg", alt: "Power BI" },
  { src: "/logos/databases/redshift.svg", alt: "Redshift" },
] as const;

const CHAT_BARS = [
  { label: "Sneakers", value: "$48K", h: 52 },
  { label: "Jackets", value: "$39K", h: 42 },
  { label: "T-Shirts", value: "$31K", h: 34 },
  { label: "Bags", value: "$24K", h: 26 },
  { label: "Hats", value: "$18K", h: 18 },
] as const;

const DASHBOARD_BARS = [
  { label: "EMEA", value: "$120K", h: 48 },
  { label: "NA", value: "$98K", h: 40 },
  { label: "APAC", value: "$74K", h: 30 },
  { label: "LATAM", value: "$52K", h: 22 },
] as const;

export const ChatMock = ({ t }: MockProps) => (
  <div className="mt-4 flex flex-1 flex-col space-y-3">
    <div className="mr-auto max-w-[85%]">
      <div className="w-fit rounded-md bg-primary p-2.5 text-sm text-primary-foreground">
        {t("help.mocks.chat.userMessage")}
      </div>
    </div>
    <div className="mr-auto w-full flex-1">
      <div className="flex h-full flex-col space-y-2 text-sm text-slate-900 dark:text-slate-100">
        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              {t("help.mocks.chat.chartTitle")}
            </span>
            <div className="flex shrink-0 items-center text-slate-400 hover:text-primary dark:text-slate-500">
              <Icon name="Pin" size="xxs" className="ml-1.5" />
            </div>
          </div>
          <div className="flex items-end gap-2 rounded-b-lg border-t border-slate-200 bg-white px-3 pb-3 pt-4 dark:border-slate-700 dark:bg-slate-950">
            {CHAT_BARS.map((bar, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-medium text-slate-500">
                  {bar.value}
                </span>
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: `${bar.h}px`, opacity: 1 - i * 0.12 }}
                />
                <span className="text-[8px] text-slate-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-900 dark:text-slate-100">
          {t("help.mocks.chat.agentSummary")}
        </p>
      </div>
    </div>
  </div>
);

export const ContextMock = ({ t }: MockProps) => (
  <div className="mt-4 space-y-3">
    <div className="mr-auto max-w-[85%]">
      <div className="w-fit rounded-md bg-primary p-2.5 text-sm text-primary-foreground">
        {t("help.mocks.context.userMessage")}
      </div>
    </div>
    <div className="space-y-2 text-sm text-slate-900 dark:text-slate-100">
      <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
        <Icon name="CheckCircle2" size="sm" variant="success" />
        <p className="text-xs text-foreground">
          {t("help.mocks.context.savedConfirmation")}
        </p>
      </div>
    </div>
    <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("help.mocks.context.vaultTitle")}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Icon name="FileText" size="xs" variant="foreground" />
          <span className="flex-1 text-xs font-medium">
            {t("help.mocks.context.rule1")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("help.mocks.context.rule1Type")}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Icon name="Star" size="xs" variant="foreground" />
          <span className="flex-1 text-xs font-medium">
            {t("help.mocks.context.rule2")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("help.mocks.context.rule2Type")}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Icon name="FileText" size="xs" variant="foreground" />
          <span className="flex-1 text-xs font-medium">
            {t("help.mocks.context.rule3")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("help.mocks.context.rule3Type")}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const DataUploadMock = ({ t }: MockProps) => (
  <div className="mt-4 space-y-3">
    <div className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50 hover:bg-muted/50">
      <Icon name="Upload" size="lg" />
      <p className="text-xs text-muted-foreground">
        {t("help.mocks.dataUpload.dropzoneText")}
      </p>
      <p className="text-[10px] text-muted-foreground/70">
        {t("help.mocks.dataUpload.supportedFormats")}
      </p>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Icon name="FileSpreadsheet" size="xs" variant="foreground" />
        <span className="flex-1 text-xs font-medium">Sales_2024.xlsx</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Icon name="FileText" size="xs" variant="foreground" />
        <span className="flex-1 text-xs font-medium">Report.pdf</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-3/4 rounded-full bg-primary" />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Icon name="FileSpreadsheet" size="xs" variant="foreground" />
        <span className="flex-1 text-xs font-medium">Inventory_Q4.csv</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Icon name="FileText" size="xs" variant="foreground" />
        <span className="flex-1 text-xs font-medium">
          Customer_Feedback.docx
        </span>
      </div>
    </div>
  </div>
);

export const DataConnectionMock = ({ t }: MockProps) => (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {CONNECTOR_LOGOS.map((logo) => (
      <div
        key={logo.alt}
        className="group flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-3 text-center transition-all duration-150 hover:border-primary"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
        <span className="text-xs font-medium text-foreground">{logo.alt}</span>
      </div>
    ))}
    <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border/60 p-3 text-center">
      <span className="text-sm font-semibold text-muted-foreground">
        {t("help.mocks.dataConnection.moreCount")}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {t("help.mocks.dataConnection.moreLabel")}
      </span>
    </div>
  </div>
);

export const DashboardMock = ({ t }: MockProps) => (
  <div className="mt-4 space-y-3">
    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
          {t("help.mocks.dashboards.chartTitle")}
        </span>
        <div className="flex items-center gap-2">
          <button className="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-primary dark:text-slate-500">
            <Icon name="Pin" size="xxs" />
            <span className="text-[11px]">
              {t("help.mocks.dashboards.pinButton")}
            </span>
          </button>
          <button className="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-primary dark:text-slate-500">
            <Icon name="Share2" size="xxs" />
            <span className="text-[11px]">
              {t("help.mocks.dashboards.shareButton")}
            </span>
          </button>
        </div>
      </div>
      <div className="flex items-end gap-2 rounded-b-lg border-t border-slate-200 bg-white px-3 pb-3 pt-4 dark:border-slate-700 dark:bg-slate-950">
        {DASHBOARD_BARS.map((bar, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-medium text-slate-500">
              {bar.value}
            </span>
            <div
              className="w-full rounded-sm bg-primary"
              style={{ height: `${bar.h}px`, opacity: 1 - i * 0.12 }}
            />
            <span className="text-[8px] text-slate-400">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="Share2" size="xs" variant="foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">
          {t("help.mocks.dashboards.sharedWith")}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {t("help.mocks.dashboards.autoRefresh")}
        </p>
      </div>
    </div>
  </div>
);

export const EmailReportMock = ({ t }: MockProps) => (
  <div className="mt-4 overflow-hidden rounded-lg border border-border">
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon name="Mail" size="sm" variant="primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {t("help.mocks.emailReports.reportTitle")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("help.mocks.emailReports.reportSubtitle")} &middot; Jun 24, 2026
        </p>
      </div>
    </div>
    <div className="space-y-2 px-4 py-3">
      <p className="text-xs font-medium text-foreground">
        {t("help.mocks.emailReports.aiSummaryTitle")}
      </p>
      <p className="text-xs leading-5 text-foreground">
        {t("help.mocks.emailReports.aiSummaryBody")}
      </p>
      <p className="text-xs leading-5 text-amber-700 dark:text-amber-400">
        ⚠ {t("help.mocks.emailReports.anomalyWarning")}
      </p>
      <p className="text-xs leading-5 text-green-700 dark:text-green-400">
        ✓ {t("help.mocks.emailReports.positiveInsight")}
      </p>
    </div>
    <div className="flex items-center gap-3 border-t px-4 py-2">
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {t("help.mocks.emailReports.sentBadge")}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {t("help.mocks.emailReports.recipients")}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {t("help.mocks.emailReports.nextReport")}
      </span>
    </div>
  </div>
);

export const DataQualityMock = ({ t }: MockProps) => (
  <div className="mt-4 space-y-2">
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="CheckCircle2" size="sm" variant="success" />
      <span className="flex-1 text-xs font-medium">
        {t("help.mocks.dataQuality.orders")}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-[98%] rounded-full bg-green-600" />
        </div>
        <span className="text-[11px] font-semibold text-green-600">98%</span>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="CheckCircle2" size="sm" variant="success" />
      <span className="flex-1 text-xs font-medium">
        {t("help.mocks.dataQuality.products")}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-[94%] rounded-full bg-green-600" />
        </div>
        <span className="text-[11px] font-semibold text-green-600">94%</span>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="AlertTriangle" size="sm" variant="warning" />
      <span className="flex-1 text-xs font-medium">
        {t("help.mocks.dataQuality.customers")}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-[72%] rounded-full bg-amber-600" />
        </div>
        <span className="text-[11px] font-semibold text-amber-600">72%</span>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="AlertTriangle" size="sm" variant="warning" />
      <span className="flex-1 text-xs font-medium">
        {t("help.mocks.dataQuality.inventory")}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-[61%] rounded-full bg-amber-600" />
        </div>
        <span className="text-[11px] font-semibold text-amber-600">61%</span>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <Icon name="XCircle" size="sm" variant="destructive" />
      <span className="flex-1 text-xs font-medium">
        {t("help.mocks.dataQuality.events")}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-[34%] rounded-full bg-red-600" />
        </div>
        <span className="text-[11px] font-semibold text-red-600">34%</span>
      </div>
    </div>
  </div>
);
