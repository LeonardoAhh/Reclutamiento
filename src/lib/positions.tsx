import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { PLANTILLA_AUTORIZADA } from './constants';
import { normalizePuesto, normalizeString } from './utils';
import type { AuthorizedPosition, CustomPosition } from './types';

/**
 * Catálogo unificado de puestos: une la `PLANTILLA_AUTORIZADA` estática con
 * los puestos creados desde la UI (`custom_positions`). Esto permite que el
 * usuario pueda promover a un empleado a un puesto totalmente nuevo y que ese
 * puesto aparezca de inmediato en los selectores de Dashboard, Vacantes,
 * Pipeline, modales de candidato/empleado y requisiciones — sin tocar código.
 */

const STORAGE_KEY = 'reclutamiento_custom_positions';

function loadLocal(): CustomPosition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CustomPosition[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(data: CustomPosition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }
}

function isConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20
  );
}

function localId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Convierte un `CustomPosition` en el shape `AuthorizedPosition` para unirlos. */
function toAuthorized(custom: CustomPosition): AuthorizedPosition {
  return {
    area: custom.area,
    seccion: custom.seccion,
    puesto: custom.puesto,
    plantilla_autorizada: custom.plantilla_autorizada,
  };
}

/**
 * Dedupe por tripleta normalizada (área, sección, puesto). Si la tripleta ya
 * existe en `PLANTILLA_AUTORIZADA`, el puesto custom se descarta para evitar
 * doble conteo en la cobertura.
 */
function mergePositions(
  base: AuthorizedPosition[],
  custom: CustomPosition[]
): AuthorizedPosition[] {
  const key = (p: { area: string; seccion: string; puesto: string }) =>
    `${normalizeString(p.area)}::${normalizeString(p.seccion)}::${normalizePuesto(p.puesto)}`;
  const seen = new Set(base.map(key));
  const extras: AuthorizedPosition[] = [];
  for (const c of custom) {
    const k = key(c);
    if (seen.has(k)) continue;
    seen.add(k);
    extras.push(toAuthorized(c));
  }
  return [...base, ...extras];
}

export interface CreatePositionInput {
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada?: number;
  notas?: string | null;
  created_by?: string | null;
}

export interface CreatePositionResult {
  ok: boolean;
  message?: string;
  position?: AuthorizedPosition;
  isNew?: boolean;
}

interface PositionsContextValue {
  /** Lista unificada (estática + custom) lista para alimentar selectores. */
  positions: AuthorizedPosition[];
  /** Solo los puestos custom (los creados desde UI). */
  customPositions: CustomPosition[];
  loading: boolean;
  /**
   * Crea (o reutiliza) un puesto custom. Devuelve `isNew=true` cuando se
   * insertó un puesto nuevo, o `isNew=false` cuando ya existía en la lista
   * estática o custom (en cuyo caso no duplica).
   */
  createPosition: (input: CreatePositionInput) => Promise<CreatePositionResult>;
}

const PositionsContext = createContext<PositionsContextValue | null>(null);

export function PositionsProvider({ children }: { children: ReactNode }) {
  const configured = isConfigured();
  const [customPositions, setCustomPositions] = useState<CustomPosition[]>(() =>
    loadLocal()
  );
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('custom_positions')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const rows = (data ?? []) as CustomPosition[];
        setCustomPositions(rows);
        saveLocal(rows);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('custom_positions fetch failed, using localStorage:', msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const positions = useMemo(
    () => mergePositions(PLANTILLA_AUTORIZADA, customPositions),
    [customPositions]
  );

  const createPosition = useCallback(
    async (input: CreatePositionInput): Promise<CreatePositionResult> => {
      const area = input.area.trim();
      const seccion = input.seccion.trim();
      const puesto = input.puesto.trim();
      if (!area || !seccion || !puesto) {
        return { ok: false, message: 'Área, sección y puesto son requeridos.' };
      }

      const targetKey = `${normalizeString(area)}::${normalizeString(seccion)}::${normalizePuesto(puesto)}`;
      const matchByKey = (p: { area: string; seccion: string; puesto: string }) =>
        `${normalizeString(p.area)}::${normalizeString(p.seccion)}::${normalizePuesto(p.puesto)}` ===
        targetKey;

      const existingStatic = PLANTILLA_AUTORIZADA.find(matchByKey);
      if (existingStatic) {
        return { ok: true, isNew: false, position: existingStatic };
      }
      const existingCustom = customPositions.find(matchByKey);
      if (existingCustom) {
        return { ok: true, isNew: false, position: toAuthorized(existingCustom) };
      }

      const draft: CustomPosition = {
        id: localId(),
        area,
        seccion,
        puesto,
        plantilla_autorizada: Math.max(0, input.plantilla_autorizada ?? 1),
        notas: input.notas ?? null,
        created_by: input.created_by ?? null,
        created_at: new Date().toISOString(),
      };

      const optimistic = [...customPositions, draft];
      setCustomPositions(optimistic);
      saveLocal(optimistic);

      if (!configured) {
        return { ok: true, isNew: true, position: toAuthorized(draft) };
      }

      try {
        const { data, error } = await supabase
          .from('custom_positions')
          .insert({
            area: draft.area,
            seccion: draft.seccion,
            puesto: draft.puesto,
            plantilla_autorizada: draft.plantilla_autorizada,
            notas: draft.notas,
            created_by: draft.created_by,
          })
          .select('*')
          .single();
        if (error) throw error;
        const saved = data as CustomPosition;
        const replaced = optimistic.map((p) => (p.id === draft.id ? saved : p));
        setCustomPositions(replaced);
        saveLocal(replaced);
        return { ok: true, isNew: true, position: toAuthorized(saved) };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('custom_positions insert failed, kept locally:', message);
        return {
          ok: true,
          isNew: true,
          position: toAuthorized(draft),
          message: 'Guardado local. Sincronización pendiente.',
        };
      }
    },
    [customPositions, configured]
  );

  const value = useMemo<PositionsContextValue>(
    () => ({ positions, customPositions, loading, createPosition }),
    [positions, customPositions, loading, createPosition]
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}

export function usePositions(): PositionsContextValue {
  const ctx = useContext(PositionsContext);
  if (!ctx) {
    throw new Error('usePositions must be used within a PositionsProvider');
  }
  return ctx;
}
