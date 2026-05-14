import { useCallback, useEffect, useRef, useState } from 'react';
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
 * Origen efectivo de los datos:
 *   - `remote`: vistos desde Supabase, persisten al refrescar.
 *   - `local`: solo en localStorage (Supabase no disponible o aún sin sync).
 *   - `unknown`: estado inicial / sin datos.
 */
export type DataSource = 'remote' | 'local' | 'unknown';

/**
 * Hook para cargar e importar `bajas`. Estrategia híbrida:
 *   1. Carga inmediata desde localStorage (UI no parpadea).
 *   2. Fetch a Supabase. Si trae filas → fuente de verdad (sobrescribe local).
 *   3. Si Supabase trae `[]` PERO local tiene datos → **mantiene local** y
 *      dispara un upsert de auto-sync hacia Supabase. Así no se pierden datos
 *      cuando RLS / migración faltante / proyecto recién creado dejan la
 *      tabla vacía remotamente.
 *   4. Si Supabase falla → mantiene local, expone `error` y `dataSource='local'`.
 */
export function useBajas() {
  const [bajas, setBajas] = useState<Baja[]>(() => loadLocal<Baja[]>(STORAGE_KEY, []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [dataSource, setDataSource] = useState<DataSource>('unknown');

  const isConfigured = checkSupabaseConfig();
  // Lectura sincrónica de `bajas` desde callbacks asincrónicos sin recrear el callback.
  const bajasRef = useRef<Baja[]>(bajas);
  bajasRef.current = bajas;

  function flashSaved() {
    setSaveStatus('saved');
    window.setTimeout(() => setSaveStatus('idle'), 1500);
  }

  /**
   * Empuja `rows` a Supabase. Devuelve true en éxito, false en error.
   * No toca `bajas` ni `localStorage` — solo sincroniza.
   */
  const pushToSupabase = useCallback(
    async (rows: Baja[]): Promise<{ ok: boolean; message?: string }> => {
      if (!isConfigured || rows.length === 0) return { ok: false };
      try {
        setSaveStatus('saving');
        // Strip campos generados por la DB (id, created_at) si vinieran del cache local
        // para evitar conflictos en el upsert por num_empleado.
        const sanitized = rows.map((row) => {
          const { id: _omit, ...rest } = row;
          void _omit;
          return rest;
        });
        const { error: err } = await supabase
          .from('bajas')
          .upsert(sanitized, { onConflict: 'num_empleado' });
        if (err) throw err;
        flashSaved();
        setError(null);
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase upsert bajas failed:', message);
        setSaveStatus('error');
        setError(message);
        return { ok: false, message };
      }
    },
    [isConfigured]
  );

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      setDataSource(bajasRef.current.length > 0 ? 'local' : 'unknown');
      return;
    }
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase.from('bajas').select('*');
        if (err) throw err;
        if (cancelled) return;
        const remote = (data ?? []) as Baja[];
        const local = bajasRef.current;

        if (remote.length > 0) {
          // Remote es fuente de verdad: pisa local.
          setBajas(remote);
          saveLocal(STORAGE_KEY, remote);
          setDataSource('remote');
          setError(null);
          return;
        }

        // Remote vacío. Si local tiene datos → preferir local y reintentar sync.
        if (local.length > 0) {
          setDataSource('local');
          const res = await pushToSupabase(local);
          if (!cancelled && res.ok) {
            setDataSource('remote');
          }
          return;
        }

        // Ambos vacíos: estado limpio.
        setDataSource('unknown');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Supabase fetch bajas failed, using localStorage:', msg);
        setError(msg);
        setDataSource(bajasRef.current.length > 0 ? 'local' : 'unknown');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, pushToSupabase]);

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
      const prevByNum = new Map(bajasRef.current.map((b) => [b.num_empleado, b]));
      for (const b of incoming) prevByNum.set(b.num_empleado, b);
      const merged = Array.from(prevByNum.values());

      setBajas(merged);
      saveLocal(STORAGE_KEY, merged);

      if (!isConfigured) {
        setDataSource('local');
        flashSaved();
        return { ok: true, inserted: incoming.length, skipped };
      }

      const res = await pushToSupabase(merged);
      if (res.ok) {
        setDataSource('remote');
        return { ok: true, inserted: incoming.length, skipped };
      }
      setDataSource('local');
      return {
        ok: true,
        inserted: incoming.length,
        skipped,
        message: 'Guardado local. Falta correr migración 007 en Supabase para que persista al refrescar.',
      };
    },
    [isConfigured, pushToSupabase]
  );

  /** Reintenta sincronizar `bajas` actuales contra Supabase. */
  const retrySync = useCallback(async () => {
    if (bajasRef.current.length === 0) return;
    const res = await pushToSupabase(bajasRef.current);
    if (res.ok) setDataSource('remote');
  }, [pushToSupabase]);

  return {
    bajas,
    loading,
    error,
    isConfigured,
    saveStatus,
    dataSource,
    importBajas,
    retrySync,
  };
}
