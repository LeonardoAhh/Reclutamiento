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
  return crypto.randomUUID();
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
      const isProyecto = input.tipo === 'proyecto';
      const cantidad = isProyecto && (input.cantidad ?? 1) > 1 ? (input.cantidad ?? 1) : 1;

      // Build one base record per plaza (cada plaza es un registro individual).
      // Para vacantes orgánicas, cantidad siempre es 1.
      const baseRecord = {
        ...input,
        // Cada plaza guarda cantidad = 1 (el campo en el registro es la plaza individual,
        // no el lote. El agrupador es `proyecto`).
        cantidad: 1,
        fecha_apertura: input.fecha_apertura ?? nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      const drafts: VacancyRequest[] = Array.from({ length: cantidad }, () => ({
        ...baseRecord,
        id: localId(),
      }));

      const updated = [...drafts, ...vacancies];
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      // Mirror local de historial para cada plaza.
      const initialHistory: VacancyStatusHistoryEntry[] = drafts.map((d) => ({
        id: localId(),
        vacancy_id: d.id!,
        from_status: null,
        to_status: d.status,
        changed_by: null,
        reason: isProyecto ? `Plaza creada — Proyecto ${input.proyecto ?? ''}` : 'Vacante creada',
        changed_at: nowIso(),
      }));
      setHistory((prev) => {
        const next = [...initialHistory, ...prev];
        saveLocal(STORAGE_KEYS.history, next);
        return next;
      });

      if (!isConfigured) {
        flashSaved();
        return { ok: true, vacancy: drafts[0] };
      }

      try {
        setSaveStatus('saving');

        // Insert all records in one batch (Supabase supports array insert).
        // The database requires the UUID id to be provided by the client if no default exists.
        const rows = drafts.map((d) => ({ ...baseRecord, id: d.id }));
        const { data, error: err } = await supabase
          .from('vacancy_requests')
          .insert(rows)
          .select('*');
        if (err) throw err;

        const saved = (data ?? []) as VacancyRequest[];

        // Replace local drafts with real DB records (match by position order).
        const replaced = updated.map((v) => {
          const idx = drafts.findIndex((d) => d.id === v.id);
          return idx >= 0 && saved[idx] ? saved[idx] : v;
        });
        setVacancies(replaced);
        saveLocal(STORAGE_KEYS.vacancies, replaced);

        // Re-apuntar historial al id real de la DB.
        setHistory((prev) => {
          const next = prev.map((h) => {
            const idx = drafts.findIndex((d) => d.id === h.vacancy_id);
            return idx >= 0 && saved[idx]?.id ? { ...h, vacancy_id: saved[idx].id! } : h;
          });
          saveLocal(STORAGE_KEYS.history, next);
          return next;
        });

        flashSaved();
        return { ok: true, vacancy: saved[0] };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase insert vacancy failed:', message, err);
        setSaveStatus('error');
        // Return ok: false so the UI actually blocks and shows the error (like missing columns)
        return { ok: false, message: `Error en base de datos: ${message}. ¿Ejecutaste el script SQL?` };
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
      employee: Pick<Employee, 'area' | 'seccion' | 'puesto' | 'num_empleado'> & { proyecto?: string | null },
      meta?: { source?: string; changedBy?: string }
    ): Promise<{ vacancyId: string | null }> => {
      const OPEN: ReadonlyArray<VacancyStatus> = ['abierta', 'en_proceso', 'pausa'];
      const targetProyecto = employee.proyecto?.trim() || null;

      const matches = vacancies
        .filter((v) =>
          OPEN.includes(v.status) &&
          (v.area ?? '').trim() === (employee.area ?? '').trim() &&
          (v.puesto ?? '').trim() === (employee.puesto ?? '').trim() &&
          // seccion puede ser null o '' en cualquiera de los dos lados; tratamos igual
          ((v.seccion ?? '').trim() === (employee.seccion ?? '').trim() ||
            !v.seccion ||
            !employee.seccion) &&
          // Match inteligente de headcount
          (targetProyecto
            ? v.tipo === 'proyecto' && (v.proyecto ?? '').trim() === targetProyecto
            : v.tipo === 'organica')
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

  const updateProjectStartDate = useCallback(
    async (proyecto: string, startDate: string): Promise<{ ok: boolean; message?: string }> => {
      const targets = vacancies.filter((v) => v.tipo === 'proyecto' && v.proyecto === proyecto);
      if (targets.length === 0) return { ok: false, message: 'Proyecto no encontrado.' };

      const updated = vacancies.map((v) => {
        if (v.tipo === 'proyecto' && v.proyecto === proyecto) {
          return { ...v, fecha_inicio_proyecto: startDate, updated_at: nowIso() };
        }
        return v;
      });
      setVacancies(updated);
      saveLocal(STORAGE_KEYS.vacancies, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { error: err } = await supabase
          .from('vacancy_requests')
          .update({ fecha_inicio_proyecto: startDate, updated_at: nowIso() })
          .eq('tipo', 'proyecto')
          .eq('proyecto', proyecto);
        if (err) throw err;
        
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase update project failed:', message, err);
        setSaveStatus('error');
        return { ok: false, message: `Error en base de datos: ${message}` };
      }
    },
    [vacancies, isConfigured]
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
    updateProjectStartDate,
  };
}
