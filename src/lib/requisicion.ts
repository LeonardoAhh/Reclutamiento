/**
 * Helpers de requisición de personal.
 *
 * Cada baja activa puede generar una "Requisición de Personal" imprimible
 * para que el reclutador busque un reemplazo. Cada formato lleva un código
 * de registro determinístico tipo `VAC-01` para trazabilidad en papel.
 */

import type { Baja } from './types';

/**
 * Clave estable para identificar una baja sin depender del id de DB.
 *
 * Usar `num_empleado + fecha_baja` evita colisiones cuando un mismo número
 * se reasigna a otro empleado tras una recontratación.
 */
export function bajaKey(b: Pick<Baja, 'num_empleado' | 'fecha_baja'>): string {
  return `${b.num_empleado}::${b.fecha_baja}`;
}

/**
 * Construye un mapa `bajaKey → "VAC-NN"` ordenando todas las bajas por
 * fecha ascendente y, en empate, por número de empleado. Es determinístico:
 * la misma lista produce siempre los mismos códigos, sin importar cuándo se
 * abra el modal de requisición.
 */
export function buildRequisicionCodes(bajas: Baja[]): Map<string, string> {
  const sorted = [...bajas].sort((a, b) => {
    if (a.fecha_baja !== b.fecha_baja) {
      return a.fecha_baja.localeCompare(b.fecha_baja);
    }
    return a.num_empleado.localeCompare(b.num_empleado);
  });

  const map = new Map<string, string>();
  sorted.forEach((b, i) => {
    map.set(bajaKey(b), formatRequisicionCode(i + 1));
  });
  return map;
}

/**
 * Formatea un entero como código de requisición `VAC-NN`. Padding de 2
 * dígitos por defecto y se expande automáticamente cuando excede 99.
 */
export function formatRequisicionCode(n: number): string {
  const digits = Math.max(2, String(n).length);
  return `VAC-${String(n).padStart(digits, '0')}`;
}
