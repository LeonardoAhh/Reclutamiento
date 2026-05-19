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
 * Capacidad máxima por ruta (asientos disponibles considerando los 4 turnos
 * combinados). El cupo es **fijo y compartido** entre todos los turnos: si
 * un turno se llena, los demás siguen disponibles hasta que el total de la
 * ruta llegue a este número.
 *
 * Fuente: catálogo provisto por RH. Si más adelante hay que ajustar un cupo,
 * se modifica acá (no requiere migración ni cambio de UI).
 */
export const RUTA_CAPACIDAD: Readonly<Record<TransporteRuta, number>> = {
  'R1- QUERETARO- PIE DE LA CUESTA': 21,
  'R2- SAN JOSE ITURBIDE': 21,
  'R3- SAN JOSE ITURBIDE 2': 14,
  'R4-SANTA ROSA': 21,
  'R5- QUERETARO-AV. DE LA LUZ': 21,
  'R6- AV. DE LA LUZ - PASEOS QUERETARO': 21,
};

/**
 * Devuelve la capacidad declarada para una ruta del catálogo. Para rutas
 * fuera del catálogo (datos huérfanos viejos) devuelve `null` para que el
 * dashboard pueda renderizarlas sin barra de progreso.
 */
export function getRutaCapacidad(ruta: string): number | null {
  return RUTA_CAPACIDAD[ruta as TransporteRuta] ?? null;
}

/**
 * Marcador especial para empleados que NO toman transporte (opt-out
 * explícito vs. no asignado todavía). Se almacena literal `N/A` tanto en
 * `empleados.ruta` como en `empleados.parada`. El dashboard de capacidad
 * lo excluye del conteo de cualquier ruta y lo reporta aparte en stats.
 */
export const TRANSPORTE_NA = 'N/A';

/**
 * Catálogo de paradas oficiales. Incluye `N/A` para empleados sin
 * transporte. Si el JSON trae una parada fuera del catálogo, el importer
 * la acepta (a diferencia de la ruta) pero la registra como advertencia
 * en el preview — las paradas tienden a tener variantes nuevas cuando se
 * abre una zona y no queremos bloquear cargas legítimas.
 */
export const TRANSPORTE_PARADAS = [
  'AV. DE LA LUZ',
  'AV. PEDREGAL',
  'BUENAVISTA',
  'COREA',
  'FRACC. MONTENEGRO',
  'HDA SANTA ROSA',
  'LA BARRETA',
  'LA LUZ',
  'LA MONJA',
  'MONTENEGRO',
  'OBRERA',
  'OJO DE AGUA',
  'PASEOS QUERETARO',
  'PEÑAFLOR',
  'PIE DE LA CUESTA',
  'PLAZA DEL SOL',
  'PROL. BERNARDO QUINTANA',
  'PUERTO AGUIRRE',
  'PUERTO CARROZA',
  'RINCON OJO DE AGUA',
  'SALITRE',
  'SAN ISIDRO',
  'SAN JOSE ITURBIDE',
  'SANTA CATARINA',
  'SANTA ROSA',
  'TLALOC',
  TRANSPORTE_NA,
] as const;

export type TransporteParada = (typeof TRANSPORTE_PARADAS)[number];

/**
 * Turnos canónicos: 1, 2, 3, 4. Cualquier otro valor que aparezca en datos
 * históricos (por ej. `0`, `Mixto`) se renderiza como "extra" al final del
 * breakdown del dashboard pero NO es una opción seleccionable en el alta
 * de empleados.
 */
export const TRANSPORTE_TURNOS = ['1', '2', '3', '4'] as const;

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

const PARADAS_BY_NORM = new Map(
  TRANSPORTE_PARADAS.map((p) => [normalizeRuta(p), p] as const)
);

/**
 * Detecta cualquier variante de `N/A` (`n/a`, `na`, `NA`, `n.a.`) para
 * normalizar al marcador canónico. No clasifica como N/A valores vacíos.
 */
export function isNaMarker(value: string): boolean {
  const v = value.trim().toUpperCase().replace(/\./g, '');
  return v === 'N/A' || v === 'NA';
}

/**
 * Devuelve la ruta canónica que corresponde a `value`, o `null` si no hay
 * match en el catálogo. `N/A` se acepta como ruta válida (marcador de
 * "no toma transporte"). Útil para el importer: si una fila trae
 * `"r1-queretaro-pie de la cuesta"` con minúsculas, encuentra la versión
 * oficial sin romper la asignación.
 */
export function matchRuta(value: string): TransporteRuta | typeof TRANSPORTE_NA | null {
  if (isNaMarker(value)) return TRANSPORTE_NA;
  return RUTAS_BY_NORM.get(normalizeRuta(value)) ?? null;
}

/**
 * Devuelve la parada canónica del catálogo o `null` si no encuentra match.
 * A diferencia de `matchRuta`, el importer no rechaza paradas fuera del
 * catálogo; este helper solo se usa para canonicalizar (corregir
 * capitalización / espacios) y advertir.
 */
export function matchParada(value: string): TransporteParada | null {
  if (isNaMarker(value)) return TRANSPORTE_NA;
  return PARADAS_BY_NORM.get(normalizeRuta(value)) ?? null;
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
  if (/^\d+$/.test(v)) return `T${v}`;
  return v;
}
