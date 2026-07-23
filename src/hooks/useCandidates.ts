import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import type {
  Candidate,
  CandidateNote,
  CandidateStatus,
} from '@/lib/types';
import { normalizeCandidateStatus } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import type { SaveStatus } from './useSupabaseData';

/**
 * Normaliza una fila cruda de candidato (Supabase o localStorage) al
 * shape actual. Solo toca `status` para reemplazar valores legados
 * (`aplico`, `revision`, `oferta`) por los 4 vigentes; los demas
 * campos se respetan tal cual.
 */
function normalizeCandidate(raw: Candidate): Candidate {
  return { ...raw, status: normalizeCandidateStatus(raw.status) };
}

const STORAGE_KEYS = {
  candidates: 'reclutamiento_candidates',
  candidateNotes: 'reclutamiento_candidate_notes',
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function loadLocalCandidates(): Candidate[] {
  const raw = loadLocal<Candidate[]>(STORAGE_KEYS.candidates, []);
  return raw.map(normalizeCandidate);
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
  // Solo para usar mientras no hay conexión a Supabase; los UUIDs reales
  // los emite la base (default gen_random_uuid()).
  return `local-${nowIso()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook for fetching and mutating candidates + candidate notes.
 * Mirrors useSupabaseData: tries Supabase first, falls back to localStorage.
 */
export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadLocalCandidates()
  );
  const [notes, setNotes] = useState<CandidateNote[]>(() =>
    loadLocal(STORAGE_KEYS.candidateNotes, [])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const isConfigured = checkSupabaseConfig();

  const refetch = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isConfigured) return;
      try {
        if (!opts?.silent) setLoading(true);
        const [candResult, notesResult] = await Promise.all([
          supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('candidate_notes')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (candResult.error) throw candResult.error;
        if (notesResult.error) throw notesResult.error;

        const candData = ((candResult.data ?? []) as Candidate[]).map(
          normalizeCandidate
        );
        const notesData = (notesResult.data ?? []) as CandidateNote[];

        // Merge fetched candidates with locally saved candidates to preserve
        // local edits that haven't synced to Supabase yet. We prefer the row
        // with the newer `updated_at` timestamp.
        const localSaved = loadLocalCandidates();
        const fetchedById = new Map<string | undefined, Candidate>();
        for (const f of candData) fetchedById.set(f.id, f);

        const mergedMap = new Map<string | undefined, Candidate>(fetchedById);
        for (const l of localSaved) {
          const id = l.id;
          const fetched = fetchedById.get(id);
          if (!fetched) {
            // local-only row (e.g., created offline) — keep it
            mergedMap.set(id, l);
            continue;
          }
          // If local has a newer updated_at, prefer local (unsynced change).
          const localUpdated = l.updated_at ? new Date(l.updated_at).getTime() : 0;
          const fetchedUpdated = fetched.updated_at ? new Date(fetched.updated_at).getTime() : 0;
          if (localUpdated > fetchedUpdated) mergedMap.set(id, l);
          else mergedMap.set(id, fetched);
        }

        // Convert merged map to array and sort by created_at desc to match
        // the previous behavior.
        const merged = Array.from(mergedMap.values()).sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });

        setCandidates(merged);
        setNotes(notesData);
        saveLocal(STORAGE_KEYS.candidates, merged);
        saveLocal(STORAGE_KEYS.candidateNotes, notesData);
      } catch (err) {
        const msg = formatSupabaseError(err);
        console.warn('Supabase candidates fetch failed, using localStorage:', msg, err);
        setError(msg);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [isConfigured]
  );

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    refetch();
  }, [isConfigured, refetch]);

  /* ── Realtime ─────────────────────────────────────────────────────────
     Suscripción a cambios en `candidates` / `candidate_notes`. Cuando otra
     persona (u otra pestaña) inserta/edita/elimina, refrescamos en silencio
     (sin skeleton). Requiere tener Realtime habilitado para estas tablas en
     Supabase. Si no lo está, simplemente nunca dispara — degradación segura. */
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase
      .channel('realtime:candidates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => refetch({ silent: true })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, refetch]);

  function flashSaved() {
    setSaveStatus('saved');
    window.setTimeout(() => setSaveStatus('idle'), 1500);
  }

  const addCandidate = useCallback(
    async (input: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<{ ok: boolean; candidate?: Candidate; message?: string }> => {
      const draft: Candidate = {
        ...input,
        id: localId(),
        fecha_aplicacion: input.fecha_aplicacion ?? nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const previous = candidates;
      const updated = [draft, ...candidates];
      setCandidates(updated);
      saveLocal(STORAGE_KEYS.candidates, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true, candidate: draft };
      }

      try {
        setSaveStatus('saving');
        const { data, error: err } = await supabase
          .from('candidates')
          .insert({ ...input, fecha_aplicacion: draft.fecha_aplicacion })
          .select('*')
          .single();
        if (err) throw err;

        const saved = data as Candidate;
        // Replace the local-id row with the row that came back from Supabase.
        const replaced = updated.map((c) => (c.id === draft.id ? saved : c));
        setCandidates(replaced);
        saveLocal(STORAGE_KEYS.candidates, replaced);
        flashSaved();
        return { ok: true, candidate: saved };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase insert candidate failed, reverting local insert:', message, err);
        // Revertir el optimistic update: sin esto, la fila persistia solo en
        // localStorage y los KPIs divergian entre devices al refrescar.
        setCandidates(previous);
        saveLocal(STORAGE_KEYS.candidates, previous);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo guardar en Supabase: ${message}` };
      }
    },
    [candidates, isConfigured]
  );

  const updateCandidate = useCallback(
    async (id: string, patch: Partial<Candidate>): Promise<{ ok: boolean; message?: string }> => {
      const target = candidates.find((c) => c.id === id);
      if (!target) return { ok: false, message: 'Candidato no encontrado.' };

      const previous = candidates;
      const merged: Candidate = { ...target, ...patch, updated_at: nowIso() };
      const updated = candidates.map((c) => (c.id === id ? merged : c));
      setCandidates(updated);
      saveLocal(STORAGE_KEYS.candidates, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        // Strip fields managed by the DB so we don't shadow triggers.
        const { id: _id, created_at: _ca, updated_at: _ua, ...payload } = patch as Candidate;
        void _id;
        void _ca;
        void _ua;
        const { error: err } = await supabase
          .from('candidates')
          .update(payload)
          .eq('id', id);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase update candidate failed, reverting local update:', message, err);
        setCandidates(previous);
        saveLocal(STORAGE_KEYS.candidates, previous);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo guardar en Supabase: ${message}` };
      }
    },
    [candidates, isConfigured]
  );

  const setCandidateStatus = useCallback(
    (id: string, status: CandidateStatus) => {
      const patch: Partial<Candidate> = { status };
      // Al pasar a 'contratado' sin fecha previa, sellamos la fecha de hoy
      // (TZ MX) para que el reporte pueda filtrar "contratados de la semana".
      if (status === 'contratado') {
        const target = candidates.find((c) => c.id === id);
        if (target && !target.fecha_contratacion) {
          patch.fecha_contratacion = localTodayIso();
        }
      }
      return updateCandidate(id, patch);
    },
    [candidates, updateCandidate]
  );

  /**
   * Marca al candidato como ya convertido en empleado: status -> 'contratado'
   * y guarda el `employee_num` resultante. `fechaContratacion` viene del hire
   * (= fecha_ingreso del empleado); si no se pasa, usa hoy en TZ MX.
   * Idempotente — si ya tiene employee_num devuelve ok sin escribir de nuevo.
   */
  const markCandidateHired = useCallback(
    (id: string, employee_num: string, fechaContratacion?: string) =>
      updateCandidate(id, {
        status: 'contratado',
        employee_num,
        fecha_contratacion: fechaContratacion || localTodayIso(),
      }),
    [updateCandidate]
  );

  const deleteCandidate = useCallback(
    async (id: string): Promise<{ ok: boolean; message?: string }> => {
      const previousCandidates = candidates;
      const previousNotes = notes;
      const updated = candidates.filter((c) => c.id !== id);
      if (updated.length === candidates.length) {
        return { ok: false, message: 'Candidato no encontrado.' };
      }
      setCandidates(updated);
      saveLocal(STORAGE_KEYS.candidates, updated);

      // Notes will be removed too by ON DELETE CASCADE en la DB.
      const remainingNotes = notes.filter((n) => n.candidate_id !== id);
      setNotes(remainingNotes);
      saveLocal(STORAGE_KEYS.candidateNotes, remainingNotes);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { error: err } = await supabase
          .from('candidates')
          .delete()
          .eq('id', id);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase delete candidate failed, reverting local delete:', message, err);
        setCandidates(previousCandidates);
        saveLocal(STORAGE_KEYS.candidates, previousCandidates);
        setNotes(previousNotes);
        saveLocal(STORAGE_KEYS.candidateNotes, previousNotes);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo eliminar en Supabase: ${message}` };
      }
    },
    [candidates, notes, isConfigured]
  );

  const addCandidateNote = useCallback(
    async (note: Omit<CandidateNote, 'id' | 'created_at'>): Promise<{ ok: boolean; message?: string }> => {
      const draft: CandidateNote = {
        ...note,
        id: localId(),
        created_at: nowIso(),
      };
      const previousNotes = notes;
      const updated = [draft, ...notes];
      setNotes(updated);
      saveLocal(STORAGE_KEYS.candidateNotes, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { data, error: err } = await supabase
          .from('candidate_notes')
          .insert(note)
          .select('*')
          .single();
        if (err) throw err;

        const replaced = updated.map((n) => (n.id === draft.id ? (data as CandidateNote) : n));
        setNotes(replaced);
        saveLocal(STORAGE_KEYS.candidateNotes, replaced);
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase insert candidate note failed, reverting local insert:', message, err);
        setNotes(previousNotes);
        saveLocal(STORAGE_KEYS.candidateNotes, previousNotes);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo guardar la nota en Supabase: ${message}` };
      }
    },
    [notes, isConfigured]
  );

  return {
    candidates,
    notes,
    loading,
    error,
    isConfigured,
    saveStatus,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    markCandidateHired,
    deleteCandidate,
    addCandidateNote,
    refetch,
  };
}
