// 0=Mon..6=Sun, matching Python's weekday() so it lines up with the backend.
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Browser's IANA TZ — sent to BE on schedule write; anchors daily/weekly fires.
export const getBrowserTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

// Locale-aware time format: en → "9:00 AM", de → "09:00".
export const formatHourLocale = (hour: number, locale: string): string => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.toLowerCase().startsWith("en"),
  }).format(d);
};

// 0=Mon..6=Sun (matches Python's weekday() and stored refresh_day_of_week).
// 2025-06-02 is a Monday — anchor for the offset.
export const formatDayLocale = (
  dayIdx: number,
  locale: string,
  style: "long" | "short" = "long",
): string => {
  const base = new Date(2025, 5, 2);
  base.setDate(base.getDate() + dayIdx);
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(base);
};

// "in 45 min" / "in 2 hr" / "in 3 days" — locale-aware. Floors to 1 minute
// so we never render "in 0 minutes" near the fire.
export const formatRelativeTime = (
  isoTimestamp: string,
  locale: string,
  nowMs?: number,
): string => {
  const now = nowMs ?? Date.now();
  const ms = new Date(isoTimestamp).getTime() - now;
  const absMs = Math.abs(ms);
  const sign = ms < 0 ? -1 : 1;
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });

  if (absMs < 3_600_000) {
    return rtf.format(sign * Math.max(1, Math.round(absMs / 60_000)), "minute");
  }
  if (absMs < 86_400_000) {
    return rtf.format(sign * Math.round(absMs / 3_600_000), "hour");
  }
  return rtf.format(sign * Math.round(absMs / 86_400_000), "day");
};

// "Europe/Berlin" → "Berlin", "America/Toronto" → "Toronto", "UTC" → "UTC".
export const formatTimezoneShort = (tz: string): string => {
  const parts = tz.split("/");
  const last = parts[parts.length - 1] ?? tz;
  return last.replace(/_/g, " ");
};
