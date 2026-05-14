import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import { parseDdMmYyyy } from '@/lib/dates';
import type { Baja, Employee, PositionComment } from '@/lib/types';

/**
 * Normaliza una fecha al formato ISO `YYYY-MM-DD` que las columnas `date`
 * de Postgres aceptan. Hace passthrough si ya es ISO; convierte
 * `dd/mm/yyyy` y `dd-mm-yyyy`. Si no se reconoce, devuelve `null` para
 * dejar que Postgres rechace con un error claro (mejor que mandar basura).
 *
 * Necesario porque parte de los datos viejos en Supabase / localStorage
 * llegaron en `dd/mm/yyyy` (importaciones Excel viejas), y los
 * `<input type="date">` siempre devuelven ISO — al construir un payload
 * para `bajas.insert` quedaban formatos mezclados.
 */
function normalizeIsoDate(
  input: string | null | undefined
): string | null {
  if (input == null) return null;
  const parsed = parseDdMmYyyy(input);
  return parsed;
}

/**
 * Variante que recibe un Employee y devuelve uno nuevo con `fecha_ingreso`
 * normalizado a ISO. Útil al construir payloads de insert/upsert.
 */
function withNormalizedDates(emp: Employee): Employee {
  return {
    ...emp,
    fecha_ingreso: normalizeIsoDate(emp.fecha_ingreso) ?? emp.fecha_ingreso,
    incapacidad_hasta:
      emp.incapacidad_hasta == null
        ? emp.incapacidad_hasta
        : (normalizeIsoDate(emp.incapacidad_hasta) ?? emp.incapacidad_hasta),
  };
}

