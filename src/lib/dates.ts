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
 * Suma o resta días a una fecha ISO `YYYY-MM-DD` y devuelve el resultado
 * como `YYYY-MM-DD` en TZ MX. Si la fecha de entrada es inválida, devuelve null.
 */
export function addDaysToIso(isoDate: string | null | undefined, days: number): string | null {
  if (!isoDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim().slice(0, 10));
  if (!match) return null;
  
  // Crear fecha en TZ MX anclada a mediodía
  const d = new Date(`${match[0]}T12:00:00${MX_UTC_OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  
  // Sumar días (en milisegundos)
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Extraer partes en TZ MX
  const { year, month, day } = mxDateParts(d);
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
 *
 * Para entradas date-only (`YYYY-MM-DD` o `DD/MM/YYYY` del JSON / Excel),
 * el día se ancla a mediodía-MX antes de renderizar. Esto evita el
 * off-by-one clásico: `new Date('2026-05-15')` se interpreta como UTC
 * midnight, y al renderizar en TZ MX (UTC−6) caería el 14/05/26.
 */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const trimmed = String(iso).trim();
  if (!trimmed) return '—';

  // Si la entrada es date-only (sin info de hora/zona), anclamos a
  // mediodía MX. Cualquier otra cosa (ISO con `T`/`Z`/offset) se parsea
  // tal cual: ya trae zona y `toLocaleDateString` resuelve el día.
  const dateOnly = parseDdMmYyyy(trimmed);
  const d = dateOnly
    ? new Date(`${dateOnly}T12:00:00${MX_UTC_OFFSET}`)
    : new Date(trimmed);

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

  // Anclamos los bordes a medianoche MX (= 06:00 UTC) para que la semana
  // ISO se calcule respecto al calendario local mexicano. Si los bordes
  // quedaran en 00:00 UTC, al renderizarlos en TZ MX el lunes se "vería"
  // como domingo (off-by-one).
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - dayIdx);
  start.setUTCHours(6, 0, 0, 0);

  // Fin = siguiente lunes 05:59:59.999 UTC = domingo 23:59:59.999 MX.
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  end.setUTCHours(5, 59, 59, 999);

  const thursday = new Date(start);
  thursday.setUTCDate(start.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();

  // Jan 4 está siempre en la semana 1 (regla ISO).
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayIdx = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayIdx);
  week1Monday.setUTCHours(6, 0, 0, 0);

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

/**
 * Días festivos de México (formato YYYY-MM-DD).
 * Solo incluye fechas fijas y los días festivos más comunes.
 * Nota: Algunos días festivos son móviles (como el tercer lunes de marzo para el natalicio de Benito Juárez).
 */
const MEXICO_HOLIDAYS: Set<string> = new Set([
  // 2024
  '2024-01-01', // Año Nuevo
  '2024-02-05', // Día de la Constitución (primer lunes de febrero)
  '2024-03-18', // Natalicio de Benito Juárez (tercer lunes de marzo)
  '2024-05-01', // Día del Trabajo
  '2024-09-16', // Día de la Independencia
  '2024-11-18', // Día de la Revolución (tercer lunes de noviembre)
  '2024-12-25', // Navidad
  
  // 2025
  '2025-01-01', // Año Nuevo
  '2025-02-03', // Día de la Constitución (primer lunes de febrero)
  '2025-03-17', // Natalicio de Benito Juárez (tercer lunes de marzo)
  '2025-05-01', // Día del Trabajo
  '2025-09-16', // Día de la Independencia
  '2025-11-17', // Día de la Revolución (tercer lunes de noviembre)
  '2025-12-25', // Navidad
  
  // 2026
  '2026-01-01', // Año Nuevo
  '2026-02-02', // Día de la Constitución (primer lunes de febrero)
  '2026-03-16', // Natalicio de Benito Juárez (tercer lunes de marzo)
  '2026-05-01', // Día del Trabajo
  '2026-09-16', // Día de la Independencia
  '2026-11-16', // Día de la Revolución (tercer lunes de noviembre)
  '2026-12-25', // Navidad
  
  // 2027
  '2027-01-01', // Año Nuevo
  '2027-02-01', // Día de la Constitución (primer lunes de febrero)
  '2027-03-15', // Natalicio de Benito Juárez (tercer lunes de marzo)
  '2027-05-01', // Día del Trabajo
  '2027-09-16', // Día de la Independencia
  '2027-11-15', // Día de la Revolución (tercer lunes de noviembre)
  '2027-12-25', // Navidad
]);

/**
 * Verifica si una fecha es día hábil (lunes a viernes, excluyendo festivos).
 * @param date Fecha a verificar
 * @returns true si es día hábil, false si es fin de semana o festivo
 */
export function isBusinessDay(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  
  // Obtener el día de la semana en TZ MX
  const { year, month, day } = mxDateParts(d);
  const dayOfWeek = new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00${MX_UTC_OFFSET}`).getDay();
  
  // 0 = domingo, 6 = sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  
  // Verificar si es festivo
  const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
  if (MEXICO_HOLIDAYS.has(dateKey)) return false;
  
  return true;
}

