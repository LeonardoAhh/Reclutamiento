import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Employee, PositionComment } from '@/lib/types';

const STORAGE_KEYS = {
  employees: 'reclutamiento_employees',
  comments: 'reclutamiento_comments',
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

/**
 * Validate Supabase credentials look real before issuing requests.
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook for fetching and mutating employees + comments.
 * Tries Supabase first, falls back to localStorage so the app stays usable offline.
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

  /** Replace the whole employees table from a JSON import. */
  const upsertEmployees = useCallback(async (data: Employee[]) => {
    setEmployees(data);
    saveLocal(STORAGE_KEYS.employees, data);

    if (!isConfigured) {
      flashSaved();
      return;
    }

    try {
      setSaveStatus('saving');
      await supabase.from('empleados').delete().not('num_empleado', 'is', null);
      const { error: err } = await supabase.from('empleados').insert(data);
      if (err) throw err;
      flashSaved();
    } catch (err) {
      console.warn('Supabase upsert failed, data saved locally:', err);
      setSaveStatus('error');
    }
  }, [isConfigured]);

  /** Insert a single employee (used by the "Nuevo Empleado" modal). */
  const addSingleEmployee = useCallback(async (emp: Employee): Promise<{ ok: boolean; message?: string }> => {
    // Prevent duplicates by num_empleado
    const exists = employees.some(e => e.num_empleado === emp.num_empleado);
    if (exists) {
      return { ok: false, message: `Ya existe un empleado con número ${emp.num_empleado}.` };
    }

    const updated = [...employees, emp];
    setEmployees(updated);
    saveLocal(STORAGE_KEYS.employees, updated);

    if (!isConfigured) {
      flashSaved();
      return { ok: true };
    }

    try {
      setSaveStatus('saving');
      const { error: err } = await supabase.from('empleados').insert(emp);
      if (err) throw err;
      flashSaved();
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Supabase insert failed, employee saved locally:', message);
      setSaveStatus('error');
      return { ok: true, message: 'Guardado local. Sincronización pendiente.' };
    }
  }, [isConfigured, employees]);

  /** Remove an employee by num_empleado. */
  const deleteEmployee = useCallback(async (
    num_empleado: string,
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string }
  ): Promise<{ ok: boolean; message?: string }> => {
    const emp = employees.find(e => e.num_empleado === num_empleado);
    if (!emp) {
      return { ok: false, message: 'Empleado no encontrado.' };
    }

    const updated = employees.filter(e => e.num_empleado !== num_empleado);
    setEmployees(updated);
    saveLocal(STORAGE_KEYS.employees, updated);

    if (!isConfigured) {
      flashSaved();
      return { ok: true };
    }

    try {
      setSaveStatus('saving');

      // Si se proporcionan datos de baja, crear el registro en Supabase
      if (bajaData) {
        const { error: bajaErr } = await supabase.from('bajas').insert({
          num_empleado: emp.num_empleado,
          nombre: emp.nombre,
          area: emp.area,
          seccion: emp.seccion,
          puesto: emp.puesto,
          fecha_ingreso: emp.fecha_ingreso,
          fecha_baja: bajaData.fecha_baja,
          tipo_baja: bajaData.tipo_baja,
          motivo_baja: bajaData.motivo_baja,
        });
        
        if (bajaErr) {
          throw bajaErr;
        }
      }

      const { error: err } = await supabase
        .from('empleados')
        .delete()
        .eq('num_empleado', num_empleado);
      if (err) throw err;

      flashSaved();
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Supabase delete failed, removed locally:', message);
      setSaveStatus('error');
      return { ok: true, message: 'Eliminado local. Sincronización pendiente.' };
    }
  }, [isConfigured, employees]);

  /** Update incapacidad fields for a single employee. */
  const updateEmployeeIncapacidad = useCallback(
    async (
      num_empleado: string,
      en_incapacidad: boolean,
      incapacidad_hasta: string | null
    ): Promise<{ ok: boolean; message?: string }> => {
      const idx = employees.findIndex((e) => e.num_empleado === num_empleado);
      if (idx < 0) return { ok: false, message: 'Empleado no encontrado.' };

      const updated = employees.slice();
      updated[idx] = {
        ...updated[idx],
        en_incapacidad,
        incapacidad_hasta: en_incapacidad ? incapacidad_hasta : null,
      };
      setEmployees(updated);
      saveLocal(STORAGE_KEYS.employees, updated);

      if (!isConfigured) {
        flashSaved();
        return { ok: true };
      }

      try {
        setSaveStatus('saving');
        const { error: err } = await supabase
          .from('empleados')
          .update({
            en_incapacidad,
            incapacidad_hasta: en_incapacidad ? incapacidad_hasta : null,
          })
          .eq('num_empleado', num_empleado);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Supabase update incapacidad failed, saved locally:', message);
        setSaveStatus('error');
        return { ok: true, message: 'Guardado local. Sincronización pendiente.' };
      }
    },
    [isConfigured, employees]
  );

  /** Append a new comment for a position. */
  const addComment = useCallback(async (comment: PositionComment) => {
    const updated = [...comments, comment];
    setComments(updated);
    saveLocal(STORAGE_KEYS.comments, updated);

    if (!isConfigured) {
      flashSaved();
      return;
    }

    try {
      setSaveStatus('saving');
      const { error: err } = await supabase
        .from('comentarios_reclutamiento')
        .insert(comment);
      if (err) throw err;
      flashSaved();
    } catch (err) {
      console.warn('Supabase insert failed, comment saved locally:', err);
      setSaveStatus('error');
    }
  }, [isConfigured, comments]);

  return {
    employees,
    comments,
    loading,
    error,
    isConfigured,
    saveStatus,
    upsertEmployees,
    addSingleEmployee,
    deleteEmployee,
    updateEmployeeIncapacidad,
    addComment,
  };
}
