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
import { formatSupabaseError } from './errors';
import { PLANTILLA_AUTORIZADA } from './constants';
import { normalizePuesto, normalizeString } from './utils';
import type {
  AuthorizedPosition,
  CustomPosition,
  PositionSetting,
} from './types';

/**
 * Catálogo unificado de puestos: une la `PLANTILLA_AUTORIZADA` estática con
 * los puestos creados desde la UI (`custom_positions`). Esto permite que el
 * usuario pueda promover a un empleado a un puesto totalmente nuevo y que ese
 * puesto aparezca de inmediato en los selectores de Dashboard, Vacantes,
 * Pipeline, modales de candidato/empleado y requisiciones — sin tocar código.
 *
 * Encima de ese catálogo se aplican los `position_settings`: overrides de
 * backup / plantilla / urgentes / notas que un admin gestiona desde el wizard
 * de Vacantes. Esos overrides MANDAN sobre el valor estático.
 */

const STORAGE_KEY = 'reclutamiento_custom_positions';
const STORAGE_KEY_SETTINGS = 'reclutamiento_position_settings';

/** Clave normalizada de tripleta (área, sección, puesto) — match tolerante. */
function tripletKey(p: { area: string; seccion: string; puesto: string }): string {
  return `${normalizeString(p.area)}::${normalizeString(p.seccion)}::${normalizePuesto(p.puesto)}`;
}

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

