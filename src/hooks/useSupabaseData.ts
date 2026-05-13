import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee, PositionComment } from '@/lib/types';

const STORAGE_KEYS = {
  employees: 'reclutamiento_employees',
  comments: 'reclutamiento_comments',
};

/**
 * Load from localStorage
 */
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save to localStorage
 */
function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }
}

/**
 * Check if Supabase is properly configured with valid-looking credentials
 */
function checkSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return (
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20
  );
}

/**
 * Hook for fetching employees and comments.
 * Tries Supabase first, falls back to localStorage.
 * Single fetch on mount — no excessive reads.
 */
export function useSupabaseData() {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadLocal(STORAGE_KEYS.employees, [])
  );
  const [comments, setComments] = useState<PositionComment[]>(() =>
    loadLocal(STORAGE_KEYS.comments, [])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = checkSupabaseConfig();

  // Fetch from Supabase on mount (if configured)
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        const [empResult, commResult] = await Promise.all([
          supabase.from('empleados').select('*'),
          supabase.from('comentarios_reclutamiento').select('*'),
        ]);

        if (empResult.error) throw empResult.error;
        if (commResult.error) throw commResult.error;

        const empData = empResult.data as Employee[];
        const commData = commResult.data as PositionComment[];

        setEmployees(empData);
        setComments(commData);
        saveLocal(STORAGE_KEYS.employees, empData);
        saveLocal(STORAGE_KEYS.comments, commData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Supabase fetch failed, using localStorage:', msg);
        setError(msg);
        // localStorage data already loaded via useState initializer
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isConfigured]);

  // Upsert employees (JSON import)
  const upsertEmployees = useCallback(async (data: Employee[]) => {
    setEmployees(data);
    saveLocal(STORAGE_KEYS.employees, data);

    if (!isConfigured) return;

    try {
      // Delete all existing to ensure dropped employees (resignations) are removed
      await supabase.from('empleados').delete().not('num_empleado', 'is', null);

      // Insert fresh data
      const { error: err } = await supabase
        .from('empleados')
        .insert(data);

      if (err) throw err;
    } catch (err) {
      console.warn('Supabase upsert failed, data saved locally:', err);
    }
  }, [isConfigured]);

  // Add comment
  const addComment = useCallback(async (comment: PositionComment) => {
    const updated = [...comments, comment];
    setComments(updated);
    saveLocal(STORAGE_KEYS.comments, updated);

    if (!isConfigured) return;

    try {
      const { error: err } = await supabase
        .from('comentarios_reclutamiento')
        .insert(comment);

      if (err) throw err;
    } catch (err) {
      console.warn('Supabase insert failed, comment saved locally:', err);
    }
  }, [isConfigured, comments]);

  return {
    employees,
    comments,
    loading,
    error,
    isConfigured,
    upsertEmployees,
    addComment,
  };
}
