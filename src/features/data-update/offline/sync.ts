import { supabase } from '@/lib/supabase';
import { dataUpdateError, mapDataUpdateRecord } from '../api';
import { DATA_UPDATE_PHOTO_BUCKET } from '../constants';
import { acceptOperation, findRecord, type PendingOperation } from './model';
import { changeWorkspace, deleteOfflinePhoto, deleteOfflineRecordPhotos, getOfflineAccount, readOfflinePhoto, readWorkspace } from './storage';

const REQUEST_TIMEOUT_MS = 20_000;

function message(error: unknown) {
  return error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
}

async function sendOperation(owner: string, operation: PendingOperation) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || auth.user?.id !== owner || (await getOfflineAccount())?.id !== owner) {
    throw new Error('Vuelve a iniciar sesión con la cuenta que realizó la captura. Los pendientes siguen guardados.');
  }
  const { kind, ...payload } = operation.command;
  if (operation.command.kind === 'photo') {
    const file = await readOfflinePhoto(owner, operation.command.path);
    if (!file) throw new Error('La fotografía local no está disponible. No se finalizó el registro.');
    if (file.size === 0) throw new Error('La fotografía guardada está vacía. Vuelve a tomarla antes de sincronizar.');
    const content = await file.arrayBuffer();
    const { error } = await supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET)
      .upload(operation.command.path, content, { contentType: file.type, upsert: false });
    if (error) {
      // The deterministic path can already exist after a lost response. Verify bytes,
      // not merely existence, before attaching it; never overwrite an existing object.
      const duplicate = 'statusCode' in error && String(error.statusCode) === '409';
      if (!duplicate && !message(error).toLowerCase().includes('already exists')) throw error;
      const { data: stored, error: readError } = await supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET).download(operation.command.path);
      if (readError || !stored || stored.size !== file.size) throw new Error('No se pudo verificar la fotografía pendiente.');
      const [a, b] = await Promise.all([stored.arrayBuffer(), file.arrayBuffer()]);
      const left = new Uint8Array(a), right = new Uint8Array(b);
      if (!left.every((value, index) => value === right[index])) throw new Error('La fotografía remota no coincide con la captura pendiente.');
    }
  }
  const { data, error } = await supabase.rpc('sync_data_update_operation', {
    p_operation_id: operation.id,
    p_record_id: operation.recordId,
    p_expected_version: operation.expectedVersion,
    p_kind: kind,
    p_payload: payload,
  }).abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
  if (error) throw error;
  return mapDataUpdateRecord(data);
}

export async function synchronize(owner: string) {
  if (!navigator.onLine) return;
  const run = async () => {
    const blocked = new Set<string>();
    // A finite snapshot avoids background retry loops and starvation during ongoing edits.
    const ids = (await readWorkspace(owner)).queue.map(operation => operation.id);
    for (const id of ids) {
      if (!navigator.onLine) break;
      const operation = await changeWorkspace(owner, workspace => {
        const item = workspace.queue.find(entry => entry.id === id);
        if (!item || blocked.has(item.recordId)) return null;
        item.expectedVersion ??= findRecord(workspace, item.recordId).version;
        return structuredClone(item);
      });
      if (!operation) continue;
      try {
        const saved = await sendOperation(owner, operation);
        await changeWorkspace(owner, workspace => acceptOperation(workspace, operation.id, saved));
        if (operation.command.kind === 'photo' && operation.command.previousPath
          && operation.command.previousPath !== operation.command.path) {
          await Promise.all([
            supabase.storage.from(DATA_UPDATE_PHOTO_BUCKET).remove([operation.command.previousPath]),
            deleteOfflinePhoto(owner, operation.command.previousPath),
          ]).catch(() => undefined);
        }
        if (operation.command.kind === 'complete') {
          await deleteOfflineRecordPhotos(owner, saved.campaignId, saved.id).catch(() => undefined);
        }
      } catch (error) {
        blocked.add(operation.recordId);
        const raw = message(error);
        const reason = raw.includes('DATA_UPDATE_CONFLICT')
          ? 'Cambió en otro dispositivo. Tus cambios siguen guardados; revisa el conflicto antes de reenviar.'
          : raw.includes('sync_data_update_operation') || raw.includes('PGRST202')
            ? 'Falta habilitar la sincronización en el servidor (migración 047). Tus cambios siguen en este dispositivo.'
            : raw.includes('No content provided')
              ? 'No se pudo leer la fotografía pendiente. Tus cambios siguen guardados; vuelve a intentar la sincronización.'
            : dataUpdateError(error);
        await changeWorkspace(owner, workspace => {
          const item = workspace.queue.find(entry => entry.id === id);
          if (item) item.error = reason;
        });
      }
    }
  };
  if (navigator.locks) {
    await navigator.locks.request(`data-update-sync:${owner}`, { ifAvailable: true }, async lock => {
      if (lock) await run();
    });
  } else {
    // The server receipt makes concurrent retries idempotent on browsers
    // without Web Locks; IndexedDB still serializes local queue mutations.
    await run();
  }
}
