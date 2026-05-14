import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Baja, BajaRaw } from '@/lib/types';
import { transformBajaData } from '@/lib/bajas';

const STORAGE_KEY = 'reclutamiento_bajas';

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }
}

function checkSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook para cargar e importar `bajas`. Sigue el mismo patrón que
 * `useSupabaseData`: Supabase primero, fallback a `localStorage`.
 */
export function useBajas() {
  const [bajas, setBajas] = useState<Baja[]>(() => loadLocal<Baja[]>(STORAGE_KEY, []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const isConfigured = checkSupabaseConfig();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase.from('bajas').select('*');
        if (err) throw err;
        const list = (data ?? []) as Baja[];
        setBajas(list);
        saveLocal(STORAGE_KEY, list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Supabase fetch bajas failed, using localStorage:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isConfigured]);

  function flashSaved() {
    setSaveStatus('saved');
    window.setTimeout(() => setSaveStatus('idle'), 1500);
  }

  /**
   * Importa un JSON de bajas: dedupe por `num_empleado` (la última gana) y
   * upsert contra Supabase.
   */
  const importBajas = useCallback(
    async (raw: BajaRaw[]): Promise<{ ok: boolean; inserted: number; skipped: number; message?: string }> => {
      const transformed = raw
        .map(transformBajaData)
        .filter((b) => b.num_empleado && b.fecha_baja);
      const skipped = raw.length - transformed.length;

      // Dedupe por num_empleado dentro del archivo mismo.
      const byNum = new Map<string, Baja>();
      for (const b of transformed) byNum.set(b.num_empleado, b);
      const incoming = Array.from(byNum.values());

      // Merge con lo existente: incoming pisa al previo.
      const prevByNum = new Map(bajas.map((b) => [b.num_empleado, b]));
      for (const b of incoming) prevByNum.set(b.num_empleado, b);
      const merged = Array.from(prevByNum.values());

      setBajas(merged);
      saveLocal(STORAGE_KEY, merged);

      if (!isConfigured) {
        flashSaved();
        return { ok: true, inserted: incoming.length, skipped };
      }

      try {
        setSaveStatus('saving');
        const { error: err } = await supabase
          .from('bajas')
          .upsert(incoming, { onConflict: 'num_empleado' });
        if (err) throw err;
        flashSaved();
        return { ok: true, inserted: incoming.length, skipped };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase upsert bajas failed, saved locally:', message);
        setSaveStatus('error');
        return {
          ok: true,
          inserted: incoming.length,
          skipped,
          message: 'Guardado local. Sincronización pendiente.',
        };
      }
    },
    [isConfigured, bajas]
  );

  return {
    bajas,
    loading,
    error,
    isConfigured,
    saveStatus,
    importBajas,
  };
}
