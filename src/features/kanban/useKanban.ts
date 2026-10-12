import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteKanbanTask, KanbanError, listKanbanTasks, saveKanbanTask, type KanbanErrorCode } from './api';
import type { KanbanTask, TaskDraft } from './types';

export function useKanban(userId: string) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<KanbanErrorCode | null>(null);
  const [actionError, setActionError] = useState<KanbanErrorCode | null>(null);
  const lock = useRef(false);
  const request = useRef(0);
  const live = useRef(true);

  const load = useCallback(async (offset = 0) => {
    if (lock.current) return;
    lock.current = true;
    const currentRequest = ++request.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listKanbanTasks(userId, offset);
      if (!live.current || request.current !== currentRequest) return;
      setTasks(current => offset === 0 ? result.tasks : [
        ...current, ...result.tasks.filter(task => !current.some(existing => existing.id === task.id)),
      ]);
      setTotal(result.total);
      setReady(true);
    } catch (error: unknown) {
      if (live.current && request.current === currentRequest) setLoadError(error instanceof KanbanError ? error.code : 'load');
    } finally {
      if (live.current && request.current === currentRequest) {
        lock.current = false;
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    live.current = true;
    lock.current = false;
    void load();
    return () => { live.current = false; request.current += 1; };
  }, [load]);

  async function mutate(action: () => Promise<void>) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await action();
      return true;
    } catch (error: unknown) {
      if (live.current) setActionError(error instanceof KanbanError ? error.code : 'save');
      return false;
    } finally {
      if (live.current) { lock.current = false; setBusy(false); }
    }
  }
  function save(id: string, draft: TaskDraft, version: number | null) {
    return mutate(async () => {
      const saved = await saveKanbanTask(userId, id, draft, version);
      if (!live.current) return;
      setTasks(current => version === null
        ? [saved, ...current.filter(task => task.id !== saved.id)]
        : current.map(task => task.id === saved.id ? saved : task));
      if (version === null) setTotal(current => current + 1);
    });
  }
  function remove(task: KanbanTask) {
    return mutate(async () => {
      await deleteKanbanTask(userId, task);
      if (!live.current) return;
      setTasks(current => current.filter(existing => existing.id !== task.id));
      setTotal(current => Math.max(0, current - 1));
    });
  }
  return { tasks, total, loading, ready, busy, loadError, actionError, load, save, remove,
    clearActionError: () => setActionError(null) };
}