/**
 * Agrega días hábiles a una fecha (excluyendo fines de semana y festivos).
 * 
 * @param startDate Fecha de inicio (en formato YYYY-MM-DD o Date)
 * @param businessDays Número de días hábiles a agregar
 * @returns Fecha resultante en formato YYYY-MM-DD, o null si la entrada es inválida
 */
export function addBusinessDays(
  startDate: string | Date | null | undefined,
  businessDays: number
): string | null {
  if (!startDate || businessDays < 0) return null;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  if (Number.isNaN(start.getTime())) return null;
  
  // Normalizar a medianoche en TZ MX
  const startParts = mxDateParts(start);
  const current = new Date(`${startParts.year}-${pad2(startParts.month)}-${pad2(startParts.day)}T12:00:00${MX_UTC_OFFSET}`);
  
  let daysAdded = 0;
  
  // Iterar hasta agregar la cantidad de días hábiles solicitada
  while (daysAdded < businessDays) {
    current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
    if (isBusinessDay(current)) {
      daysAdded++;
    }
  }
  
  // Retornar en formato YYYY-MM-DD
  const resultParts = mxDateParts(current);
  return `${resultParts.year}-${pad2(resultParts.month)}-${pad2(resultParts.day)}`;
}

/**
 * Calcula días hábiles entre dos fechas (excluyendo fines de semana y festivos).
 * Solo cuenta lunes a viernes, excluyendo sábados, domingos y días festivos oficiales.
 * 
 * @param from Fecha de inicio (incluida si es día hábil)
 * @param to Fecha de fin (incluida si es día hábil), por defecto hoy
 * @returns Número de días hábiles entre las fechas
 */
export function businessDaysBetween(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined = new Date()
): number {
  if (!from || !to) return 0;
  
  // Las fechas tipo "YYYY-MM-DD" deben interpretarse en TZ MX, NO en UTC
  // (de lo contrario new Date("2026-06-19") cae el 18 a las 18:00 en México).
  const parse = (v: string | Date): Date =>
    typeof v === 'string'
      ? /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? new Date(`${v}T00:00:00${MX_UTC_OFFSET}`)
        : new Date(v)
      : v;
  const start = parse(from);
  const end = parse(to);
  
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  
  // Normalizar a medianoche en TZ MX para comparación correcta
  const startParts = mxDateParts(start);
  const endParts = mxDateParts(end);
  
  const startDate = new Date(`${startParts.year}-${pad2(startParts.month)}-${pad2(startParts.day)}T00:00:00${MX_UTC_OFFSET}`);
  const endDate = new Date(`${endParts.year}-${pad2(endParts.month)}-${pad2(endParts.day)}T00:00:00${MX_UTC_OFFSET}`);
  
  if (endDate.getTime() < startDate.getTime()) return 0;
  
  let count = 0;
  const current = new Date(startDate);
  
  // Iterar día por día contando solo días hábiles
  while (current.getTime() <= endDate.getTime()) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return count;
}

/**
 * Rango de una **semana de pauta** (Miércoles → Martes), evaluada en TZ MX.
 *
 * `startWed` siempre es el miércoles de inicio anclado a mediodía MX y
 * `endTue` es el martes siguiente, también a mediodía MX. `timeKey` es
 * útil como clave de agrupación.
 *
 * Toda la aritmética se hace sobre UTC anclando primero el día MX del
 * input, lo que la vuelve **TZ-agnóstica**: produce el mismo resultado
 * independientemente de la zona horaria del navegador.
 */
export interface PautaWeekRange {
  startWed: Date;
  endTue: Date;
  timeKey: number;
}

