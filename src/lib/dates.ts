/**
 * Date helpers anchored to America/Mexico_City (Querétaro).
 *
 * Reglas:
 *   - Toda fecha "calendario" (lo que ve el usuario) se calcula en TZ MX,
 *     no en TZ del visor ni en UTC. Esto evita desfases por viajes / VPN /
 *     servidores en otra zona.
 *   - Querétaro es UTC-6 fijo (Sonora no aplica, pero Querétaro tampoco
 *     observa DST desde 2022). Anclamos a noon-MX (12:00 -06:00) cuando
 *     necesitamos un ISO date-only que sobreviva cualquier conversión.
 *   - `Intl.DateTimeFormat` con `timeZone: TZ_MX` se usa para extraer
 *     partes calendáricas (año/mes/día) de un Date dado en TZ MX.
 */

/** Zona horaria canónica para todas las fechas de la app. */
export const TZ_MX = 'America/Mexico_City';

/** Desfase fijo de Querétaro vs UTC (no observa DST). */
const MX_UTC_OFFSET = '-06:00';

interface MxDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Devuelve las partes calendáricas de `date` evaluadas en TZ MX,
 * independientemente del TZ del visor o del servidor.
 */
function mxDateParts(date: Date): MxDateParts {
  if (Number.isNaN(date.getTime())) {
    return { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
  }
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ_MX,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Hoy (en TZ MX) como `YYYY-MM-DD`. Reemplaza a `new Date().toISOString().slice(0,10)`. */
export function localTodayIso(): string {
  const { year, month, day } = mxDateParts(new Date());
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Año calendario actual en TZ MX. Usar en lugar de
 * `new Date().getFullYear()` cuando el visor pueda estar en otra zona.
 */
export function currentYearMx(): number {
  return mxDateParts(new Date()).year;
}

/**
 * Estampa compacta `YYYYMMDD-HHMM` evaluada en TZ MX, útil para nombres
 * de archivos de respaldo y exportaciones.
 */
export function formatMxStamp(date: Date = new Date()): string {
  const { year, month, day, hour, minute } = mxDateParts(date);
  return `${year}${pad2(month)}${pad2(day)}-${pad2(hour)}${pad2(minute)}`;
}

/**
 * Convierte un `YYYY-MM-DD` (típicamente de `<input type="date">`) a un
 * timestamp ISO anclado a **mediodía de TZ MX**. Esto garantiza que al
 * volver a leerlo en cualquier zona, el día calendario sigue siendo el
 * mismo.
 */
export function localDateToIso(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim().slice(0, 10));
  if (!match) return null;
  // Anclar a noon-MX: `12:00:00-06:00` evita cualquier ambigüedad de DST
  // (Querétaro no observa DST) y de zona del visor.
  const d = new Date(`${match[0]}T12:00:00${MX_UTC_OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Extrae el día calendario (`YYYY-MM-DD`) de un ISO, evaluando en TZ MX.
 * Inverso de `localDateToIso`; safe para round-trip con
 * `<input type="date">`.
 */
export function isoToLocalDateString(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const { year, month, day } = mxDateParts(d);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * `YYYY-MM-DD` → timestamp ms al **inicio** de ese día en TZ MX (00:00:00).
 * Para usar como cota inferior en filtros de rango.
 */
export function startOfDayMxMs(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(input).slice(0, 10));
  if (!match) return null;
  const d = new Date(`${match[0]}T00:00:00${MX_UTC_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * `YYYY-MM-DD` → timestamp ms al **final** de ese día en TZ MX
 * (23:59:59.999). Para usar como cota superior en filtros de rango.
 */
export function endOfDayMxMs(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(input).slice(0, 10));
  if (!match) return null;
  const d = new Date(`${match[0]}T23:59:59.999${MX_UTC_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Formato compacto para tablas (`13/05/25`), en TZ MX. Robusto a
 * entradas vacías / inválidas.
 */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: TZ_MX,
  });
}

/**
 * Parse `DD/MM/YYYY` (o `DD-MM-YYYY`) → ISO `YYYY-MM-DD`. Acepta también
 * entradas ya en ISO. Regresa `null` si la entrada no es reconocible.
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

/** Extrae `YYYY-MM` de un `YYYY-MM-DD`. */
export function monthKey(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  return String(isoDate).slice(0, 7);
}

/** Lista secuencial de `YYYY-MM` para un año (Ene..Dic). */
export function monthsOfYear(year: number): string[] {
  return Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`
  );
}

/**
 * Etiqueta corta de mes (`Ene 2026`) en TZ MX. Anclamos a mediados de mes
 * para evitar bordes de día.
 */
export function formatMonthLabel(monthKeyStr: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKeyStr);
  if (!m) return monthKeyStr;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  // 15 a mediodía UTC para evitar cualquier deslizamiento.
  const d = new Date(Date.UTC(year, month, 15, 12, 0, 0));
  const label = d
    .toLocaleDateString('es-MX', { month: 'short', timeZone: TZ_MX })
    .replace('.', '');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}

/**
 * Semana ISO 8601 para una fecha (en TZ MX). Toda la aritmética se hace
 * sobre UTC anchorada al día MX para que el resultado no dependa del TZ
 * del visor.
 */
export interface IsoWeekRange {
  year: number;
  week: number;
  start: Date;
  end: Date;
}

export function isoWeekOf(input: Date | string): IsoWeekRange {
  const src = typeof input === 'string' ? new Date(input) : input;
  const { year: yMx, month: mMx, day: dMx } = mxDateParts(src);
  // Ancla en UTC = mediodía del día MX en UTC. Las operaciones setUTCDate
  // mantienen aritmética TZ-agnóstica.
  const date = new Date(Date.UTC(yMx, mMx - 1, dMx, 12, 0, 0));
  const dayIdx = (date.getUTCDay() + 6) % 7;

  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - dayIdx);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  const thursday = new Date(start);
  thursday.setUTCDate(start.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();

  // Jan 4 está siempre en la semana 1 (regla ISO).
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayIdx = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayIdx);
  week1Monday.setUTCHours(0, 0, 0, 0);

  const diffMs = thursday.getTime() - week1Monday.getTime();
  const week = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;

  return { year, week, start, end };
}

/**
 * `true` si `isoDate` cae dentro del rango `[start, end]` (inclusivo).
 * Comparación TZ-agnóstica: el día se ancla a mediodía UTC, igual que
 * los bordes que produce `isoWeekOf`.
 */
export function isInIsoWeek(
  isoDate: string | null | undefined,
  range: IsoWeekRange
): boolean {
  if (!isoDate) return false;
  const normalized = parseDdMmYyyy(isoDate) ?? String(isoDate).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!m) return false;
  const d = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)
  );
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime();
}

/**
 * Rango compacto de semana para UI de KPIs (en TZ MX).
 *   "11-17 may"      -> Lun y Dom en el mismo mes.
 *   "30 abr - 6 may" -> cruza meses.
 */
export function formatIsoWeekRange(range: IsoWeekRange): string {
  const startMx = mxDateParts(range.start);
  const endMx = mxDateParts(range.end);
  const startMonth = range.start
    .toLocaleDateString('es-MX', { month: 'short', timeZone: TZ_MX })
    .replace('.', '');
  const endMonth = range.end
    .toLocaleDateString('es-MX', { month: 'short', timeZone: TZ_MX })
    .replace('.', '');
  if (startMx.month === endMx.month) {
    return `${startMx.day}-${endMx.day} ${startMonth}`;
  }
  return `${startMx.day} ${startMonth} - ${endMx.day} ${endMonth}`;
}

/**
 * Días completos entre `from` y `to` (por defecto `now`). TZ-agnóstico:
 * usa la diferencia absoluta en ms, sin importar la zona.
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
