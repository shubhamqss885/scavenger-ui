"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getEmailSchedule,
  getEmailHistory,
  getEmailPreviewHtml,
  getOrgMembers,
  updateEmailSchedule,
  listEmailSubscribers,
  addEmailSubscriber,
  removeEmailSubscriber,
  type EmailSchedule,
  type EmailSubscriber,
  type EmailHistoryEntry,
  type EmailInterval,
  type OrgMember,
} from "@/lib/services/orgDashboardService";
import { useTranslation } from "@/lib/i18n/client";
import {
  formatHourLocale,
  formatDayLocale,
  DAYS_OF_WEEK,
  type DayOfWeek,
  getBrowserTimezone,
} from "@/lib/utils/dashboardSchedule";
import {
  TypeaheadCombobox,
  type TypeaheadOption,
} from "@/components/ui/typeahead-combobox";

type Tab = "schedule" | "subscribers" | "history";

type EmailReportsSheetProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  orgId: string;
  timezone: string | null;
}>;

type ScheduleTabProps = Readonly<{
  dashboardId: string;
  timezone: string | null;
  schedule: EmailSchedule | null;
  onScheduleChange: (s: EmailSchedule | null) => void;
}>;

type SubscribersTabProps = Readonly<{
  dashboardId: string;
  orgMembers: OrgMember[];
  subscribers: EmailSubscriber[];
  onSubscribersChange: (s: EmailSubscriber[]) => void;
}>;

type HistoryTabProps = Readonly<{
  history: EmailHistoryEntry[];
}>;

type IntervalOption = Readonly<{
  value: EmailInterval | "off";
}>;

const INTERVALS: IntervalOption[] = [
  { value: "off" },
  { value: "daily" },
  { value: "weekly" },
  { value: "monthly" },
];

type LanguageOption = Readonly<{
  value: string;
  labelKey: string;
}>;

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "", labelKey: "orgDashboard.emailReports.schedule.languageAuto" },
  {
    value: "English",
    labelKey: "orgDashboard.emailReports.schedule.languageEnglish",
  },
  {
    value: "German",
    labelKey: "orgDashboard.emailReports.schedule.languageGerman",
  },
  {
    value: "French",
    labelKey: "orgDashboard.emailReports.schedule.languageFrench",
  },
  {
    value: "Spanish",
    labelKey: "orgDashboard.emailReports.schedule.languageSpanish",
  },
];

const MONTH_DAYS: TypeaheadOption[] = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
  searchText: String(i + 1),
}));