export function getPautaWeekRange(input: Date | string | null | undefined): PautaWeekRange | null {
  if (input === null || input === undefined) return null;

  // 1. Normalizar a `YYYY-MM-DD` en TZ MX.
  let isoDay: string | null = null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const ddmm = parseDdMmYyyy(trimmed);
    if (ddmm) {
      isoDay = ddmm;
    } else {
      // Si empieza con `YYYY-MM-DD` (con o sin parte de hora) y NO trae
      // sufijo de zona (`Z` u offset), la tratamos como **hora local MX**
      // y nos quedamos solo con la parte de fecha. Esto cubre los valores
      // de `<input type="datetime-local">` (`2026-05-15T14:30`) que se
      // guardan sin TZ pero representan hora de Querétaro.
      const dateOnlyMatch = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.exec(trimmed);
      if (dateOnlyMatch) {
        isoDay = dateOnlyMatch[1];
      } else {
        // ISO completo con hora y zona (Z u offset) → extraer día calendario MX.
        const d = new Date(trimmed);
        if (!Number.isNaN(d.getTime())) {
          const { year, month, day } = mxDateParts(d);
          isoDay = `${year}-${pad2(month)}-${pad2(day)}`;
        }
      }
    }
  } else if (input instanceof Date && !Number.isNaN(input.getTime())) {
    const { year, month, day } = mxDateParts(input);
    isoDay = `${year}-${pad2(month)}-${pad2(day)}`;
  }
  if (!isoDay) return null;

  // 2. Anclar a mediodía MX. Esto produce un instante UTC fijo:
  //    `T12:00:00-06:00` = 18:00:00 UTC del mismo día MX.
  //    A esa hora, `getUTCDay()` siempre devuelve el día de la semana
  //    correcto del día calendario MX (no del navegador).
  const anchor = new Date(`${isoDay}T12:00:00${MX_UTC_OFFSET}`);
  if (Number.isNaN(anchor.getTime())) return null;

  // 3. Día de la semana en MX (0=Dom, 1=Lun, 2=Mar, 3=Mié, …, 6=Sáb).
  const dayMx = anchor.getUTCDay();

  // 4. Días a retroceder hasta el miércoles de la misma semana de pauta.
  //    Mié=3 → 0, Jue=4 → 1, …, Mar=2 → 6 (la semana pasa Mié→Mar).
  const diffToWed = dayMx >= 3 ? dayMx - 3 : dayMx + 4;

  // 5. Aritmética en ms (Querétaro no observa DST, 1 día = 86 400 000 ms).
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startWed = new Date(anchor.getTime() - diffToWed * DAY_MS);
  const endTue = new Date(startWed.getTime() + 6 * DAY_MS);

  return { startWed, endTue, timeKey: startWed.getTime() };
}

/**
 * Suma N semanas (de 7 días, en MX sin DST) a un `PautaWeekRange` y
 * devuelve un nuevo rango. Útil para construir “semana anterior /
 * actual / siguiente”.
 */
export function shiftPautaWeek(range: PautaWeekRange, weeks: number): PautaWeekRange {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startWed = new Date(range.startWed.getTime() + weeks * 7 * DAY_MS);
  const endTue = new Date(startWed.getTime() + 6 * DAY_MS);
  return { startWed, endTue, timeKey: startWed.getTime() };
}

/**
 * Devuelve la fecha ISO (YYYY-MM-DD) del próximo miércoles en base a `dateIso`.
 * Si `dateIso` es lunes, martes o miércoles, el próximo ingreso será en esa misma semana.
 * Si `dateIso` es jueves, viernes, sábado o domingo, el próximo ingreso será el miércoles de la semana siguiente.
 */
export function getNextWednesdayIso(dateIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateIso).slice(0, 10));
  if (!match) return dateIso;
  // Anclar a mediodía MX → `getUTCDay()` devuelve el día de la semana
  // MX correcto, sin importar la zona horaria del navegador.
  const d = new Date(`${match[0]}T12:00:00${MX_UTC_OFFSET}`);
  const dayOfWeek = d.getUTCDay(); // 0 = dom, ..., 3 = mié

  let daysToAdd = 0;
  if (dayOfWeek <= 3) {
    daysToAdd = 3 - dayOfWeek;
  } else {
    daysToAdd = 7 - (dayOfWeek - 3);
  }

  d.setTime(d.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  // Extraer YYYY-MM-DD usando partes MX (TZ-agnóstico).
  const { year, month, day } = mxDateParts(d);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Formatea una fecha ISO para las tarjetas de proyección (ej. "Mié 16 Jun").
 */
export function formatProjectionDate(dateIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateIso).slice(0, 10));
  if (!match) return dateIso;
  const d = new Date(`${match[0]}T12:00:00-06:00`);
  let label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ_MX }).replace(/\./g, '');
  return label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
