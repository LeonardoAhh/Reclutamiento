import type { Baja, BajaRaw, Employee } from './types';
import { monthKey, monthsOfYear, parseDdMmYyyy } from './dates';

/** Marker case-insensitive que se considera "no contabilizable". */
const SOLO_INDUCCION_RE = /solo\s+inducci[oó]n/i;

export function isSoloInduccion(b: Pick<Baja, 'tipo_baja' | 'motivo_baja'>): boolean {
  return (
    SOLO_INDUCCION_RE.test(b.tipo_baja ?? '') ||
    SOLO_INDUCCION_RE.test(b.motivo_baja ?? '')
  );
}

/**
 * Transforma una fila cruda del JSON de bajas a `Baja`. Tolera claves con
 * espacios al final (`"Tipo de Baja "`, `"Motivo de Baja "`) y fechas en
 * formato `DD/MM/YYYY`.
 */
export function transformBajaData(raw: BajaRaw): Baja {
  const getField = (key: string): string => {
    const direct = raw[key];
    if (typeof direct === 'string') return direct;
    const variant = Object.keys(raw).find((k) => k.trim() === key);
    return variant ? String(raw[variant] ?? '') : '';
  };

  return {
    num_empleado: getField('Num Empleado').trim(),
    nombre: getField('Nombre').trim(),
    area: getField('Area').trim(),
    seccion: getField('Seccion').trim(),
    puesto: getField('Puesto').trim(),
    fecha_ingreso: parseDdMmYyyy(getField('Fecha Ingreso')) ?? '',
    fecha_baja: parseDdMmYyyy(getField('Fecha Baja')) ?? '',
    tipo_baja: getField('Tipo de Baja').trim(),
    motivo_baja: getField('Motivo de Baja').trim(),
  };
}

export interface MonthlyRow {
  /** `YYYY-MM` */
  month: string;
  bajas: number;
  ingresos: number;
  cubiertas10d: number;
  /** Bajas con marca SOLO INDUCCIÓN, NO sumadas en `bajas`. */
  soloInduccion: number;
}

export interface PuestoBreakdownRow {
  area: string;
  puesto: string;
  bajas: number;
  ingresos: number;
  cubiertas10d: number;
  soloInduccion: number;
}

