import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';

export interface ToulouseSheetRecord {
  id?: string;
  folio: string | null;
  candidato_nombre: string;
  puesto_solicitado: string | null;
  edad: number | null;
  fecha: string;
  evaluador: string | null;
  tiempo_limite_seg: number | null;
  seed: number;
  filas: number;
  columnas: number;
  modelos: number[];
  total_objetivos: number | null;
  created_by?: string | null;
  created_at?: string;
}

const STORAGE_KEY = 'reclutamiento_toulouse_sheets';

function isConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20;
}

function loadLocal(): ToulouseSheetRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ToulouseSheetRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(rows: ToulouseSheetRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (err) {
    console.warn('toulouse localStorage save failed:', err);
  }
}

function localId(): string {
  return `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Hoja Toulouse-Piéron: persistencia en Supabase con respaldo en localStorage.
 * Si la tabla aún no existe (migración pendiente) cae a almacenamiento local
 * sin romper la UI.
 */
export function useToulouseSheets() {
  const configured = isConfigured();
  const [sheets, setSheets] = useState<ToulouseSheetRecord[]>(() => loadLocal());
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
          .from('toulouse_sheets')
          .select('*')
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        const rows = (data ?? []) as ToulouseSheetRecord[];
        setSheets(rows);
        saveLocal(rows);
      } catch (err) {
        console.warn('toulouse_sheets fetch failed, using localStorage:', formatSupabaseError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const save = useCallback(
    async (record: ToulouseSheetRecord): Promise<{ ok: boolean; message?: string }> => {
      const optimistic: ToulouseSheetRecord = { ...record, id: record.id ?? localId() };
      setSheets((prev) => {
        const next = [optimistic, ...prev.filter((s) => s.id !== optimistic.id)];
        saveLocal(next);
        return next;
      });

      if (!configured) return { ok: true };

      try {
        const { id: _omit, created_at: _omit2, ...payload } = record;
        const { data, error } = await supabase
          .from('toulouse_sheets')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        const saved = data as ToulouseSheetRecord;
        setSheets((prev) => {
          const next = [saved, ...prev.filter((s) => s.id !== optimistic.id)];
          saveLocal(next);
          return next;
        });
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('toulouse_sheets insert failed, kept locally:', message);
        return { ok: true, message: 'Guardado local. Sincronización pendiente.' };
      }
    },
    [configured]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setSheets((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveLocal(next);
        return next;
      });
      if (!configured || id.startsWith('local-')) return;
      try {
        const { error } = await supabase.from('toulouse_sheets').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('toulouse_sheets delete failed:', formatSupabaseError(err));
      }
    },
    [configured]
  );

  return { sheets, loading, save, remove };
}
