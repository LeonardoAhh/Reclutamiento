import type { Baja } from '@/lib/types';
import { scheduleIdle } from '@/lib/dataCache';

/** Mismo key histórico que usan `useBajas` y `useSupabaseData`. */
export const BAJAS_STORAGE_KEY = 'reclutamiento_bajas';

export type BajasDataSource = 'remote' | 'local' | 'unknown';

/**
 * Caché de sesión única para bajas. `useBajas` se monta por componente y
 * `useSupabaseData` también escribe bajas al dar de baja o cubrir vacantes;
 * ambos leen y escriben aquí para que memoria y localStorage no diverjan.
 */
let cachedRows: Baja[] | null = null;
let fetchedAt: number | undefined;
let lastDataSource: BajasDataSource = 'unknown';
let inflight: Promise<Baja[]> | null = null;

function loadStoredBajas(): Baja[] {
  try {
    const stored = localStorage.getItem(BAJAS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Baja[]) : [];
  } catch {
    return [];
  }
}

function persistBajas(rows: Baja[]): void {
  try {
    localStorage.setItem(BAJAS_STORAGE_KEY, JSON.stringify(rows));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }
}

export function readBajasCache(): Baja[] {
  if (cachedRows === null) cachedRows = loadStoredBajas();
  return cachedRows;
}

/**
 * Actualiza la caché. `persist: 'now'` conserva la escritura síncrona de las
 * mutaciones; `'idle'` difiere la serialización de descargas completas.
 */
export function writeBajasCache(rows: Baja[], persist: 'now' | 'idle' | 'none' = 'now'): void {
  cachedRows = rows;
  if (persist === 'now') persistBajas(rows);
  else if (persist === 'idle') scheduleIdle(() => persistBajas(rows));
}

export function getBajasFetchedAt(): number | undefined {
  return fetchedAt;
}

export function getBajasDataSource(): BajasDataSource {
  return lastDataSource;
}

export function setBajasDataSource(source: BajasDataSource): void {
  lastDataSource = source;
}

/** Una sola descarga en vuelo, compartida por todos los montajes de `useBajas`. */
export function fetchRemoteBajas(load: () => Promise<Baja[]>): Promise<Baja[]> {
  if (inflight) return inflight;
  inflight = load()
    .then((rows) => {
      fetchedAt = Date.now();
      return rows;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