export interface BajaWithCobertura extends Baja {
  /**
   * `null` cuando es SOLO INDUCCIÓN (no aplica) o cuando no se encontró match;
   * `number` = días entre `fecha_baja` y la `fecha_ingreso` del empleado que
   * cubrió esa baja (puede ser > 10 si se acepta cobertura tardía).
   */
  coberturaDias: number | null;
  /** `true` si la baja fue cubierta en ≤10 días por un ingreso del mismo puesto. */
  cubiertaEn10d: boolean;
  /** `true` si la baja no se cuenta (`SOLO INDUCCIÓN`). */
  soloInduccion: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const COVER_WINDOW_DAYS = 10;

function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T12:00:00`);
  const b = new Date(`${toIso}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return Number.POSITIVE_INFINITY;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

interface IngresoCandidate {
  fecha: string; // YYYY-MM-DD
  puesto: string;
  area: string;
  /** marca para matching greedy. */
  used: boolean;
}

/**
 * Compara ingresos vs bajas mes a mes para un año dado. Adicionalmente calcula
 * cobertura ≤10d con matching greedy 1-a-1 (puesto + área, ingreso después de
 * la baja, dentro de la ventana). Las bajas con `SOLO INDUCCIÓN` se listan en
 * `bajasConCobertura` pero no entran en ningún total.
 */
export function computeMonthlyComparison(
  bajas: Baja[],
  empleados: Employee[],
  year: number,
  filters?: { area?: string; puesto?: string }
): {
  months: MonthlyRow[];
  byPuesto: PuestoBreakdownRow[];
  bajasConCobertura: BajaWithCobertura[];
  totals: {
    bajas: number;
    ingresos: number;
    cubiertas10d: number;
    soloInduccion: number;
    /** % cobertura ≤10d sobre bajas contabilizadas. */
    coverturaPct: number;
  };
} {
  const yearStr = String(year);
  const monthList = monthsOfYear(year);

  const matchesFilters = (area: string, puesto: string) => {
    if (filters?.area && area !== filters.area) return false;
    if (filters?.puesto && puesto !== filters.puesto) return false;
    return true;
  };

  // Normaliza ingresos desde empleados activos: usa fecha_ingreso como ISO.
  const ingresosCandidates: IngresoCandidate[] = [];
  for (const e of empleados) {
    const iso = parseDdMmYyyy(e.fecha_ingreso) ?? e.fecha_ingreso;
    if (!iso || !iso.startsWith(yearStr) || !matchesFilters(e.area, e.puesto)) {
      continue;
    }
    ingresosCandidates.push({
      fecha: iso,
      puesto: e.puesto,
      area: e.area,
      used: false,
    });
  }
  // Ordenados ascendente por fecha para matching estable.
  ingresosCandidates.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

  // Bajas del año (filtradas), también ordenadas asc por fecha_baja.
  const bajasYear = bajas
    .filter((b) => b.fecha_baja.startsWith(yearStr) && matchesFilters(b.area, b.puesto))
    .slice()
    .sort((a, b) => (a.fecha_baja < b.fecha_baja ? -1 : a.fecha_baja > b.fecha_baja ? 1 : 0));

  // Matching greedy 1-a-1: para cada baja contabilizable, busca el primer
  // ingreso disponible con mismo área+puesto cuya fecha caiga en
  // (fecha_baja, fecha_baja + 10d].
  const bajasConCobertura: BajaWithCobertura[] = bajasYear.map((b) => {
    const solo = isSoloInduccion(b);
    if (solo) {
      return { ...b, coberturaDias: null, cubiertaEn10d: false, soloInduccion: true };
    }
    let bestIdx = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let i = 0; i < ingresosCandidates.length; i++) {
      const c = ingresosCandidates[i];
      if (c.used) continue;
      if (c.area !== b.area || c.puesto !== b.puesto) continue;
      if (c.fecha < b.fecha_baja) continue; // ingresos previos no cubren
      const delta = diffDays(b.fecha_baja, c.fecha);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
        if (delta === 0) break;
      }
    }
    if (bestIdx >= 0 && bestDelta <= COVER_WINDOW_DAYS) {
      ingresosCandidates[bestIdx].used = true;
      return {
        ...b,
        coberturaDias: bestDelta,
        cubiertaEn10d: true,
        soloInduccion: false,
      };
    }
    return {
      ...b,
      coberturaDias: bestIdx >= 0 ? bestDelta : null,
      cubiertaEn10d: false,
      soloInduccion: false,
    };
  });

  // Agregados por mes.
  const monthMap = new Map<string, MonthlyRow>();
  for (const m of monthList) {
    monthMap.set(m, {
      month: m,
      bajas: 0,
      ingresos: 0,
      cubiertas10d: 0,
      soloInduccion: 0,
    });
  }
  for (const c of ingresosCandidates) {
    const row = monthMap.get(monthKey(c.fecha));
    if (row) row.ingresos += 1;
  }
  for (const b of bajasConCobertura) {
    const row = monthMap.get(monthKey(b.fecha_baja));
    if (!row) continue;
    if (b.soloInduccion) {
      row.soloInduccion += 1;
    } else {
      row.bajas += 1;
      if (b.cubiertaEn10d) row.cubiertas10d += 1;
    }
  }

  // Agregados por (area, puesto). Restringe ingresos a los que matchean
  // los filtros activos.
  const puestoKey = (area: string, puesto: string) => `${area}\u0000${puesto}`;
  const puestoMap = new Map<string, PuestoBreakdownRow>();
  const getOrCreate = (area: string, puesto: string): PuestoBreakdownRow => {
    const k = puestoKey(area, puesto);
    const existing = puestoMap.get(k);
    if (existing) return existing;
    const fresh: PuestoBreakdownRow = {
      area,
      puesto,
      bajas: 0,
      ingresos: 0,
      cubiertas10d: 0,
      soloInduccion: 0,
    };
    puestoMap.set(k, fresh);
    return fresh;
  };
  for (const c of ingresosCandidates) {
    getOrCreate(c.area, c.puesto).ingresos += 1;
  }
  for (const b of bajasConCobertura) {
    const row = getOrCreate(b.area, b.puesto);
    if (b.soloInduccion) {
      row.soloInduccion += 1;
    } else {
      row.bajas += 1;
      if (b.cubiertaEn10d) row.cubiertas10d += 1;
    }
  }

  const totalBajas = bajasConCobertura.filter((b) => !b.soloInduccion).length;
  const totalCubiertas = bajasConCobertura.filter(
    (b) => !b.soloInduccion && b.cubiertaEn10d
  ).length;
  const totalSolo = bajasConCobertura.length - totalBajas;
  const totalIngresos = ingresosCandidates.length;

  return {
    months: monthList.map((m) => monthMap.get(m)!),
    byPuesto: Array.from(puestoMap.values()).sort(
      (a, b) => b.bajas - a.bajas || b.ingresos - a.ingresos
    ),
    bajasConCobertura,
    totals: {
      bajas: totalBajas,
      ingresos: totalIngresos,
      cubiertas10d: totalCubiertas,
      soloInduccion: totalSolo,
      coverturaPct: totalBajas > 0 ? Math.round((totalCubiertas / totalBajas) * 100) : 0,
    },
  };
}
