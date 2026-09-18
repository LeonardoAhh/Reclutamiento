import { emptyWorkspace, type OfflineAccount, type OfflineWorkspace } from './model';

const DATABASE = 'data-update-offline-v1';
const STORE = 'workspaces';
export const OFFLINE_CHANGED = 'data-update:offline-changed';
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { database = undefined; reject(new Error('No se pudo abrir el almacenamiento offline del dispositivo.')); };
    request.onblocked = () => reject(new Error('Cierra otras pestañas para preparar el almacenamiento offline.'));
  });
  return database;
}

export async function readValue(key: string): Promise<unknown> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function workspaceValue(value: unknown, owner: string): OfflineWorkspace {
  if (value === undefined) return emptyWorkspace(owner);
  if (typeof value !== 'object' || value === null || !('schema' in value) || value.schema !== 1
    || !('owner' in value) || value.owner !== owner || !('queue' in value) || !Array.isArray(value.queue)
    || !('campaigns' in value) || !Array.isArray(value.campaigns)
    || !('details' in value) || typeof value.details !== 'object'
    || !('forms' in value) || !('incidents' in value)) {
    throw new Error('El almacenamiento offline no es compatible. No se borraron tus pendientes.');
  }
  // Only this versioned module writes the structured-clone payload; not network JSON.
  return value as OfflineWorkspace;
}

export async function readWorkspace(owner: string) {
  return workspaceValue(await readValue(`user:${owner}`), owner);
}

export function notifyOfflineChanged() {
  window.dispatchEvent(new Event(OFFLINE_CHANGED));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(OFFLINE_CHANGED);
    channel.postMessage('changed');
    channel.close();
  }
}

/** One IDB transaction serializes read/modify/write across tabs without network locks. */
export async function changeWorkspace<T>(owner: string, change: (workspace: OfflineWorkspace) => T): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.get(`user:${owner}`);
    let result: T;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        const workspace = workspaceValue(request.result, owner);
        result = change(workspace);
        store.put(workspace, `user:${owner}`);
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => { notifyOfflineChanged(); resolve(result); };
    transaction.onabort = () => reject(failure ?? new Error('No se pudo guardar en este dispositivo. Revisa el espacio disponible; no cierres la captura.'));
    transaction.onerror = () => { failure ??= transaction.error; };
  });
}

export async function setOfflineAccount(account: OfflineAccount | null) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    if (account) transaction.objectStore(STORE).put(account, 'active-account');
    else transaction.objectStore(STORE).delete('active-account');
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
  notifyOfflineChanged();
}

export async function getOfflineAccount(): Promise<OfflineAccount | null> {
  const value = await readValue('active-account');
  if (typeof value !== 'object' || value === null || !('id' in value) || typeof value.id !== 'string'
    || !('username' in value) || typeof value.username !== 'string' || !('role' in value)
    || (value.role !== 'admin' && value.role !== 'reclutador')) return null;
  return { id: value.id, role: value.role, username: value.username };
}

export async function saveOfflinePhoto(owner: string, path: string, photo: Blob) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(photo, `photo:${owner}:${path}`);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(new Error('No se pudo guardar la fotografía en el dispositivo. Revisa el espacio disponible.'));
  });
}

export async function readOfflinePhoto(owner: string, path: string): Promise<Blob | null> {
  const value = await readValue(`photo:${owner}:${path}`);
  return value instanceof Blob ? value : null;
}

export async function deleteOfflinePhoto(owner: string, path: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(`photo:${owner}:${path}`);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function deleteOfflineRecordPhotos(owner: string, campaignId: string, recordId: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.getAllKeys();
    const prefix = `photo:${owner}:${campaignId}/${recordId}/`;
    request.onsuccess = () => {
      for (const key of request.result) if (typeof key === 'string' && key.startsWith(prefix)) store.delete(key);
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}