function loadLocalSettings(): PositionSetting[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return stored ? (JSON.parse(stored) as PositionSetting[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSettings(data: PositionSetting[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage settings save failed:', err);
  }
}

/**
 * Aplica los overrides de `position_settings` sobre el catálogo base. Cada
 * setting manda sobre el valor estático del puesto que coincide por tripleta
 * normalizada. `plantilla_autorizada` solo se sobreescribe si el override trae
 * un número (no `null`).
 */
function applySettings(
  base: AuthorizedPosition[],
  settings: PositionSetting[]
): AuthorizedPosition[] {
  if (settings.length === 0) return base;
  const byKey = new Map(settings.map((s) => [tripletKey(s), s]));
  return base.map((p) => {
    const ov = byKey.get(tripletKey(p));
    if (!ov) return p;
    return {
      ...p,
      plantilla_autorizada:
        ov.plantilla_autorizada != null
          ? ov.plantilla_autorizada
          : p.plantilla_autorizada,
      backup: ov.backup ?? p.backup,
      urgentes: ov.urgentes ?? p.urgentes,
      notas: ov.notas ?? p.notas,
    };
  });
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

export interface UpsertPositionSettingInput {
  area: string;
  seccion: string;
  puesto: string;
  plantilla_autorizada: number | null;
  backup: number;
  urgentes: number;
  notas?: string | null;
  updated_by?: string | null;
}

interface PositionsContextValue {
  /** Lista unificada (estática + custom + overrides) lista para selectores. */
  positions: AuthorizedPosition[];
  /** Solo los puestos custom (los creados desde UI). */
  customPositions: CustomPosition[];
  /** Overrides admin por puesto (backup / plantilla / urgentes / notas). */
  positionSettings: PositionSetting[];
  loading: boolean;
  /**
   * Crea (o reutiliza) un puesto custom. Devuelve `isNew=true` cuando se
   * insertó un puesto nuevo, o `isNew=false` cuando ya existía en la lista
   * estática o custom (en cuyo caso no duplica).
   */
  createPosition: (input: CreatePositionInput) => Promise<CreatePositionResult>;
  /** Elimina un puesto custom (BD + caché local). No afecta la plantilla estática. */
  deletePosition: (
    target: { area: string; seccion: string; puesto: string }
  ) => Promise<{ ok: boolean; message?: string }>;
  /** Inserta/actualiza el override (backup/plantilla/urgentes/notas) de un puesto. */
  upsertPositionSetting: (
    input: UpsertPositionSettingInput
  ) => Promise<{ ok: boolean; message?: string }>;
}

const PositionsContext = createContext<PositionsContextValue | null>(null);

export function PositionsProvider({ children }: { children: ReactNode }) {
  const configured = isConfigured();
  const [customPositions, setCustomPositions] = useState<CustomPosition[]>(() =>
    loadLocal()
  );
  const [positionSettings, setPositionSettings] = useState<PositionSetting[]>(
    () => loadLocalSettings()
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
        const [customRes, settingsRes] = await Promise.all([
          supabase
            .from('custom_positions')
            .select('*')
            .order('created_at', { ascending: true }),
          supabase.from('position_settings').select('*'),
        ]);
        if (cancelled) return;
        if (customRes.error) throw customRes.error;
        const rows = (customRes.data ?? []) as CustomPosition[];
        setCustomPositions(rows);
        saveLocal(rows);
        // `position_settings` puede no existir aún (migración pendiente): no
        // es fatal, solo se conservan los valores estáticos / localStorage.
        if (!settingsRes.error) {
          const settings = (settingsRes.data ?? []) as PositionSetting[];
          setPositionSettings(settings);
          saveLocalSettings(settings);
        } else {
          console.warn(
            'position_settings fetch failed (¿migración pendiente?):',
            formatSupabaseError(settingsRes.error)
          );
        }
      } catch (err) {
        const msg = formatSupabaseError(err);
        console.warn('positions fetch failed, using localStorage:', msg, err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const positions = useMemo(
    () => applySettings(mergePositions(PLANTILLA_AUTORIZADA, customPositions), positionSettings),
    [customPositions, positionSettings]
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
        const message = formatSupabaseError(err);
        console.warn('custom_positions insert failed, kept locally:', message, err);
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

  const deletePosition = useCallback(
    async (target: { area: string; seccion: string; puesto: string }) => {
      const key = tripletKey(target);
      const next = customPositions.filter((p) => tripletKey(p) !== key);
      setCustomPositions(next);
      saveLocal(next);

      if (!configured) return { ok: true };

      try {
        const { error } = await supabase
          .from('custom_positions')
          .delete()
          .eq('area', target.area)
          .eq('seccion', target.seccion)
          .eq('puesto', target.puesto);
        if (error) throw error;
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('custom_positions delete failed (kept removed locally):', message, err);
        return { ok: true, message: 'Eliminado local. Sincronización pendiente.' };
      }
    },
    [customPositions, configured]
  );

  const upsertPositionSetting = useCallback(
    async (input: UpsertPositionSettingInput) => {
      const area = input.area.trim();
      const seccion = input.seccion.trim();
      const puesto = input.puesto.trim();
      if (!area || !seccion || !puesto) {
        return { ok: false, message: 'Área, sección y puesto son requeridos.' };
      }

      const row: PositionSetting = {
        area,
        seccion,
        puesto,
        plantilla_autorizada:
          input.plantilla_autorizada != null
            ? Math.max(0, input.plantilla_autorizada)
            : null,
        backup: Math.max(0, input.backup ?? 0),
        urgentes: Math.max(0, input.urgentes ?? 0),
        notas: input.notas?.trim() ? input.notas.trim() : null,
        updated_by: input.updated_by ?? null,
        updated_at: new Date().toISOString(),
      };

      // Optimista: reemplaza por tripleta normalizada (case/acento-insensible).
      const key = tripletKey(row);
      const optimistic = [
        ...positionSettings.filter((s) => tripletKey(s) !== key),
        row,
      ];
      setPositionSettings(optimistic);
      saveLocalSettings(optimistic);

      if (!configured) return { ok: true };

      try {
        const { data, error } = await supabase
          .from('position_settings')
          .upsert(
            {
              area: row.area,
              seccion: row.seccion,
              puesto: row.puesto,
              plantilla_autorizada: row.plantilla_autorizada,
              backup: row.backup,
              urgentes: row.urgentes,
              notas: row.notas,
              updated_by: row.updated_by,
              updated_at: row.updated_at,
            },
            { onConflict: 'area,seccion,puesto' }
          )
          .select('*')
          .single();
        if (error) throw error;
        const saved = data as PositionSetting;
        const replaced = [
          ...positionSettings.filter((s) => tripletKey(s) !== key),
          saved,
        ];
        setPositionSettings(replaced);
        saveLocalSettings(replaced);
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('position_settings upsert failed, kept locally:', message, err);
        return { ok: true, message: 'Guardado local. Sincronización pendiente.' };
      }
    },
    [positionSettings, configured]
  );

  const value = useMemo<PositionsContextValue>(
    () => ({
      positions,
      customPositions,
      positionSettings,
      loading,
      createPosition,
      deletePosition,
      upsertPositionSetting,
    }),
    [
      positions,
      customPositions,
      positionSettings,
      loading,
      createPosition,
      deletePosition,
      upsertPositionSetting,
    ]
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
