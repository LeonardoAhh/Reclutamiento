import {
  isNaMarker,
  mapClaveHorarioToTurno,
  matchParada,
  matchRuta,
  TRANSPORTE_NA,
} from './transporte-routes';
import type {
  Employee,
  TransporteAssignment,
  TransporteAssignmentRaw,
} from './types';

/**
 * Lee una llave de un objeto raw aceptando variantes comunes (con y sin
 * espacios al inicio/final, mayúsculas distintas). Devuelve el primer valor
 * trimeado no vacío, o `null` si ninguna alternativa aplica.
 */
function readRaw(
  row: TransporteAssignmentRaw,
  keys: ReadonlyArray<string>
): string | null {
  for (const key of keys) {
    const v = row[key];
    if (v == null) continue;
    const text = String(v).trim();
    if (text) return text;
  }
  return null;
}

export interface NormalizedTransporteRow {
  /** Asignación válida lista para upsert; `null` si la fila era inservible. */
  assignment: TransporteAssignment | null;
  /** Mensaje descriptivo de por qué se descartó (campos faltantes, etc). */
  error: string | null;
  /** Forma original de la fila para mostrarla en el preview. */
  raw: TransporteAssignmentRaw;
}

/**
 * Normaliza una fila cruda del JSON: trimea valores, asegura que
 * `num_empleado` sea string y que `ruta` + `parada` no queden vacíos. Si
 * algún requerido falta, devuelve `assignment: null` con un `error` legible.
 */
export function normalizeTransporteRow(
  row: TransporteAssignmentRaw
): NormalizedTransporteRow {
  const num = readRaw(row, ['Num Empleado', 'num_empleado', 'NumEmpleado']);
  const ruta = readRaw(row, ['Ruta', 'ruta', 'RUTA']);
  const parada = readRaw(row, ['Parada', 'parada', 'PARADA']);

  const missing: string[] = [];
  if (!num) missing.push('Num Empleado');
  if (!ruta) missing.push('Ruta');
  if (!parada) missing.push('Parada');

  if (missing.length > 0) {
    return {
      assignment: null,
      error: `Faltan campos: ${missing.join(', ')}`,
      raw: row,
    };
  }

  // Resuelve la ruta contra el catálogo oficial. Si no hace match, marcamos
  // la fila como inválida para que el preview la muestre y el usuario sepa
  // que está escribiendo una ruta no registrada (evita typos que rompan
  // el dashboard de capacidad).
  const canonicalRuta = matchRuta(ruta!);
  if (!canonicalRuta) {
    return {
      assignment: null,
      error: `Ruta no reconocida: “${ruta}”`,
      raw: row,
    };
  }

  // Si la ruta es N/A (opt-out), forzamos la parada también a N/A para
  // mantener la invariante en datos: si no toma transporte, la parada no
  // es relevante. Si llega `N/A` en parada solo, lo canonicalizamos.
  let canonicalParada: string;
  if (canonicalRuta === TRANSPORTE_NA) {
    canonicalParada = TRANSPORTE_NA;
  } else if (isNaMarker(parada!)) {
    // Inconsistencia: parada `N/A` con ruta real. Lo flagueamos.
    return {
      assignment: null,
      error: `Parada "N/A" no aplica si la ruta es ${canonicalRuta}`,
      raw: row,
    };
  } else {
    const matched = matchParada(parada!);
    canonicalParada = matched ?? parada!;
  }

  return {
    assignment: {
      num_empleado: num!,
      ruta: canonicalRuta,
      parada: canonicalParada,
    },
    error: null,
    raw: row,
  };
}

/**
 * Resultado de cruzar las asignaciones normalizadas contra la plantilla
 * actual. El preview del importer usa esta forma para mostrar al usuario qué
 * empleados se van a actualizar, cuáles cambiarán de asignación y cuáles
 * no existen.
 */
export interface TransporteDiffEntry {
  assignment: TransporteAssignment;
  /** Empleado encontrado en `empleados`, o null si no existe. */
  employee: Employee | null;
  /** Estado calculado vs el empleado actual. */
  kind: 'new' | 'changed' | 'unchanged' | 'missing';
}

export interface TransporteDiff {
  entries: TransporteDiffEntry[];
  invalid: NormalizedTransporteRow[];
  counts: {
    /** Filas válidas para enviar a Supabase. */
    applicable: number;
    /** Filas que asignan transporte por primera vez. */
    new: number;
    /** Filas que cambian la ruta/parada respecto a lo que ya estaba. */
    changed: number;
    /** Filas idénticas a la asignación actual (no se envían). */
    unchanged: number;
    /** Filas cuyo num_empleado no existe en `empleados`. */
    missing: number;
    /** Filas que no pasaron la validación de campos requeridos. */
    invalid: number;
  };
}

