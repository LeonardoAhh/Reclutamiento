import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveKanbanTask, deleteKanbanTask, KanbanError, listKanbanTasks, reorderKanbanTask,
  saveKanbanTask, type KanbanErrorCode } from './api';
import { sortKanbanTasks } from './presentation';
import type { KanbanTask, TaskDraft, TaskStatus } from './types';

export function useKanban(userId: string, archived = false) {
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
  const load = useCallback(async (excludedIds: readonly string[] = []) => {
    if (lock.current) return;
    lock.current = true;
    const currentRequest = ++request.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listKanbanTasks(userId, archived, excludedIds);
      if (!live.current || request.current !== currentRequest) return;
      setTasks(current => sortKanbanTasks(excludedIds.length ? [
        ...current, ...result.tasks.filter(task => !current.some(existing => existing.id === task.id)),
      ] : result.tasks, archived));
      setTotal(result.total);
      setReady(true);
    } catch (error: unknown) {
      if (live.current && request.current === currentRequest) setLoadError(error instanceof KanbanError ? error.code : 'load');
    } finally {
      if (live.current && request.current === currentRequest) { lock.current = false; setLoading(false); }
    }
  }, [userId, archived]);
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
    try { await action(); return true; }
    catch (error: unknown) {
      if (live.current) setActionError(error instanceof KanbanError ? error.code : 'save');
      return false;
    } finally { if (live.current) { lock.current = false; setBusy(false); } }
  }
  function save(id: string, draft: TaskDraft, version: number | null) {
    return mutate(async () => {
      const previous = tasks.find(task => task.id === id);
      const saved = await saveKanbanTask(userId, id, draft, version, Boolean(previous && previous.status !== draft.status));
      if (!live.current) return;
      setTasks(current => sortKanbanTasks(version === null
        ? [saved, ...current.filter(task => task.id !== saved.id)]
        : current.map(task => task.id === saved.id ? saved : task), archived));
      if (version === null) setTotal(current => current + 1);
    });
  }
  function reorder(task: KanbanTask, status: TaskStatus, beforeId: string | null) {
    return mutate(async () => {
      const result = await reorderKanbanTask(task, status, beforeId);
      if (!live.current) return;
      const changes = new Map(result.positions.map(item => [item.id, item]));
      setTasks(current => sortKanbanTasks(current.map(row => row.id === result.task.id ? result.task
        : { ...row, ...changes.get(row.id) }), archived));
    });
  }
  function archive(task: KanbanTask, nextArchived: boolean) {
    return mutate(async () => {
      await archiveKanbanTask(task, nextArchived);
      if (!live.current) return;
      setTasks(current => current.filter(row => row.id !== task.id));
      setTotal(current => Math.max(0, current - 1));
    });
  }
  function remove(task: KanbanTask) {
    return mutate(async () => {
      await deleteKanbanTask(userId, task);
      if (!live.current) return;
      setTasks(current => current.filter(row => row.id !== task.id));
      setTotal(current => Math.max(0, current - 1));
    });
  }
  return { tasks, total, loading, ready, busy, loadError, actionError, load, save, reorder, archive, remove,
    clearActionError: () => setActionError(null) };
}
