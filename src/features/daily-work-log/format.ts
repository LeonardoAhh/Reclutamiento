const DAILY_WORK_LOCALE = "es-MX";
const MILLISECONDS_PER_MINUTE = 60_000;

export function getLocalDateInputValue(date = new Date()): string {
  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * MILLISECONDS_PER_MINUTE,
  );
  return localTime.toISOString().slice(0, 10);
}

export function formatDailyWorkDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(DAILY_WORK_LOCALE, {
    dateStyle: "long",
  }).format(new Date(year, month - 1, day));
}

export function formatDailyWorkTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value;

  return new Intl.DateTimeFormat(DAILY_WORK_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

export function formatDailyWorkFileSize(bytes: number): string {
  return new Intl.NumberFormat(DAILY_WORK_LOCALE, {
    style: "unit",
    unit: "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: 0,
  }).format(bytes / 1024);
}

export function isDailyWorkImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