const ScheduleTab = ({
  dashboardId,
  timezone,
  schedule,
  onScheduleChange,
}: ScheduleTabProps) => {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;
  const tz = timezone ?? getBrowserTimezone();

  const hourOptions = useMemo<TypeaheadOption[]>(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        const label = formatHourLocale(h, locale);
        return {
          value: String(h),
          label,
          searchText: `${label} ${h} ${String(h).padStart(2, "0")}:00`,
        };
      }),
    [locale],
  );

  const dayOptions = useMemo<TypeaheadOption[]>(
    () =>
      DAYS_OF_WEEK.map((d) => {
        const long = formatDayLocale(d, locale, "long");
        const short = formatDayLocale(d, locale, "short");
        return {
          value: String(d),
          label: long,
          searchText: `${long} ${short}`,
        };
      }),
    [locale],
  );

  const [intervalChoice, setIntervalChoice] = useState<EmailInterval | "off">(
    schedule?.email_interval ?? "off",
  );
  const [hour, setHour] = useState(schedule?.email_hour ?? 9);
  const [dow, setDow] = useState<DayOfWeek>(
    (schedule?.email_day_of_week as DayOfWeek) ?? 1,
  );
  const [dom, setDom] = useState(schedule?.email_day_of_month ?? 1);
  const [paused, setPaused] = useState(schedule?.email_paused ?? false);
  const [refreshFirst, setRefreshFirst] = useState(
    schedule?.email_refresh_before_send ?? false,
  );
  const [customTitle, setCustomTitle] = useState(schedule?.custom_title ?? "");
  const [customNote, setCustomNote] = useState(schedule?.custom_note ?? "");
  const [context, setContext] = useState(schedule?.context ?? "");
  const [maxCharts, setMaxCharts] = useState(schedule?.max_charts ?? 3);
  const [language, setLanguage] = useState(schedule?.language ?? "");
  const [saving, setSaving] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setIntervalChoice(schedule?.email_interval ?? "off");
    setHour(schedule?.email_hour ?? 9);
    setDow((schedule?.email_day_of_week as DayOfWeek) ?? 1);
    setDom(schedule?.email_day_of_month ?? 1);
    setPaused(schedule?.email_paused ?? false);
    setRefreshFirst(schedule?.email_refresh_before_send ?? false);
    setCustomTitle(schedule?.custom_title ?? "");
    setCustomNote(schedule?.custom_note ?? "");
    setContext(schedule?.context ?? "");
    setMaxCharts(schedule?.max_charts ?? 3);
    setLanguage(schedule?.language ?? "");
  }, [schedule]);

  const needsHour = intervalChoice !== "off";
  const needsDow = intervalChoice === "weekly";
  const needsDom = intervalChoice === "monthly";
  const busy = saving || togglingPause || previewing;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateEmailSchedule(dashboardId, {
        email_interval: intervalChoice === "off" ? null : intervalChoice,
        email_hour: needsHour ? hour : null,
        email_day_of_week: needsDow ? dow : null,
        email_day_of_month: needsDom ? dom : null,
        email_paused: paused,
        email_refresh_before_send: refreshFirst,
        timezone: tz,
        custom_title: customTitle || null,
        custom_note: customNote || null,
        context: context || null,
        max_charts: maxCharts,
        language: language || null,
      });
      onScheduleChange(intervalChoice === "off" ? null : updated);
      toast.success(t("orgDashboard.emailReports.schedule.saved"));
    } catch {
      toast.error(t("orgDashboard.emailReports.schedule.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Pause/Resume saves immediately against the persisted schedule, not unsaved form edits.
  const handleTogglePause = async () => {
    if (!schedule) return;
    setTogglingPause(true);
    const next = !paused;
    try {
      const updated = await updateEmailSchedule(dashboardId, {
        email_interval: schedule.email_interval,
        email_hour: schedule.email_hour,
        email_day_of_week: schedule.email_day_of_week,
        email_day_of_month: schedule.email_day_of_month,
        email_paused: next,
        email_refresh_before_send: schedule.email_refresh_before_send,
        timezone: tz,
      });
      setPaused(next);
      onScheduleChange(updated);
      toast.success(
        t(
          next
            ? "orgDashboard.emailReports.schedule.pauseSaved"
            : "orgDashboard.emailReports.schedule.resumeSaved",
        ),
      );
    } catch {
      toast.error(t("orgDashboard.emailReports.schedule.saveFailed"));
    } finally {
      setTogglingPause(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const html = await getEmailPreviewHtml(dashboardId);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, "_blank");

      if (tab) tab.addEventListener("unload", () => URL.revokeObjectURL(url));
    } catch {
      toast.error(t("orgDashboard.emailReports.schedule.previewFailed"));
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("orgDashboard.emailReports.schedule.frequencyLabel")}
        </Label>
        <RadioGroup
          value={intervalChoice}
          onValueChange={(v) => setIntervalChoice(v as EmailInterval | "off")}
          className="grid grid-cols-2 gap-2"
        >
          {INTERVALS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`email-interval-${opt.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                intervalChoice === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <RadioGroupItem
                value={opt.value}
                id={`email-interval-${opt.value}`}
              />
              {t(`orgDashboard.emailReports.schedule.intervals.${opt.value}`)}
            </label>
          ))}
        </RadioGroup>
      </div>

      {needsHour && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {needsDow && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("orgDashboard.emailReports.schedule.dayOfWeekLabel")}
              </Label>
              <TypeaheadCombobox
                value={String(dow)}
                options={dayOptions}
                onValueChange={(v) => setDow(Number(v) as DayOfWeek)}
                searchPlaceholder={t(
                  "orgDashboard.emailReports.schedule.searchDay",
                )}
                emptyText={t("orgDashboard.emailReports.schedule.noMatch")}
              />
            </div>
          )}
          {needsDom && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("orgDashboard.emailReports.schedule.dayOfMonthLabel")}
              </Label>
              <TypeaheadCombobox
                value={String(dom)}
                options={MONTH_DAYS}
                onValueChange={(v) => setDom(Number(v))}
                searchPlaceholder={t(
                  "orgDashboard.emailReports.schedule.searchDay",
                )}
                emptyText={t("orgDashboard.emailReports.schedule.noMatch")}
              />
            </div>
          )}
          <div
            className={cn(
              "space-y-1.5",
              !needsDow && !needsDom && "sm:max-w-[180px]",
            )}
          >
            <Label className="text-xs text-muted-foreground">
              {t("orgDashboard.emailReports.schedule.sendAtLabel")}
            </Label>
            <TypeaheadCombobox
              value={String(hour)}
              options={hourOptions}
              onValueChange={(v) => setHour(Number(v))}
              searchPlaceholder={t(
                "orgDashboard.emailReports.schedule.searchHour",
              )}
              emptyText={t("orgDashboard.emailReports.schedule.noMatch")}
            />
          </div>
        </div>
      )}

      {needsHour && schedule?.next_email_at && !paused && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Icon name="Clock" size="xs" className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t("orgDashboard.emailReports.schedule.nextSend", {
              date: new Date(schedule.next_email_at).toLocaleString(),
            })}
          </p>
        </div>
      )}

      {intervalChoice !== "off" && (
        <div className="flex items-center gap-2.5 rounded-md border px-3 py-2.5">
          <Checkbox
            id="refresh-before-send"
            checked={refreshFirst}
            onCheckedChange={(v) => setRefreshFirst(v === true)}
          />
          <Label
            htmlFor="refresh-before-send"
            className="cursor-pointer text-sm font-normal"
          >
            {t("orgDashboard.emailReports.schedule.refreshBeforeSend")}
          </Label>
        </div>
      )}

      {intervalChoice !== "off" && (
        <div className="space-y-3 border-t pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("orgDashboard.emailReports.schedule.customTitle")}
            </Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t(
                "orgDashboard.emailReports.schedule.customTitlePlaceholder",
              )}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("orgDashboard.emailReports.schedule.customNote")}
            </Label>
            <Textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={t(
                "orgDashboard.emailReports.schedule.customNotePlaceholder",
              )}
              maxLength={2000}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("orgDashboard.emailReports.schedule.context")}
            </Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t(
                "orgDashboard.emailReports.schedule.contextPlaceholder",
              )}
              maxLength={2000}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("orgDashboard.emailReports.schedule.maxCharts")}
              </Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={maxCharts}
                onChange={(e) =>
                  setMaxCharts(
                    Math.min(
                      5,
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("orgDashboard.emailReports.schedule.language")}
              </Label>
              <Select
                value={language || "_auto"}
                onValueChange={(v) => setLanguage(v === "_auto" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value || "_auto"}
                      value={opt.value || "_auto"}
                    >
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePreview}
          disabled={busy}
        >
          {previewing ? (
            <Icon name="Loader2" size="xs" className="mr-1.5 animate-spin" />
          ) : (
            <Icon name="Eye" size="xs" className="mr-1.5" />
          )}
          {t("orgDashboard.emailReports.schedule.preview")}
        </Button>

        {schedule?.email_interval && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleTogglePause}
            disabled={busy}
          >
            {togglingPause ? (
              <Icon name="Loader2" size="xs" className="mr-1.5 animate-spin" />
            ) : (
              <Icon
                name={paused ? "Play" : "Pause"}
                size="xs"
                className="mr-1.5"
              />
            )}
            {paused
              ? t("orgDashboard.emailReports.schedule.resume")
              : t("orgDashboard.emailReports.schedule.pause")}
          </Button>
        )}

        <Button size="sm" onClick={handleSave} disabled={busy}>
          {saving ? (
            <Icon name="Loader2" size="xs" className="mr-1.5 animate-spin" />
          ) : (
            <Icon name="Check" size="xs" className="mr-1.5" />
          )}
          {t("orgDashboard.emailReports.schedule.save")}
        </Button>
      </div>
    </div>
  );
};

const SubscribersTab = ({
  dashboardId,
  orgMembers,
  subscribers,
  onSubscribersChange,
}: SubscribersTabProps) => {
  const { t } = useTranslation("dashboard");
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = emailInput.trim().toLowerCase();

    if (!q) return [];
    return orgMembers
      .filter(
        (m) =>
          !subscribers.some((s) => s.email === m.email) &&
          (m.email.toLowerCase().includes(q) ||
            (m.username ?? "").toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [emailInput, orgMembers, subscribers]);

  const handleAdd = async (emailOverride?: string) => {
    const email = (emailOverride ?? emailInput).trim();

    if (!email) return;
    setAdding(true);
    setShowSuggestions(false);
    try {
      const sub = await addEmailSubscriber(dashboardId, email);
      onSubscribersChange([...subscribers, sub]);
      setEmailInput("");
      if (sub.auto_added_as_viewer) {
        toast.success(
          t("orgDashboard.emailReports.subscribers.addedAsViewer", { email }),
        );
      } else {
        toast.success(
          t("orgDashboard.emailReports.subscribers.added", { email }),
        );
      }
    } catch (err) {
      const status =
        err != null &&
        typeof err === "object" &&
        "response" in err &&
        err.response != null &&
        typeof err.response === "object" &&
        "status" in err.response
          ? (err.response as { status: number }).status
          : null;
      toast.error(
        status === 409
          ? t("orgDashboard.emailReports.subscribers.alreadySubscribed")
          : t("orgDashboard.emailReports.subscribers.addFailed"),
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (email: string) => {
    setRemoving(email);
    try {
      await removeEmailSubscriber(dashboardId, email);
      onSubscribersChange(subscribers.filter((s) => s.email !== email));
      toast.success(
        t("orgDashboard.emailReports.subscribers.removed", { email }),
      );
    } catch {
      toast.error(t("orgDashboard.emailReports.subscribers.removeFailed"));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon
              name="Mail"
              size="xs"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={inputRef}
              placeholder={t(
                "orgDashboard.emailReports.subscribers.emailPlaceholder",
              )}
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="pl-8"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
                {suggestions.map((m) => (
                  <li key={m.email}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEmailInput(m.email);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(m.username ?? m.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {m.username && (
                          <p className="truncate text-xs font-medium">
                            {m.username}
                          </p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => handleAdd()}
            disabled={adding || !emailInput.trim()}
          >
            {adding ? (
              <Icon name="Loader2" size="xs" className="animate-spin" />
            ) : (
              <Icon name="Plus" size="xs" className="mr-1" />
            )}
            {t("orgDashboard.emailReports.subscribers.add")}
          </Button>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <Icon name="Users" size="md" className="text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t("orgDashboard.emailReports.subscribers.none")}
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {subscribers.map((s) => (
            <li
              key={s.email}
              className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {s.email[0].toUpperCase()}
                </div>
                <span className="truncate text-sm">{s.email}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(s.email)}
                disabled={removing === s.email}
              >
                {removing === s.email ? (
                  <Icon name="Loader2" size="xs" className="animate-spin" />
                ) : (
                  <Icon name="X" size="xs" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const STATUS_STYLES: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  sent: {
    dot: "bg-green-500",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "orgDashboard.emailReports.history.statusSent",
  },
  failed: {
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive",
    label: "orgDashboard.emailReports.history.statusFailed",
  },
  skipped: {
    dot: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "orgDashboard.emailReports.history.statusSkipped",
  },
};

const HistoryTab = ({ history }: HistoryTabProps) => {
  const { t } = useTranslation("dashboard");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
        <Icon name="MailOpen" size="md" className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t("orgDashboard.emailReports.history.none")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="mb-3 text-xs text-muted-foreground">
        {t("orgDashboard.emailReports.history.showing", {
          count: history.length,
        })}
      </p>
      <ul className="space-y-1.5">
        {history.map((h) => {
          const style = STATUS_STYLES[h.status] ?? STATUS_STYLES.failed;
          const isExpanded = expanded === h.id;
          return (
            <li
              key={h.id}
              className="rounded-lg border transition-colors hover:bg-muted/30"
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
                onClick={() => setExpanded(isExpanded ? null : h.id)}
              >
                <div
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    style.dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  {h.subject && (
                    <p className="truncate text-xs font-medium text-foreground">
                      {h.subject}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.sent_at).toLocaleString()}
                    </span>
                    {h.recipient_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        · {h.recipient_count}{" "}
                        {t("orgDashboard.emailReports.history.recipients")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {h.status !== "sent" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        style.badge,
                      )}
                    >
                      {t(style.label)}
                    </span>
                  )}
                  <Icon
                    name={isExpanded ? "ChevronUp" : "ChevronDown"}
                    size="xs"
                    className="text-muted-foreground"
                  />
                </div>
              </button>
              {isExpanded && (h.summary_text || h.error) && (
                <div className="border-t px-3 py-2.5">
                  {h.summary_text && (
                    <p className="text-xs text-muted-foreground">
                      {h.summary_text}
                    </p>
                  )}
                  {h.error && (
                    <p className="mt-1 text-xs text-destructive">{h.error}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type TabOption = Readonly<{ value: Tab; labelKey: string; icon: string }>;

const TABS: TabOption[] = [
  {
    value: "schedule",
    labelKey: "orgDashboard.emailReports.tabs.schedule",
    icon: "Clock",
  },
  {
    value: "subscribers",
    labelKey: "orgDashboard.emailReports.tabs.subscribers",
    icon: "Users",
  },
  {
    value: "history",
    labelKey: "orgDashboard.emailReports.tabs.history",
    icon: "History",
  },
];

const EmailReportsModal = ({
  isOpen,
  onClose,
  dashboardId,
  orgId,
  timezone,
}: EmailReportsSheetProps) => {
  const { t } = useTranslation("dashboard");
  const [tab, setTab] = useState<Tab>("schedule");
  const [schedule, setSchedule] = useState<EmailSchedule | null>(null);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [history, setHistory] = useState<EmailHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const [sched, subs, members] = await Promise.all([
        getEmailSchedule(dashboardId),
        listEmailSubscribers(dashboardId),
        getOrgMembers(orgId).catch(() => [] as OrgMember[]),
      ]);
      setSchedule(sched);
      setSubscribers(subs);
      setOrgMembers(members);
    } catch {
      toast.error(t("orgDashboard.emailReports.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isOpen, dashboardId, orgId, t]);

  const loadHistory = useCallback(async () => {
    if (!isOpen) return;
    try {
      const h = await getEmailHistory(dashboardId);
      setHistory(h);
    } catch {
      // non-critical — history tab just stays empty
    }
  }, [isOpen, dashboardId]);

  useEffect(() => {
    if (isOpen) {
      setTab("schedule");
      load();
    }
  }, [isOpen, load]);

  useEffect(() => {
    if (isOpen && tab === "history") loadHistory();
  }, [isOpen, tab, loadHistory]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b px-6 py-5 pr-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon name="Mail" size="sm" className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base">
                {t("orgDashboard.emailReports.title")}
              </SheetTitle>
              {schedule?.email_paused && (
                <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("orgDashboard.emailReports.schedule.pausedStatus")}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Tab nav */}
        <div className="flex shrink-0 gap-0 border-b px-6">
          {TABS.map((tabOption) => (
            <button
              key={tabOption.value}
              onClick={() => setTab(tabOption.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
                tab === tabOption.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                name={tabOption.icon as Parameters<typeof Icon>[0]["name"]}
                size="xs"
              />
              {t(tabOption.labelKey)}
              {tabOption.value === "subscribers" && subscribers.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  {subscribers.length}
                </span>
              )}
              {tabOption.value === "history" && history.length > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable tab content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <Icon
                  name="Loader2"
                  size="md"
                  className="animate-spin text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className={cn(tab !== "schedule" && "hidden")}>
                  <ScheduleTab
                    dashboardId={dashboardId}
                    timezone={timezone}
                    schedule={schedule}
                    onScheduleChange={setSchedule}
                  />
                </div>
                <div className={cn(tab !== "subscribers" && "hidden")}>
                  <SubscribersTab
                    dashboardId={dashboardId}
                    orgMembers={orgMembers}
                    subscribers={subscribers}
                    onSubscribersChange={setSubscribers}
                  />
                </div>
                <div className={cn(tab !== "history" && "hidden")}>
                  <HistoryTab history={history} />
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmailReportsModal;
