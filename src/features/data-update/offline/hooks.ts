import { useCallback, useEffect, useRef, useState } from 'react';
import { DATA_UPDATE_PATH } from '../types';
import { emptyWorkspace, type OfflineAccount, type OfflineWorkspace } from './model';
import { getOfflineAccount, OFFLINE_CHANGED, readWorkspace, changeWorkspace } from './storage';
import { synchronize } from './sync';

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online;
}

function subscribe(callback: () => void) {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(OFFLINE_CHANGED);
  if (channel) channel.onmessage = callback;
  window.addEventListener(OFFLINE_CHANGED, callback);
  return () => { window.removeEventListener(OFFLINE_CHANGED, callback); channel?.close(); };
}

/** Cached identity grants local access to this route only, never a server session. */
export function useOfflineAccess(sessionUserId?: string) {
  const online = useOnlineStatus();
  const [account, setAccount] = useState<OfflineAccount | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let revision = 0;
    const read = () => {
      const current = ++revision;
      void getOfflineAccount().then(value => {
        if (active && current === revision) setAccount(value);
      }).catch(() => { if (active) setAccount(null); })
        .finally(() => { if (active) setLoading(false); });
    };
    read();
    const unsubscribe = subscribe(read);
    return () => { active = false; unsubscribe(); };
  }, []);
  const allowed = !online && window.location.pathname === DATA_UPDATE_PATH
    && account !== null && (!sessionUserId || sessionUserId === account.id);
  return { account: allowed ? account : null, loading: !online && loading };
}

export function useOfflineWorkspace(owner: string, online: boolean, editorOpen: boolean) {
  const [workspace, setWorkspace] = useState<OfflineWorkspace>(() => emptyWorkspace(owner));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  useEffect(() => {
    let active = true;
    let revision = 0;
    const read = () => {
      if (!owner) return;
      const current = ++revision;
      void readWorkspace(owner).then(value => {
        if (active && current === revision) setWorkspace(value);
      }).catch(() => { if (active) setError('No se pudo leer el almacenamiento offline.'); });
    };
    read();
    const unsubscribe = subscribe(read);
    return () => { active = false; unsubscribe(); };
  }, [owner]);

  const sync = useCallback(async (retry = false) => {
    if (!owner || !online || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (retry) await changeWorkspace(owner, value => { for (const item of value.queue) delete item.error; });
      await synchronize(owner);
    } catch (caught) {
      if (ownerRef.current === owner) setError(caught instanceof Error ? caught.message : 'No se pudo sincronizar.');
    } finally { busyRef.current = false; setBusy(false); }
  }, [owner, online]);

  const visible = workspace.owner === owner ? workspace : emptyWorkspace(owner);
  const firstByRecord = visible.queue.filter((item, index, all) => all.findIndex(row => row.recordId === item.recordId) === index);
  const ready = firstByRecord.some(item => !item.error);
  useEffect(() => {
    if (!editorOpen && !busy && ready) void sync();
  }, [editorOpen, busy, ready, sync, visible.queue.length]);
  useEffect(() => {
    const retry = () => { if (!editorOpen) void sync(true); };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [editorOpen, sync]);

  return { workspace: visible, busy, error, sync };
}
