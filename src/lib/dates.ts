/**
 * Date helpers that stay TZ-safe when interacting with `<input type="date">`.
 *
 * Background:
 *   `<input type="date">` produces strings in `YYYY-MM-DD` format. Doing
 *   `new Date("YYYY-MM-DD")` parses them as **UTC midnight**, which gets
 *   rendered as the previous day in any TZ west of UTC (e.g. Mexico, UTC-6,
 *   shows it as 18:00 of the day before).
 *
 *   Mirror problem: `new Date().toISOString().slice(0,10)` returns the
 *   current UTC day. In Mexico after 18:00 local time this returns *tomorrow*.
 *
 *   These helpers anchor every "date-only" value to **noon local time**,
 *   so the same calendar day is preserved across any TZ offset within ±12h.
 */

/** Today (local) in `YYYY-MM-DD` format. Safe in any TZ. */
export function localTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Convert a `YYYY-MM-DD` (from `<input type="date">`) into an ISO timestamp
 * anchored to **noon local time** of that calendar day. This makes the
 * resulting ISO render back to the same `YYYY-MM-DD` regardless of the
 * viewer's timezone.
 *
 * Returns `null` for empty/invalid input so callers can store SQL `NULL`.
 */
export function localDateToIso(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim().slice(0, 10));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  // Build the date in *local* time; the underlying timestamp then
  // corresponds to noon local, which is well clear of any DST/TZ edges.
  const d = new Date(year, month, day, 12, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Extract the calendar day (`YYYY-MM-DD`) from a stored ISO timestamp,
 * interpreting it in the **viewer's local timezone**. Inverse of
 * `localDateToIso` and safe for round-tripping `<input type="date">`.
 */
export function isoToLocalDateString(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compact, locale-aware date for table cells (es-MX): `13-may`, `01-ene`, etc.
 * Falls back to `—` when the input is empty/invalid.
 */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

/**
 * Parse a date in `DD/MM/YYYY` (or `DD-MM-YYYY`) into ISO `YYYY-MM-DD`.
 * Returns `null` for empty / unrecognized input. Already-ISO inputs pass through.
 */
export function parseDdMmYyyy(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return `${m[3]}-${mm}-${dd}`;
}

/** Extract `YYYY-MM` month key from a `YYYY-MM-DD` string. */
export function monthKey(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  return String(isoDate).slice(0, 7);
}

/** Build a sequential list of `YYYY-MM` keys for a given year (Jan..Dec). */
export function monthsOfYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

/**
 * Localized month label (es-MX), e.g. `Ene 2026`. Robust to non-month-keys.
 */
export function formatMonthLabel(monthKeyStr: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKeyStr);
  if (!m) return monthKeyStr;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const d = new Date(year, month, 1);
  const label = d.toLocaleDateString('es-MX', { month: 'short' });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}

/**
 * ISO 8601 week descriptor for a given local date.
 *
 *   - `year`: ISO week-numbering year (may differ from calendar year for
 *             the first/last few days of a year).
 *   - `week`: 1..53.
 *   - `start`: Monday 00:00 local of that week.
 *   - `end`:   Sunday 23:59:59.999 local of that week.
 *
 * Implementation uses the standard "Thursday rule":
 *   Move the input date to the Thursday of the same ISO week, then take that
 *   year as the ISO year and compute the offset from Jan 4 (which is always
 *   in week 1 by definition).
 */
export interface IsoWeekRange {
  year: number;
  week: number;
  start: Date;
  end: Date;
}

export function isoWeekOf(input: Date | string): IsoWeekRange {
  const src = typeof input === 'string' ? new Date(input) : input;
  // Anchor to local midnight to avoid TZ creep.
  const date = new Date(src.getFullYear(), src.getMonth(), src.getDate());
  // Mon..Sun -> 0..6 with Mon=0.
  const dayIdx = (date.getDay() + 6) % 7;

  const start = new Date(date);
  start.setDate(date.getDate() - dayIdx);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const thursday = new Date(start);
  thursday.setDate(start.getDate() + 3);
  const year = thursday.getFullYear();

  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(year, 0, 4);
  const jan4DayIdx = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4DayIdx);

  const diffMs = thursday.getTime() - week1Monday.getTime();
  const week = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;

  return { year, week, start, end };
}

/**
 * Returns `true` if `isoDate` (in `YYYY-MM-DD` or any parseable form) falls
 * inside the inclusive `[start, end]` window of `range`. Empty / invalid
 * inputs return `false`.
 */
export function isInIsoWeek(
  isoDate: string | null | undefined,
  range: IsoWeekRange
): boolean {
  if (!isoDate) return false;
  const normalized = parseDdMmYyyy(isoDate) ?? String(isoDate).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime();
}

/**
 * Compact human-readable week range for the KPIs UI. Examples (es-MX):
 *   "11-17 may"      -> Mon and Sun in the same month.
 *   "30 abr - 6 may" -> spans two months.
 */
export function formatIsoWeekRange(range: IsoWeekRange): string {
  const startDay = range.start.getDate();
  const endDay = range.end.getDate();
  const startMonth = range.start
    .toLocaleDateString('es-MX', { month: 'short' })
    .replace('.', '');
  const endMonth = range.end
    .toLocaleDateString('es-MX', { month: 'short' })
    .replace('.', '');
  if (range.start.getMonth() === range.end.getMonth()) {
    return `${startDay}-${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

/**
 * Count whole days between `from` and `to` (defaults to "now"), using local
 * timezone. Returns a non-negative integer; negative deltas clamp to 0.
 */
export function daysBetween(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined = new Date()
): number {
  if (!from || !to) return 0;
  const start = typeof from === 'string' ? new Date(from) : from;
  const end = typeof to === 'string' ? new Date(to) : to;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