export function diffTransporteAssignments(
  rows: TransporteAssignmentRaw[],
  employees: Employee[]
): TransporteDiff {
  const byNum = new Map(employees.map((e) => [e.num_empleado, e] as const));
  const entries: TransporteDiffEntry[] = [];
  const invalid: NormalizedTransporteRow[] = [];

  for (const raw of rows) {
    const norm = normalizeTransporteRow(raw);
    if (!norm.assignment) {
      invalid.push(norm);
      continue;
    }
    const emp = byNum.get(norm.assignment.num_empleado) ?? null;
    let kind: TransporteDiffEntry['kind'];
    if (!emp) {
      kind = 'missing';
    } else if (!emp.ruta && !emp.parada) {
      kind = 'new';
    } else if (
      (emp.ruta ?? '') === norm.assignment.ruta &&
      (emp.parada ?? '') === norm.assignment.parada
    ) {
      kind = 'unchanged';
    } else {
      kind = 'changed';
    }
    entries.push({ assignment: norm.assignment, employee: emp, kind });
  }

  const counts = {
    applicable: entries.filter((e) => e.kind === 'new' || e.kind === 'changed').length,
    new: entries.filter((e) => e.kind === 'new').length,
    changed: entries.filter((e) => e.kind === 'changed').length,
    unchanged: entries.filter((e) => e.kind === 'unchanged').length,
    missing: entries.filter((e) => e.kind === 'missing').length,
    invalid: invalid.length,
  };

  return { entries, invalid, counts };
}

/** Resumen de capacidad agrupada por ruta y por parada. */
export interface RouteCapacity {
  ruta: string;
  total: number;
  paradas: Array<{ parada: string; total: number }>;
  /**
   * Conteo por turno para esta ruta. Las llaves son los valores que
   * realmente aparecen en `empleados.turno` (el dashboard los normaliza
   * contra `TRANSPORTE_TURNOS` para mantener un orden estable).
   */
  turnos: Array<{ turno: string; total: number }>;
}

/**
 * Construye un breakdown de capacidad por ruta a partir de la plantilla.
 * `knownRoutes` permite incluir rutas oficiales sin empleados todavía (para
 * que aparezcan en el dashboard con conteo 0 y se pueda configurar el cupo
 * desde el inicio). Solo cuenta empleados con `ruta` definida; las paradas
 * se ordenan por nombre alfabético y los turnos por valor numérico/canónico.
 */
export function buildRouteCapacity(
  employees: Employee[],
  knownRoutes: ReadonlyArray<string> = []
): RouteCapacity[] {
  const paradasByRuta = new Map<string, Map<string, number>>();
  const turnosByRuta = new Map<string, Map<string, number>>();

  for (const emp of employees) {
    if (!emp.ruta) continue;
    // Excluimos opt-outs declarados (`N/A`) del dashboard de capacidad: esos
    // empleados existen pero NO consumen plazas. Se cuentan aparte en stats
    // globales.
    if (emp.ruta === TRANSPORTE_NA) continue;
    const ruta = emp.ruta;
    const parada = emp.parada ?? 'Sin parada';
    // `empleados.turno` guarda la clave de horario (no el turno final).
    // Mapeamos a turno 1–5 vía catálogo para que el breakdown agrupe
    // empleados del mismo turno aunque tengan claves distintas.
    const turno = mapClaveHorarioToTurno(emp.turno) || '—';

    let paradas = paradasByRuta.get(ruta);
    if (!paradas) {
      paradas = new Map();
      paradasByRuta.set(ruta, paradas);
    }
    paradas.set(parada, (paradas.get(parada) ?? 0) + 1);

    let turnos = turnosByRuta.get(ruta);
    if (!turnos) {
      turnos = new Map();
      turnosByRuta.set(ruta, turnos);
    }
    turnos.set(turno, (turnos.get(turno) ?? 0) + 1);
  }

  const allRutas = new Set<string>([
    ...paradasByRuta.keys(),
    ...knownRoutes,
  ]);

  const routes: RouteCapacity[] = [];
  for (const ruta of allRutas) {
    const paradas = paradasByRuta.get(ruta) ?? new Map();
    const turnos = turnosByRuta.get(ruta) ?? new Map();

    const paradaBreakdown = Array.from(paradas.entries()).map(
      ([parada, total]) => ({ parada, total })
    );
    paradaBreakdown.sort((a, b) => a.parada.localeCompare(b.parada, 'es'));

    const turnoBreakdown = Array.from(turnos.entries()).map(
      ([turno, total]) => ({ turno, total })
    );
    turnoBreakdown.sort((a, b) => {
      // Orden numérico cuando ambos son números, luego alfabético.
      const an = Number(a.turno);
      const bn = Number(b.turno);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      if (!Number.isNaN(an)) return -1;
      if (!Number.isNaN(bn)) return 1;
      return a.turno.localeCompare(b.turno, 'es');
    });

    const total = turnoBreakdown.reduce((sum, t) => sum + t.total, 0);

    routes.push({
      ruta,
      total,
      paradas: paradaBreakdown,
      turnos: turnoBreakdown,
    });
  }

  // Mantener el orden del catálogo si se proveyó; los extras van al final.
  const orderIndex = new Map(knownRoutes.map((r, i) => [r, i] as const));
  routes.sort((a, b) => {
    const ai = orderIndex.get(a.ruta) ?? Number.POSITIVE_INFINITY;
    const bi = orderIndex.get(b.ruta) ?? Number.POSITIVE_INFINITY;
    if (ai !== bi) return ai - bi;
    return a.ruta.localeCompare(b.ruta, 'es');
  });

  return routes;
}
