/** Un movimiento de plantilla reducido a lo que decide si dos filas son la misma. */
export interface MovementInput {
  puesto?: string | null;
  dateIso: string;
  /** Opcional: donde el turno distingue plazas, entra en la clave. */
  turno?: string | null;
  isStarlite?: boolean | null;
}

export interface MovementGroup {
  key: string;
  puesto: string;
  turno: string;
  isStarlite: boolean;
  dateIso: string;
  count: number;
}

/**
 * Agrupa ingresos o bajas por puesto, fecha y distintivo: las repeticiones
 * suman cantidad en vez de ocupar una fila cada una. El distintivo entra en la
 * clave porque dos plazas con el mismo nombre y distinto distintivo no son la
 * misma plaza. Ordena por fecha, luego por volumen y al final por nombre.
 */
export function groupMovements(
  rows: readonly MovementInput[],
  fallbackPosition: string,
): MovementGroup[] {
  const groups = new Map<string, MovementGroup>();

  for (const row of rows) {
    const puesto = row.puesto || fallbackPosition;
    const isStarlite = Boolean(row.isStarlite);
    const turno = row.turno ?? '';
    const key = [puesto, turno, row.dateIso, isStarlite].join('|');
    const current = groups.get(key);
    if (current) {
      current.count += 1;
      continue;
    }
    groups.set(key, { key, puesto, turno, isStarlite, dateIso: row.dateIso, count: 1 });
  }

  return Array.from(groups.values()).sort((left, right) => {
    const byDate = left.dateIso.localeCompare(right.dateIso);
    if (byDate !== 0) return byDate;
    const byVolume = right.count - left.count;
    if (byVolume !== 0) return byVolume;
    const byPosition = left.puesto.localeCompare(right.puesto, 'es');
    if (byPosition !== 0) return byPosition;
    return left.turno.localeCompare(right.turno, 'es', { numeric: true });
  });
}
