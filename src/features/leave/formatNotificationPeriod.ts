import { formatReadableDate, parseDdMmYyyy, TZ_MX } from '@/lib/dates';

/** Rango breve para las filas de notificaciones, sin repetir mes ni año. */
export function formatNotificationPeriod(startInput: string, endInput: string, locale: string): string {
  const start = parseDdMmYyyy(startInput);
  const end = parseDdMmYyyy(endInput);
  if (!start || !end) return '—';
  if (start === end) return formatReadableDate(start, locale);
  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = new Date(`${end}T12:00:00Z`);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate.toISOString().slice(0, 10) !== start ||
    endDate.toISOString().slice(0, 10) !== end ||
    start > end
  )
    return '—';

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ_MX,
  });
  const partsFor = (date: Date) => {
    const parts = formatter.formatToParts(date);
    return {
      day: parts.find((part) => part.type === 'day')?.value ?? '',
      month: (parts.find((part) => part.type === 'month')?.value ?? '').replace(/\.$/, ''),
      year: parts.find((part) => part.type === 'year')?.value ?? '',
    };
  };
  const first = partsFor(startDate);
  const last = partsFor(endDate);
  const english = locale.startsWith('en');

  if (first.year !== last.year) {
    return english
      ? `${first.month} ${first.day}, ${first.year}–${last.month} ${last.day}, ${last.year}`
      : `${first.day} ${first.month} ${first.year}–${last.day} ${last.month} ${last.year}`;
  }
  if (start.slice(5, 7) !== end.slice(5, 7)) {
    return english
      ? `${first.month} ${first.day}–${last.month} ${last.day}, ${last.year}`
      : `${first.day} ${first.month}–${last.day} ${last.month} ${last.year}`;
  }
  return english
    ? `${last.month} ${first.day}–${last.day}, ${last.year}`
    : `${first.day}–${last.day} ${last.month} ${last.year}`;
}
