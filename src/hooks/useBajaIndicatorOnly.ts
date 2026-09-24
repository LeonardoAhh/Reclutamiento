import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/errors';
import type { BajaReasonUpdate } from '@/lib/bajaReasonUpdates';

const TABLE = 'motivos_baja_indicador';

function isIndicatorRow(value: unknown): value is BajaReasonUpdate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.num_empleado === 'string'
    && typeof row.fecha_baja === 'string'
    && typeof row.tipo_baja === 'string'
    && (row.motivo_baja_estandarizado === null || typeof row.motivo_baja_estandarizado === 'string')
    && (row.motivo_baja === null || typeof row.motivo_baja === 'string');
}

export function useBajaIndicatorOnly() {
  const [records, setRecords] = useState<BajaReasonUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from(TABLE)
        .select('num_empleado,fecha_baja,tipo_baja,motivo_baja_estandarizado,motivo_baja');
      if (fetchError) {
        setError(formatSupabaseError(fetchError));
      } else if (!Array.isArray(data) || !data.every(isIndicatorRow)) {
        setError('Los registros del indicador tienen un formato inesperado.');
      } else {
        setRecords(data);
        setError(null);
      }
    } catch (fetchError) {
      setError(formatSupabaseError(fetchError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createRecord = useCallback(async (record: BajaReasonUpdate) => {
    try {
      const { error: saveError } = await supabase.from(TABLE).insert(record);
      if (saveError) return { ok: false as const, message: formatSupabaseError(saveError) };
      setRecords((current) => [...current, record]);
      return { ok: true as const };
    } catch (saveError) {
      return { ok: false as const, message: formatSupabaseError(saveError) };
    }
  }, []);

  return { records, loading, error, reload, createRecord };
}
