import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { VacancyRequest, VacancyStatus, VacancyStatusHistoryEntry } from '@/lib/types';
import type { SaveStatus } from './useSupabaseData';

const STORAGE_KEYS = {
  vacancies: 'reclutamiento_vacancy_requests',
  history: 'reclutamiento_vacancy_status_history',
};

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
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function localId(): string {
  return `local-${nowIso()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook for fetching and mutating vacancy_requests + audit history.
 */
export function useVacancyRequests() {
  const [vacancies, setVacancies] = useState<VacancyRequest[]>(() =>
    loadLocal(STORAGE_KEYS.vacancies, [])
  );
  const [history, setHistory] = useState<VacancyStatusHistoryEntry[]>(() =>
    loadLocal(STORAGE_KEYS.history, [])
  );
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
        const [vacResult, histResult] = await Promise.all([
          supabase
            .from('vacancy_requests')
            .select('*')
            .order('fecha_apertura', { ascending: false }),
          supabase
            .from('vacancy_status_history')
            .select('*')
            .order('changed_at', { ascending: false }),
        ]);

        if (vacResult.error) throw vacResult.error;
        if (histResult.error) throw histResult.error;

        const vacData = (vacResult.data ?? []) as VacancyRequest[];
        const histData = (histResult.data ?? []) as VacancyStatusHistoryEntry[];

        setVacancies(vacData);
        setHistory(histData);
        saveLocal(STORAGE_KEYS.vacancies, vacData);
        saveLocal(STORAGE_KEYS.history, histData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Supabase vacancy_requests fetch failed, using localStorage:', msg);
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

  const addVacancy = useCallback(
    async (input: Omit<VacancyRequest, 'id' | 'created_at' | 'updated_at'>): Promise<{ ok: boolean; vacancy?: VacancyRequest; message?: string }> => {
      const draft: VacancyRequest = {
        ...input,
        id: localId(),
        fecha_apertura: input.fecha_apertura ?? nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const updated = [draft, ...vacancies];
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true, vacancy: draft };
      }

      try {
        setSaveStatus('saving');
        const { data, error: err } = await supabase
          .from('vacancy_requests')
          .insert({ ...input, fecha_apertura: draft.fecha_apertura })
          .select('*')
          .single();
        if (err) throw err;

        const saved = data as VacancyRequest;
        const replaced = updated.map((v) => (v.id === draft.id ? saved : v));
        setVacancies(replaced);
        saveLocal(STORAGE_KEYS.vacancies, replaced);
        flashSaved();
        return { ok: true, vacancy: saved };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase insert vacancy failed, saved locally:', message);
        setSaveStatus('error');
        return { ok: true, vacancy: draft, message: 'Guardado local. Sincronización pendiente.' };
      }
    },
    [vacancies, isConfigured]
  );

  const updateVacancy = useCallback(
    async (id: string, patch: Partial<VacancyRequest>): Promise<{ ok: boolean; message?: string }> => {
      const target = vacancies.find((v) => v.id === id);
      if (!target) return { ok: false, message: 'Vacante no encontrada.' };

      const merged: VacancyRequest = { ...target, ...patch, updated_at: nowIso() };
      const updated = vacancies.map((v) => (v.id === id ? merged : v));
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { id: _id, created_at: _ca, updated_at: _ua, ...payload } = patch as VacancyRequest;
        void _id;
        void _ca;
        void _ua;
        const { error: err } = await supabase
          .from('vacancy_requests')
          .update(payload)
          .eq('id', id);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase update vacancy failed, saved locally:', message);
        setSaveStatus('error');
        return { ok: true, message: 'Actualizado local. Sincronización pendiente.' };
      }
    },
    [vacancies, isConfigured]
  );

  const setVacancyStatus = useCallback(
    (id: string, status: VacancyStatus) => updateVacancy(id, { status }),
    [updateVacancy]
  );

  const deleteVacancy = useCallback(
    async (id: string): Promise<{ ok: boolean; message?: string }> => {
      const updated = vacancies.filter((v) => v.id !== id);
      if (updated.length === vacancies.length) {
        return { ok: false, message: 'Vacante no encontrada.' };
      }
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      const remainingHistory = history.filter((h) => h.vacancy_id !== id);
      setHistory(remainingHistory);
      saveLocal(STORAGE_KEYS.history, remainingHistory);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { error: err } = await supabase
          .from('vacancy_requests')
          .delete()
          .eq('id', id);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase delete vacancy failed, removed locally:', message);
        setSaveStatus('error');
        return { ok: true, message: 'Eliminado local. Sincronización pendiente.' };
      }
    },
    [vacancies, history, isConfigured]
  );

  return {
    vacancies,
    history,
    loading,
    error,
    isConfigured,
    saveStatus,
    addVacancy,
    updateVacancy,
    setVacancyStatus,
    deleteVacancy,
  };
}
