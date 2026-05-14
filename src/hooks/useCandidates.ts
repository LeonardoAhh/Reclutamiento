import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import type {
  Candidate,
  CandidateNote,
  CandidateStatus,
} from '@/lib/types';
import type { SaveStatus } from './useSupabaseData';

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
    loadLocal(STORAGE_KEYS.candidates, [])
  );
  const [notes, setNotes] = useState<CandidateNote[]>(() =>
    loadLocal(STORAGE_KEYS.candidateNotes, [])
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

        const candData = (candResult.data ?? []) as Candidate[];
        const notesData = (notesResult.data ?? []) as CandidateNote[];

        setCandidates(candData);
        setNotes(notesData);
        saveLocal(STORAGE_KEYS.candidates, candData);
        saveLocal(STORAGE_KEYS.candidateNotes, notesData);
      } catch (err) {
        const msg = formatSupabaseError(err);
        console.warn('Supabase candidates fetch failed, using localStorage:', msg, err);
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

  const addCandidate = useCallback(
    async (input: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<{ ok: boolean; candidate?: Candidate; message?: string }> => {
      const draft: Candidate = {
        ...input,
        id: localId(),
        fecha_aplicacion: input.fecha_aplicacion ?? nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
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
        console.warn('Supabase insert candidate failed, saved locally:', message, err);
        setSaveStatus('error');
        return { ok: true, candidate: draft, message: `Guardado local. Sincronización pendiente: ${message}` };
      }
    },
    [candidates, isConfigured]
  );

  const updateCandidate = useCallback(
    async (id: string, patch: Partial<Candidate>): Promise<{ ok: boolean; message?: string }> => {
      const target = candidates.find((c) => c.id === id);
      if (!target) return { ok: false, message: 'Candidato no encontrado.' };

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
        console.warn('Supabase update candidate failed, saved locally:', message, err);
        setSaveStatus('error');
        return { ok: true, message: `Actualizado local. Sincronización pendiente: ${message}` };
      }
    },
    [candidates, isConfigured]
  );

  const setCandidateStatus = useCallback(
    (id: string, status: CandidateStatus) => updateCandidate(id, { status }),
    [updateCandidate]
  );

  /**
   * Marca al candidato como ya convertido en empleado: status -> 'contratado'
   * y guarda el `employee_num` resultante. Idempotente — si ya tiene
   * employee_num devuelve ok sin escribir de nuevo.
   */
  const markCandidateHired = useCallback(
    (id: string, employee_num: string) =>
      updateCandidate(id, { status: 'contratado', employee_num }),
    [updateCandidate]
  );

  const deleteCandidate = useCallback(
    async (id: string): Promise<{ ok: boolean; message?: string }> => {
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
        console.warn('Supabase delete candidate failed, removed locally:', message, err);
        setSaveStatus('error');
        return { ok: true, message: `Eliminado local. Sincronización pendiente: ${message}` };
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
        console.warn('Supabase insert candidate note failed, saved locally:', message, err);
        setSaveStatus('error');
        return { ok: true, message: `Guardado local. Sincronización pendiente: ${message}` };
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
  };
}
