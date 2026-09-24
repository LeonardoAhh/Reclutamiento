import { findBajaReason, findBajaType } from './bajaReasonCatalog';

export interface BajaReasonUpdate {
  num_empleado: string;
  fecha_baja: string;
  tipo_baja: string;
  /** null indica que aún no hay motivo estandarizado. */
  motivo_baja_estandarizado: string | null;
  /** null indica que no se capturó un detalle. */
  motivo_baja: string | null;
}

export type BajaReasonParseResult =
  | { ok: true; record: BajaReasonUpdate }
  | { ok: false; message: string };

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

function readString(
  row: Record<string, unknown>,
  acceptedKeys: ReadonlySet<string>,
): string {
  const entry = Object.entries(row).find(([key]) => acceptedKeys.has(normalizeKey(key)));
  return typeof entry?.[1] === 'string' || typeof entry?.[1] === 'number'
    ? String(entry[1]).trim()
    : '';
}

const EMPLOYEE_KEYS = new Set(['num empleado', 'numero de empleado', 'numero empleado']);
const DATE_KEYS = new Set(['fecha baja', 'fecha de baja']);
const TYPE_KEYS = new Set(['tipo de baja', 'tipo baja']);
const REASON_KEYS = new Set([
  'motivo de baja',
  'motivo baja',
]);
const DETAIL_KEYS = new Set(['detalle de la baja', 'detalle de baja', 'detalle baja', 'descripcion']);

function isIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseBajaReasonRecord(value: unknown): BajaReasonParseResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, message: 'Los datos de la baja no son válidos.' };
  }

  const row = value as Record<string, unknown>;
  const num_empleado = readString(row, EMPLOYEE_KEYS);
  const fecha_baja = readString(row, DATE_KEYS);
  const tipo_baja = readString(row, TYPE_KEYS);
  const reason = readString(row, REASON_KEYS);
  const detail = readString(row, DETAIL_KEYS);

  if (!num_empleado || !fecha_baja || !tipo_baja || !reason || !detail) {
    return { ok: false, message: 'Captura número de empleado, fecha, tipo y motivo de baja.' };
  }

  if (!/^\d{1,4}$/.test(num_empleado)) {
    return { ok: false, message: 'El número de empleado debe tener hasta 4 dígitos.' };
  }

  if (!isIsoCalendarDate(fecha_baja)) {
    return { ok: false, message: 'Captura una fecha de baja válida.' };
  }

  const canonicalType = findBajaType(tipo_baja);
  if (!canonicalType) {
    return { ok: false, message: 'Selecciona un tipo de baja válido.' };
  }

  const catalogMatch = findBajaReason(tipo_baja, reason);
  if (!catalogMatch) {
    return { ok: false, message: 'Selecciona un motivo de baja que corresponda al tipo indicado.' };
  }

  return {
    ok: true,
    record: {
      num_empleado,
      fecha_baja,
      tipo_baja: canonicalType,
      motivo_baja_estandarizado: catalogMatch.reason,
      motivo_baja: detail === '-' ? null : detail,
    },
  };
}