const STORAGE_KEYS = {
  employees: 'reclutamiento_employees',
  comments: 'reclutamiento_comments',
  /**
   * Mismo key que usa `useBajas`. Lo mantenemos en sync desde aquí cuando
   * se da de baja un empleado, para que `/bajas` lo vea aunque aún no
   * haya re-fetcheado Supabase.
   */
  bajas: 'reclutamiento_bajas',
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
        const msg = formatSupabaseError(err);
        console.warn('Supabase fetch failed, using localStorage:', msg, err);
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
      const { error: err } = await supabase
        .from('empleados')
        .insert(data.map(withNormalizedDates));
      if (err) throw err;
      flashSaved();
    } catch (err) {
      console.warn('Supabase upsert failed, data saved locally:', formatSupabaseError(err), err);
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
      const { error: err } = await supabase
        .from('empleados')
        .insert(withNormalizedDates(emp));
      if (err) throw err;
      flashSaved();
      return { ok: true };
    } catch (err) {
      const message = formatSupabaseError(err);
      console.warn('Supabase insert failed, reverting local insert:', message, err);
      // Revertir el optimistic update: si Supabase rechazó el insert (RLS,
      // unique violation, sesión expirada), no podemos dejar el empleado en
      // el state local porque desaparecería al refrescar desde Supabase y
      // confundiría al usuario.
      setEmployees(employees);
      saveLocal(STORAGE_KEYS.employees, employees);
      setSaveStatus('error');
      return { ok: false, message: `No se pudo guardar en Supabase: ${message}` };
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
      // y, en paralelo, mantenerlo en localStorage para que `/bajas` lo
      // muestre aunque aún no haya re-fetcheado el servidor.
      if (bajaData) {
        // Normaliza fechas antes del insert. Postgres `date` rechaza
        // `dd/mm/yyyy` con `22008` aunque el formulario sí mande ISO,
        // porque `fecha_ingreso` viene del row del empleado que pudo
        // haberse capturado en formato latino en una importación vieja.
        const fechaIngreso = normalizeIsoDate(emp.fecha_ingreso);
        const fechaBaja = normalizeIsoDate(bajaData.fecha_baja);
        const nuevaBaja: Baja = {
          num_empleado: emp.num_empleado,
          nombre: emp.nombre,
          area: emp.area,
          seccion: emp.seccion,
          puesto: emp.puesto,
          fecha_ingreso: fechaIngreso ?? emp.fecha_ingreso,
          fecha_baja: fechaBaja ?? bajaData.fecha_baja,
          tipo_baja: bajaData.tipo_baja,
          motivo_baja: bajaData.motivo_baja,
          cubierta_manual: false,
          cubierta_fecha: null,
          cubierta_nota: null,
        };

        // Update local cache primero: dedupe por num_empleado para no
        // duplicar si por alguna razón ya existía una baja previa.
        const existingBajas = loadLocal<Baja[]>(STORAGE_KEYS.bajas, []);
        const dedup = existingBajas.filter(
          (b) => b.num_empleado !== nuevaBaja.num_empleado
        );
        saveLocal(STORAGE_KEYS.bajas, [...dedup, nuevaBaja]);

        const { error: bajaErr } = await supabase
          .from('bajas')
          .insert(nuevaBaja);

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
      const message = formatSupabaseError(err);
      console.warn('Supabase delete failed, reverting local delete:', message, err);
      // Revertir el optimistic delete: Supabase rechazó el delete (RLS,
      // FK, sesión expirada, unique violation en `bajas`, etc). Si dejamos
      // el empleado fuera del state local, reaparecería al refrescar y el
      // usuario creería que se borró cuando no.
      setEmployees(employees);
      saveLocal(STORAGE_KEYS.employees, employees);
      setSaveStatus('error');
      return { ok: false, message: `No se pudo eliminar en Supabase: ${message}` };
    }
  }, [isConfigured, employees]);

  /**
   * Promueve a un empleado a otro puesto (cambia area/seccion/puesto). El
   * `fecha_ingreso` y los demás datos personales se conservan; solo se mueve
   * la asignación de plantilla. La cobertura del puesto origen se recalcula
   * automáticamente (queda una vacante) y el llamador puede cerrar vacantes
   * abiertas del puesto destino vía `coverVacancyForEmployee`.
   */
  const promoteEmployee = useCallback(
    async (
      num_empleado: string,
      target: { area: string; seccion: string; puesto: string }
    ): Promise<{ ok: boolean; message?: string }> => {
      const idx = employees.findIndex((e) => e.num_empleado === num_empleado);
      if (idx < 0) return { ok: false, message: 'Empleado no encontrado.' };

      const current = employees[idx];
      const area = target.area.trim();
      const seccion = target.seccion.trim();
      const puesto = target.puesto.trim();
      if (!area || !seccion || !puesto) {
        return { ok: false, message: 'Área, sección y puesto son requeridos.' };
      }
      if (
        current.area === area &&
        current.seccion === seccion &&
        current.puesto === puesto
      ) {
        return {
          ok: false,
          message: 'El empleado ya ocupa ese puesto.',
        };
      }

      const updated = employees.slice();
      updated[idx] = { ...current, area, seccion, puesto };
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
          .update({ area, seccion, puesto })
          .eq('num_empleado', num_empleado);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase promote failed, reverting local change:', message, err);
        // Revertir el optimistic update para que el puesto del empleado
        // siga reflejando lo que Supabase realmente tiene.
        setEmployees(employees);
        saveLocal(STORAGE_KEYS.employees, employees);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo promover en Supabase: ${message}` };
      }
    },
    [employees, isConfigured]
  );

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
        const normalizedHasta =
          en_incapacidad && incapacidad_hasta
            ? (normalizeIsoDate(incapacidad_hasta) ?? incapacidad_hasta)
            : null;
        const { error: err } = await supabase
          .from('empleados')
          .update({
            en_incapacidad,
            incapacidad_hasta: normalizedHasta,
          })
          .eq('num_empleado', num_empleado);
        if (err) throw err;
        flashSaved();
        return { ok: true };
      } catch (err) {
        const message = formatSupabaseError(err);
        console.warn('Supabase update incapacidad failed, reverting local change:', message, err);
        setEmployees(employees);
        saveLocal(STORAGE_KEYS.employees, employees);
        setSaveStatus('error');
        return { ok: false, message: `No se pudo actualizar en Supabase: ${message}` };
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
      console.warn(
        'Supabase insert failed, comment saved locally:',
        formatSupabaseError(err),
        err
      );
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
    promoteEmployee,
    addComment,
  };
}
