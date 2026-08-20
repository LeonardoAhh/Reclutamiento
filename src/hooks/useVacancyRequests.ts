import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import type {
  Employee,
  VacancyRequest,
  VacancyStatus,
  VacancyStatusHistoryEntry,
} from '@/lib/types';
import type { SaveStatus } from './useSupabaseData';

/** Contexto opcional para anotar un cambio de status. */
export interface StatusChangeMeta {
  changedBy?: string | null;
  reason?: string | null;
}

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
        const msg = formatSupabaseError(err);
        console.warn('Supabase vacancy_requests fetch failed, using localStorage:', msg, err);
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

      // Mirror local del log de creación. En modo online, la DB también
      // inserta una fila vía el trigger `on insert` — la próxima recarga la
      // sobrescribe. En modo offline, esta es la única evidencia.
      const initialHistory: VacancyStatusHistoryEntry = {
        id: localId(),
        vacancy_id: draft.id!,
        from_status: null,
        to_status: draft.status,
        changed_by: null,
        reason: 'Vacante creada',
        changed_at: nowIso(),
      };
      setHistory((prev) => {
        const next = [initialHistory, ...prev];
        saveLocal(STORAGE_KEYS.history, next);
        return next;
      });

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
        // Re-apuntar la entrada del log al id real de la DB.
        if (saved.id) {
          setHistory((prev) => {
            const next = prev.map((h) =>
              h.vacancy_id === draft.id ? { ...h, vacancy_id: saved.id! } : h
            );
            saveLocal(STORAGE_KEYS.history, next);
            return next;
          });
        }
        flashSaved();
        return { ok: true, vacancy: saved };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase insert vacancy failed, saved locally:', message, err);
        setSaveStatus('error');
        return { ok: true, vacancy: draft, message: `Guardado local. Sincronización pendiente: ${message}` };
      }
    },
    [vacancies, isConfigured]
  );

  /**
   * Inserta una fila en `vacancy_status_history`. Mantiene el mirror local
   * actualizado para que el modal pueda renderizar el timeline aunque la app
   * esté offline (modo localStorage).
   */
  const appendStatusHistory = useCallback(
    async (
      vacancyId: string,
      fromStatus: VacancyStatus | null,
      toStatus: VacancyStatus,
      meta?: StatusChangeMeta
    ): Promise<void> => {
      const entry: VacancyStatusHistoryEntry = {
        id: localId(),
        vacancy_id: vacancyId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: meta?.changedBy ?? null,
        reason: meta?.reason ?? null,
        changed_at: nowIso(),
      };
      setHistory((prev) => {
        const updated = [entry, ...prev];
        saveLocal(STORAGE_KEYS.history, updated);
        return updated;
      });

      if (!isConfigured) return;

      try {
        const { error: err } = await supabase
          .from('vacancy_status_history')
          .insert({
            vacancy_id: vacancyId,
            from_status: fromStatus,
            to_status: toStatus,
            changed_by: meta?.changedBy ?? null,
            reason: meta?.reason ?? null,
          });
        if (err) throw err;
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase insert status history failed:', message, err);
      }
    },
    [isConfigured]
  );

  const updateVacancy = useCallback(
    async (
      id: string,
      patch: Partial<VacancyRequest>,
      meta?: StatusChangeMeta
    ): Promise<{ ok: boolean; message?: string }> => {
      const target = vacancies.find((v) => v.id === id);
      if (!target) return { ok: false, message: 'Vacante no encontrada.' };

      const merged: VacancyRequest = { ...target, ...patch, updated_at: nowIso() };
      const statusChanged =
        patch.status !== undefined && patch.status !== target.status;
      // Si el status pasa a 'cubierta' sin fecha, fijar fecha local (la DB tiene
      // un trigger equivalente, pero replicamos para mantener el mirror local).
      if (statusChanged && merged.status === 'cubierta' && !merged.fecha_cubierta) {
        merged.fecha_cubierta = nowIso();
      }
      const updated = vacancies.map((v) => (v.id === id ? merged : v));
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      const persistHistory = async () => {
        if (!statusChanged || !patch.status) return;
        await appendStatusHistory(id, target.status, patch.status, meta);
      };

      if (!isConfigured) {
        await persistHistory();
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { id: _id, created_at: _ca, updated_at: _ua, ...payload } = patch as VacancyRequest;
        void _id;
        void _ca;
        void _ua;
        const dbPayload: Partial<VacancyRequest> = { ...payload };
        if (
          statusChanged &&
          patch.status === 'cubierta' &&
          !dbPayload.fecha_cubierta
        ) {
          dbPayload.fecha_cubierta = merged.fecha_cubierta;
        }
        const { error: err } = await supabase
          .from('vacancy_requests')
          .update(dbPayload)
          .eq('id', id);
        if (err) throw err;
        await persistHistory();
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase update vacancy failed, saved locally:', message, err);
        await persistHistory();
        setSaveStatus('error');
        return { ok: true, message: 'Actualizado local. Sincronización pendiente.' };
      }
    },
    [vacancies, isConfigured, appendStatusHistory]
  );

  const setVacancyStatus = useCallback(
    (id: string, status: VacancyStatus, meta?: StatusChangeMeta) =>
      updateVacancy(id, { status }, meta),
    [updateVacancy]
  );

  /**
   * Si existe una vacante abierta (`abierta` / `en_proceso` / `pausa`) que
   * coincide con el `area`+`seccion`+`puesto` del empleado recién creado,
   * la cierra automáticamente (status → `cubierta`) y deja constancia en el
   * audit log. Si hay varias coincidencias, prioriza la más antigua para
   * mantener FIFO.
   *
   * Retorna el id de la vacante cerrada, o `null` si no hubo coincidencia.
   */
  const coverVacancyForEmployee = useCallback(
    async (
      employee: Pick<Employee, 'area' | 'seccion' | 'puesto' | 'num_empleado'>,
      meta?: { source?: string; changedBy?: string }
    ): Promise<{ vacancyId: string | null }> => {
      const OPEN: ReadonlyArray<VacancyStatus> = ['abierta', 'en_proceso', 'pausa'];
      const matches = vacancies
        .filter((v) =>
          OPEN.includes(v.status) &&
          (v.area ?? '').trim() === (employee.area ?? '').trim() &&
          (v.puesto ?? '').trim() === (employee.puesto ?? '').trim() &&
          // seccion puede ser null o '' en cualquiera de los dos lados; tratamos igual
          ((v.seccion ?? '').trim() === (employee.seccion ?? '').trim() ||
            !v.seccion ||
            !employee.seccion)
        )
        .sort((a, b) => {
          const ta = a.fecha_apertura ? new Date(a.fecha_apertura).getTime() : 0;
          const tb = b.fecha_apertura ? new Date(b.fecha_apertura).getTime() : 0;
          return ta - tb;
        });
      const target = matches[0];
      if (!target || !target.id) return { vacancyId: null };

      const sourceLabel = meta?.source ?? 'auto';
      const reason = `Auto-cubierta al crear empleado #${employee.num_empleado} (${sourceLabel}).`;
      await updateVacancy(
        target.id,
        { status: 'cubierta', fecha_cubierta: nowIso() },
        { changedBy: meta?.changedBy ?? 'sistema', reason }
      );
      return { vacancyId: target.id };
    },
    [vacancies, updateVacancy]
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
        const message = formatSupabaseError(err);
        console.warn('Supabase delete vacancy failed, removed locally:', message, err);
        setSaveStatus('error');
        return { ok: true, message: `Eliminado local. Sincronización pendiente: ${message}` };
      }
    },
    [vacancies, history, isConfigured]
  );

  /** Devuelve el log de cambios para una vacante específica, más reciente primero. */
  const getHistoryFor = useCallback(
    (vacancyId: string): VacancyStatusHistoryEntry[] =>
      history
        .filter((h) => h.vacancy_id === vacancyId)
        .sort((a, b) => {
          const ta = a.changed_at ? new Date(a.changed_at).getTime() : 0;
          const tb = b.changed_at ? new Date(b.changed_at).getTime() : 0;
          return tb - ta;
        }),
    [history]
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
    appendStatusHistory,
    coverVacancyForEmployee,
    getHistoryFor,
  };
}
