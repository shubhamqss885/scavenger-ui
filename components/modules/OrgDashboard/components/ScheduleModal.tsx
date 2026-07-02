"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  TypeaheadCombobox,
  type TypeaheadOption,
} from "@/components/ui/typeahead-combobox";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import {
  updateDashboardSchedule,
  type DashboardSchedule,
  type RefreshInterval,
} from "@/lib/services/orgDashboardService";
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  formatDayLocale,
  formatHourLocale,
  formatTimezoneShort,
  getBrowserTimezone,
} from "@/lib/utils/dashboardSchedule";

type ScheduleModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  schedule: DashboardSchedule;
  onScheduleChange: (next: DashboardSchedule) => void;
}>;

type FormInterval = RefreshInterval | "off";

const ScheduleModal = ({
  isOpen,
  onClose,
  dashboardId,
  schedule,
  onScheduleChange,
}: ScheduleModalProps) => {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  // Times are entered and displayed in the dashboard's TZ (browser's TZ for a
  // brand-new schedule). BE handles DST via zoneinfo; no local↔UTC math here.
  const browserTz = useMemo(() => getBrowserTimezone(), []);
  const effectiveTz = schedule.timezone ?? browserTz;
  const showTzNote = effectiveTz !== browserTz;

  // `intervalChoice` rather than `interval` to avoid shadowing window.setInterval.
  const [intervalChoice, setIntervalChoice] = useState<FormInterval>(
    schedule.refresh_interval ?? "off",
  );
  const [hour, setHour] = useState<number>(schedule.refresh_hour ?? 9);
  const [day, setDay] = useState<DayOfWeek>(
    (schedule.refresh_day_of_week as DayOfWeek | null) ?? (1 as DayOfWeek),
  );
  const [saving, setSaving] = useState(false);

  // Snapshot the schedule from props only on the closed→open transition. Re-
  // syncing on every schedule field change would wipe in-progress edits if a
  // scheduled refetch (or another tab) updates the row while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    setIntervalChoice(schedule.refresh_interval ?? "off");
    setHour(schedule.refresh_hour ?? 9);
    setDay(
      (schedule.refresh_day_of_week as DayOfWeek | null) ?? (1 as DayOfWeek),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const needsHour = intervalChoice === "daily" || intervalChoice === "weekly";
  const needsDay = intervalChoice === "weekly";

  // Aliases include "21" / "21" / "21:00" so all three find "9:00 PM" in en.
  const hourOptions = useMemo<TypeaheadOption[]>(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        const label = formatHourLocale(h, locale);
        const padded = h.toString().padStart(2, "0");
        return {
          value: String(h),
          label,
          searchText: `${label} ${h} ${padded} ${padded}:00`,
        };
      }),
    [locale],
  );

  // Aliases include the short name so "tue" matches "Tuesday".
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateDashboardSchedule(dashboardId, {
        refresh_interval: intervalChoice === "off" ? null : intervalChoice,
        refresh_hour: needsHour ? hour : null,
        refresh_day_of_week: needsDay ? day : null,
        // Preserve the stored TZ; only fall back to browser TZ on first save
        // (when schedule.timezone is still null). Overwriting unconditionally
        // would shift the wall-clock fire time when an editor in another TZ
        // resaves an existing schedule without touching the hour.
        timezone: schedule.timezone ?? browserTz,
        next_refresh_at: null, // BE computes; this placeholder satisfies the type.
      });
      onScheduleChange(next);
      toast.success(t("orgDashboard.schedule.saved"));
      onClose();
    } catch (err) {
      console.error("Schedule update failed:", err);
      toast.error(t("orgDashboard.schedule.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>{t("orgDashboard.schedule.title")}</DialogTitle>
          <DialogDescription>
            {t("orgDashboard.schedule.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("orgDashboard.schedule.intervalLabel")}</Label>
            <RadioGroup
              value={intervalChoice}
              onValueChange={(v) => setIntervalChoice(v as FormInterval)}
              className="gap-2"
            >
              {(["off", "hourly", "every_6h", "daily", "weekly"] as const).map(
                (opt) => (
                  <div key={opt} className="flex items-center gap-2.5">
                    <RadioGroupItem value={opt} id={`interval-${opt}`} />
                    <Label
                      htmlFor={`interval-${opt}`}
                      className="cursor-pointer font-normal"
                    >
                      {t(`orgDashboard.schedule.intervals.${opt}`)}
                    </Label>
                  </div>
                ),
              )}
            </RadioGroup>
          </div>

          {(needsDay || needsHour) && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {needsDay && (
                  <div className="space-y-2">
                    <Label>{t("orgDashboard.schedule.dayLabel")}</Label>
                    <TypeaheadCombobox
                      value={String(day)}
                      options={dayOptions}
                      onValueChange={(v) => setDay(Number(v) as DayOfWeek)}
                      searchPlaceholder={t("orgDashboard.schedule.searchDay")}
                      emptyText={t("orgDashboard.schedule.noMatch")}
                    />
                  </div>
                )}

                {needsHour && (
                  <div
                    className={cn("space-y-2", !needsDay && "sm:max-w-[180px]")}
                  >
                    <Label>{t("orgDashboard.schedule.hourLabel")}</Label>
                    <TypeaheadCombobox
                      value={String(hour)}
                      options={hourOptions}
                      onValueChange={(v) => setHour(Number(v))}
                      searchPlaceholder={t("orgDashboard.schedule.searchHour")}
                      emptyText={t("orgDashboard.schedule.noMatch")}
                    />
                  </div>
                )}
              </div>

              {showTzNote && (
                <p className="text-xs text-muted-foreground">
                  {t("orgDashboard.schedule.tzNote", {
                    tz: formatTimezoneShort(effectiveTz),
                  })}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("orgDashboard.schedule.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Icon name="Loader2" size="sm" className="mr-1 animate-spin" />
            ) : null}
            {t("orgDashboard.schedule.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;
