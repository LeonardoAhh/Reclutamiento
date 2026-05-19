import { useCallback, useEffect, useState } from 'react';

/**
 * Mapa de cupos: `{ [ruta]: { [turno]: cupoMaximo } }`. `null` significa que
 * el cupo no está definido (se trata como abierto en el dashboard).
 */
export type CapacidadesMap = Record<string, Record<string, number | null>>;

const STORAGE_KEY = 'reclutamiento_transporte_cupos_v1';

function load(): CapacidadesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as CapacidadesMap;
  } catch {
    return {};
  }
}

function save(map: CapacidadesMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('localStorage save failed (transporte cupos):', err);
  }
}

/**
 * Hook para leer y mutar los cupos máximos por ruta+turno. Los cupos viven
 * en `localStorage` para no requerir cambios de schema en esta iteración.
 * Si más adelante necesitamos sincronización entre usuarios, se mueve a una
 * tabla `transporte_cupos` (ruta, turno, cupo) y se mantiene la misma API.
 */
export function useTransporteCapacidades() {
  const [capacidades, setCapacidades] = useState<CapacidadesMap>(() => load());

  // Sincroniza entre pestañas: si el usuario edita el cupo en otra ventana,
  // refresca aquí también. Es barato y evita confusión al manipular la
  // misma plantilla desde más de un tab.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setCapacidades(load());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setCupo = useCallback(
    (ruta: string, turno: string, value: number | null) => {
      setCapacidades((prev) => {
        const next: CapacidadesMap = { ...prev };
        const byTurno = { ...(next[ruta] ?? {}) };
        if (value == null) {
          delete byTurno[turno];
        } else {
          byTurno[turno] = value;
        }
        if (Object.keys(byTurno).length === 0) {
          delete next[ruta];
        } else {
          next[ruta] = byTurno;
        }
        save(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setCapacidades({});
    save({});
  }, []);

  return { capacidades, setCupo, reset };
}
