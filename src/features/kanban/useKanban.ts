import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveKanbanTask, deleteKanbanTask, KanbanError, listKanbanTasks, reorderKanbanTask,
  saveKanbanTask, type KanbanErrorCode } from './api';
import { sortKanbanTasks } from './presentation';
import { kanbanTaskUsesCover, removeKanbanCover, uploadKanbanCover } from './cover';
import type { KanbanTask, TaskDraft, TaskStatus } from './types';

export function useKanban(userId: string, archived = false) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<KanbanErrorCode | null>(null);
  const [actionError, setActionError] = useState<KanbanErrorCode | null>(null);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
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
  async function cleanupCover(path: string) {
    try { await removeKanbanCover(path); }
    catch { if (live.current) setCleanupPaths(current => current.includes(path) ? current : [...current, path]); }
  }
  function retryCleanup() {
    return mutate(async () => {
      const pending = [...cleanupPaths];
      setCleanupPaths([]);
      for (const path of pending) await cleanupCover(path);
    });
  }
  function save(id: string, draft: TaskDraft, version: number | null, coverFile: File | null, coverUploadId: string | null) {
    return mutate(async () => {
      const previous = tasks.find(task => task.id === id);
      let uploadedPath: string | null = null;
      let saved: KanbanTask;
      try {
        if (coverFile) {
          if (!coverUploadId) throw new KanbanError('invalid');
          try { uploadedPath = await uploadKanbanCover(userId, id, coverUploadId, coverFile); }
          catch { throw new KanbanError('photo'); }
        }
        saved = await saveKanbanTask(userId, id, { ...draft, cover_path: uploadedPath ?? draft.cover_path },
          version, Boolean(previous && previous.status !== draft.status));
      } catch (error) {
        if (uploadedPath && await kanbanTaskUsesCover(userId, id, uploadedPath) === false) {
          await cleanupCover(uploadedPath);
        }
        throw error;
      }
      if (previous?.cover_path && previous.cover_path !== saved.cover_path) await cleanupCover(previous.cover_path);
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
      if (task.cover_path) await cleanupCover(task.cover_path);
      if (!live.current) return;
      setTasks(current => current.filter(row => row.id !== task.id));
      setTotal(current => Math.max(0, current - 1));
    });
  }
  return { tasks, total, loading, ready, busy, loadError, actionError, cleanupPending: cleanupPaths.length > 0,
    retryCleanup, load, save, reorder, archive, remove,
    clearActionError: () => setActionError(null) };
}
