import { useEffect, useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface MaintenanceSnapshot {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

interface MaintenanceRow {
  maintenance_mode: boolean;
}

type MaintenanceListener = () => void;

let snapshot: MaintenanceSnapshot = {
  enabled: false,
  loading: true,
  error: null,
};
let channel: RealtimeChannel | null = null;
let consumers = 0;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<MaintenanceListener>();

function emit(next: MaintenanceSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function isMaintenanceRow(value: unknown): value is MaintenanceRow {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as Record<string, unknown>).maintenance_mode === 'boolean';
}

function subscribe(listener: MaintenanceListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

export async function refreshMaintenanceMode(options: { silent?: boolean } = {}) {
  if (loadPromise) return loadPromise;

  const previous = snapshot;
  if (!options.silent) emit({ ...snapshot, loading: true, error: null });
  else emit({ ...snapshot, error: null });
  loadPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('maintenance_mode')
        .eq('id', 'main')
        .maybeSingle();

      if (error) throw error;
      if (!isMaintenanceRow(data)) {
        throw new Error('No existe la configuración principal de mantenimiento.');
      }

      emit({ enabled: data.maintenance_mode, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'No fue posible consultar el modo mantenimiento.';
      emit({
        enabled: options.silent ? previous.enabled : false,
        loading: false,
        error: message,
      });
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export async function updateMaintenanceMode(enabled: boolean) {
  const previous = snapshot;
  emit({ enabled, loading: false, error: null });

  try {
    const { data, error } = await supabase
      .from('config')
      .update({ maintenance_mode: enabled })
      .eq('id', 'main')
      .select('maintenance_mode')
      .maybeSingle();

    if (error) throw error;
    if (!isMaintenanceRow(data)) {
      throw new Error('Supabase no confirmó el cambio de mantenimiento.');
    }

    emit({ enabled: data.maintenance_mode, loading: false, error: null });
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'No fue posible cambiar el modo mantenimiento.';
    emit({ ...previous, loading: false, error: message });
    return { ok: false as const, message };
  }
}

function refreshSilently() {
  void refreshMaintenanceMode({ silent: true });
}

function startStore() {
  consumers += 1;
  if (consumers > 1) return;

  void refreshMaintenanceMode();
  channel = supabase
    .channel('maintenance-config')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'config', filter: 'id=eq.main' },
      (payload) => {
        if (!isMaintenanceRow(payload.new)) return;
        emit({ enabled: payload.new.maintenance_mode, loading: false, error: null });
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        emit({ ...snapshot, error: 'No fue posible escuchar cambios de mantenimiento en tiempo real.' });
      }
    });

  window.addEventListener('focus', refreshSilently);
  window.addEventListener('online', refreshSilently);
}

function stopStore() {
  consumers = Math.max(0, consumers - 1);
  if (consumers > 0) return;
  window.removeEventListener('focus', refreshSilently);
  window.removeEventListener('online', refreshSilently);
  if (!channel) return;
  void supabase.removeChannel(channel);
  channel = null;
}

export function useMaintenanceMode() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    startStore();
    return stopStore;
  }, []);

  return {
    ...current,
    refresh: refreshMaintenanceMode,
    update: updateMaintenanceMode,
  };
}
