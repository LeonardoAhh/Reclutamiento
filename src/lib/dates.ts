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
