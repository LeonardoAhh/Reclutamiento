import { CLAVE_HORARIO_TO_TURNO, mapClaveHorarioToTurno } from './transporte-routes';
import type { Employee, TurnoAssignment, TurnoAssignmentRaw } from './types';

/**
 * Lee una llave de un objeto raw aceptando variantes comunes (con y sin
 * espacios al inicio/final, mayúsculas distintas). Devuelve el primer valor
 * trimeado no vacío, o `null` si ninguna alternativa aplica.
 */
function readRaw(
  row: TurnoAssignmentRaw,
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

export interface NormalizedTurnoRow {
  /** Asignación válida lista para update; `null` si la fila era inservible. */
  assignment: TurnoAssignment | null;
  /** Mensaje descriptivo de por qué se descartó (campos faltantes, clave fuera del catálogo). */
  error: string | null;
  /** Forma original de la fila para mostrarla en el preview. */
  raw: TurnoAssignmentRaw;
}

/**
 * Normaliza una fila cruda del JSON: trimea valores, asegura que
 * `num_empleado` sea string y que la `Turno` (clave de horario) esté en
 * el catálogo `CLAVE_HORARIO_TO_TURNO`. Si la clave no existe, devuelve
 * `assignment: null` con un `error` legible para que el preview lo muestre.
 */
export function normalizeTurnoRow(row: TurnoAssignmentRaw): NormalizedTurnoRow {
  const num = readRaw(row, ['Num Empleado', 'num_empleado', 'NumEmpleado', 'NUM EMPLEADO']);
  const clave = readRaw(row, [
    'Turno',
    'turno',
    'TURNO',
    'Clave de Horario',
    'CLAVE DE HORARIO',
    'clave_horario',
    'CLAVE DE HORARIO ', // tolerar trailing space
    'TURNO ',
  ]);

  const missing: string[] = [];
  if (!num) missing.push('Num Empleado');
  if (!clave) missing.push('Turno');

  if (missing.length > 0) {
    return {
      assignment: null,
      error: `Faltan campos: ${missing.join(', ')}`,
      raw: row,
    };
  }

  // Validamos contra el catálogo de claves de horario. Si la clave no está
  // mapeada, marcamos la fila como inválida — el usuario debe corregir el
  // JSON o pedir a RH que sume la clave al catálogo.
  if (!(clave! in CLAVE_HORARIO_TO_TURNO)) {
    return {
      assignment: null,
      error: `Clave de horario no reconocida: “${clave}”`,
      raw: row,
    };
  }

  return {
    assignment: { num_empleado: num!, turno: clave! },
    error: null,
    raw: row,
  };
}

/**
 * Resultado de cruzar las asignaciones de turno contra la plantilla actual.
 * El preview del importer usa esta forma para mostrar al usuario cuántos
 * empleados se actualizarán, cuáles cambian de clave y cuáles no existen.
 */
export interface TurnoDiffEntry {
  assignment: TurnoAssignment;
  /** Empleado encontrado en `empleados`, o null si no existe. */
  employee: Employee | null;
  /** Estado calculado vs el empleado actual. */
  kind: 'new' | 'changed' | 'unchanged' | 'missing';
}

export interface TurnoDiff {
  entries: TurnoDiffEntry[];
  invalid: NormalizedTurnoRow[];
  counts: {
    /** Filas válidas listas para aplicar (kind === 'new' || 'changed'). */
    applicable: number;
    /** Filas para empleados sin clave registrada. */
    new: number;
    /** Filas que cambian la clave actual. */
    changed: number;
    /** Filas idénticas a la clave existente. */
    unchanged: number;
    /** Filas cuyo num_empleado no existe en la plantilla. */
    missing: number;
    /** Filas que no pasaron validación (clave fuera de catálogo, faltantes). */
    invalid: number;
  };
}

export function diffTurnoAssignments(
  rows: TurnoAssignmentRaw[],
  employees: Employee[]
): TurnoDiff {
  const byNum = new Map(employees.map((e) => [e.num_empleado, e] as const));
  const entries: TurnoDiffEntry[] = [];
  const invalid: NormalizedTurnoRow[] = [];

  for (const raw of rows) {
    const norm = normalizeTurnoRow(raw);
    if (!norm.assignment) {
      invalid.push(norm);
      continue;
    }
    const emp = byNum.get(norm.assignment.num_empleado) ?? null;
    let kind: TurnoDiffEntry['kind'];
    if (!emp) {
      kind = 'missing';
    } else if (!emp.turno) {
      kind = 'new';
    } else if (emp.turno === norm.assignment.turno) {
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

/**
 * Helper para el preview: devuelve el turno final (1-5) que resultará
 * después de aplicar la asignación. Conveniencia: re-exportamos a través
 * de `transporte-routes` el verdadero mapeo.
 */
export function previewTurno(clave: string): string {
  return mapClaveHorarioToTurno(clave);
}
