/**
 * Toulouse-Piéron — generación determinista de la rejilla de símbolos.
 *
 * Cada símbolo es un cuadro con un guion (cola) en una de 8 orientaciones:
 *   0=N  1=NE  2=E  3=SE  4=S  5=SW  6=W  7=NW
 * El candidato debe tachar los que coincidan con los modelos.
 *
 * La rejilla se reconstruye 100% desde la SEMILLA (mulberry32), así que
 * guardando solo seed + config se puede regenerar idéntica para reimprimir o
 * para la plantilla de corrección.
 */

export const ORIENTATIONS = 8;

export interface ToulouseConfig {
  /** Filas de la rejilla. */
  rows: number;
  /** Columnas de la rejilla. */
  cols: number;
  /** Orientaciones objetivo (a tachar). */
  models: number[];
  /** Proporción aproximada de símbolos objetivo (0..1). */
  targetRatio: number;
}

/** Configuración estándar fija de la prueba. */
export const DEFAULT_TOULOUSE_CONFIG: ToulouseConfig = {
  rows: 30,
  cols: 40,
  models: [1, 4], // NE y S (modelos clásicos)
  targetRatio: 0.25,
};

/** PRNG determinista: misma semilla → misma secuencia. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla nueva (32 bits) para una hoja distinta cada vez. */
export function newSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

export interface GeneratedGrid {
  /** cells[fila][columna] = orientación 0..7. */
  cells: number[][];
  /** Total de símbolos objetivo en toda la rejilla. */
  targets: number;
  /** Objetivos por fila (para la plantilla de corrección). */
  rowTargets: number[];
}

export function isModel(orientation: number, models: number[]): boolean {
  return models.includes(orientation);
}

/** Genera la rejilla determinista a partir de la semilla y la configuración. */
export function generateGrid(seed: number, config: ToulouseConfig): GeneratedGrid {
  const rng = mulberry32(seed);
  const nonModels: number[] = [];
  for (let o = 0; o < ORIENTATIONS; o++) {
    if (!config.models.includes(o)) nonModels.push(o);
  }

  const cells: number[][] = [];
  const rowTargets: number[] = [];
  let targets = 0;

  for (let r = 0; r < config.rows; r++) {
    const row: number[] = [];
    let rowCount = 0;
    for (let c = 0; c < config.cols; c++) {
      let orientation: number;
      if (rng() < config.targetRatio && config.models.length > 0) {
        orientation = config.models[Math.floor(rng() * config.models.length)];
        rowCount++;
        targets++;
      } else {
        orientation = nonModels[Math.floor(rng() * nonModels.length)];
      }
      row.push(orientation);
    }
    cells.push(row);
    rowTargets.push(rowCount);
  }

  return { cells, targets, rowTargets };
}

/** Folio automático cuando el usuario no captura uno. */
export function buildFolio(date: string): string {
  const ymd = date.split('-').join('');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TP-${ymd}-${rand}`;
}

/* ----------------------------------------------------------------------------
 * Instrucciones basadas en el manual del test Toulouse-Piéron (atención /
 * resistencia a la fatiga). Fuentes: manual TEA/Hogrefe TP-R y guías de
 * aplicación. Consigna textual y protocolo de 10 min con señales por minuto;
 * corrección PD = A − (E + O).
 * ------------------------------------------------------------------------- */

/** Consigna textual que el evaluador lee al candidato. */
export const TOULOUSE_CONSIGNA =
  'Fíjese en los modelos de arriba, observe los signos de la hoja y tache los que sean exactamente iguales; empiece por arriba, de izquierda a derecha, y hágalo lo más rápido posible, sin saltar ninguno.';

/** Instrucciones para el evaluador (reclutador que aplica la prueba). */
export const TOULOUSE_EVALUATOR_STEPS: string[] = [
  'Aplicación individual o colectiva. Material: la hoja del test, un lápiz y un cronómetro.',
  'Antes de iniciar, muestre los modelos a tachar y lea la consigna; verifique con los primeros signos que el candidato comprendió.',
  'A su señal, inicie el cronómetro: la ejecución dura 10 minutos.',
  'Cada minuto dé una señal y pida al candidato trazar una raya vertical en el signo donde va, sin detenerse (permite medir el ritmo por minuto).',
  'Al cumplir los 10 minutos indique “alto, lápiz arriba”, recoja la hoja y marque la última fila respondida.',
  'Corrija superponiendo la plantilla: cuente Aciertos (A), Errores (E = signos marcados que no son modelo) y Omisiones (O = modelos no marcados).',
  'Puntuación directa: PD = A − (E + O).',
];

/** Instrucciones para el candidato (quien contesta la prueba). */
export const TOULOUSE_CANDIDATE_STEPS: string[] = [
  'Observe con atención los dos modelos de la parte superior de la hoja.',
  'Revise los signos renglón por renglón, de izquierda a derecha y de arriba hacia abajo.',
  'Tache (marque con una línea) únicamente los signos exactamente iguales a los modelos.',
  'Trabaje lo más rápido posible, sin saltarse ninguno y sin regresar a renglones anteriores.',
  'Cuando el evaluador dé la señal de cada minuto, trace una raya vertical donde va y continúe sin detenerse.',
  'Dispone de 10 minutos para realizar la prueba.',
];
