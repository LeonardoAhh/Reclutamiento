/**
 * Catálogo de rutas de transporte autorizadas. Es la fuente única de verdad
 * para la página /transporte: el importer rechaza filas cuya ruta no exista
 * acá, y el dashboard de capacidad construye una columna por cada turno
 * conocido para cada ruta.
 *
 * Mantenemos el formato exacto provisto por RH (incluye guiones / espacios
 * irregulares) para que el JSON que ellos suban haga match 1-a-1 sin
 * transformaciones manuales. La comparación se hace con `normalizeRuta` (ver
 * abajo) para tolerar pequeñas diferencias de capitalización y espacios.
 */
export const TRANSPORTE_RUTAS = [
  'R1- QUERETARO- PIE DE LA CUESTA',
  'R2- SAN JOSE ITURBIDE',
  'R3- SAN JOSE ITURBIDE 2',
  'R4-SANTA ROSA',
  'R5- QUERETARO-AV. DE LA LUZ',
  'R6- AV. DE LA LUZ - PASEOS QUERETARO',
] as const;

export type TransporteRuta = (typeof TRANSPORTE_RUTAS)[number];

/**
 * Turnos canónicos. Se alinea con el `<select>` de `EmployeeModal` para que
 * el dashboard de transporte muestre las mismas categorías que el módulo
 * de empleados. `0` aparece en algunos registros administrativos viejos y
 * se incluye al final para que no se pierda.
 */
export const TRANSPORTE_TURNOS = ['1', '2', '3', '4', 'Mixto', '0'] as const;

export type TransporteTurno = (typeof TRANSPORTE_TURNOS)[number];

/**
 * Normaliza el nombre de una ruta para comparaciones tolerantes a espacios
 * y mayúsculas. Reemplaza secuencias de whitespace por un único espacio y
 * trimea bordes; mantiene los acentos para no perder la identidad real.
 */
export function normalizeRuta(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

const RUTAS_BY_NORM = new Map(
  TRANSPORTE_RUTAS.map((r) => [normalizeRuta(r), r] as const)
);

/**
 * Devuelve la ruta canónica que corresponde a `value`, o `null` si no hay
 * match en el catálogo. Útil para el importer: si una fila trae
 * `"r1-queretaro-pie de la cuesta"` con minúsculas, encuentra la versión
 * oficial sin romper la asignación.
 */
export function matchRuta(value: string): TransporteRuta | null {
  return RUTAS_BY_NORM.get(normalizeRuta(value)) ?? null;
}

/**
 * Etiqueta corta (`R1`, `R2`, …) extraída del prefijo del nombre de la ruta.
 * Si la ruta no sigue ese formato, devuelve el nombre completo como fallback.
 */
export function rutaShortCode(value: string): string {
  const match = value.match(/^\s*(R\d+)/i);
  return match ? match[1].toUpperCase() : value;
}

/**
 * Etiqueta humana para un turno. Mantiene el valor crudo si no es uno de los
 * canónicos (en lugar de borrarlo) para no esconder datos viejos.
 */
export function turnoLabel(value: string): string {
  const v = value.trim();
  if (!v) return '—';
  if (v === 'Mixto') return 'Mixto';
  if (/^\d+$/.test(v)) return `T${v}`;
  return v;
}
