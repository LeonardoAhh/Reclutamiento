import { supabase } from '@/lib/supabase';
import { isKanbanTask, validateTaskDraft, type KanbanTask, type TaskDraft, type TaskStatus } from './types';

export type KanbanErrorCode = 'load' | 'save' | 'delete' | 'conflict' | 'permission' | 'setup' | 'invalid' | 'photo';
export class KanbanError extends Error {
  constructor(public readonly code: KanbanErrorCode) { super(code); }
}
const TASK_SELECT = 'id, title, description, kind, status, version, created_at, due_date, due_time, checklist, position, archived_at, cover_path';
export const KANBAN_PAGE_SIZE = 100;
function fail(error: { code?: string }, fallback: KanbanErrorCode): never {
  if (error.code === '42501') throw new KanbanError('permission');
  if (error.code === '40001') throw new KanbanError('conflict');
  if (error.code === '22023') throw new KanbanError('invalid');
  if (['42P01', '42703', 'PGRST205', 'PGRST204', 'PGRST202'].includes(error.code ?? '')) throw new KanbanError('setup');
  throw new KanbanError(fallback);
}
function taskFromRow(row: unknown): KanbanTask {
  if (!row || typeof row !== 'object' || !('due_time' in row)) throw new KanbanError('invalid');
  const normalized = { ...row, due_time: typeof row.due_time === 'string' && /^\d{2}:\d{2}:00$/.test(row.due_time)
    ? row.due_time.slice(0, 5) : row.due_time };
  if (!isKanbanTask(normalized)) throw new KanbanError('invalid');
  return normalized;
}
export async function listKanbanTasks(userId: string, archived: boolean, excludedIds: readonly string[] = []) {
  if (excludedIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new KanbanError('invalid');
  }
  // Excluye lo ya cargado sin URLs crecientes ni saltos tras reordenar.
  let query = supabase.rpc('list_kanban_tasks', {
    p_archived: archived, p_excluded_ids: [...excludedIds],
  }, { count: 'exact' }).select(TASK_SELECT).eq('owner_id', userId);
  query = archived ? query.order('archived_at', { ascending: false })
    : query.order('position', { ascending: true });
  const { data, count, error } = await query.order('created_at', { ascending: false })
    .order('id', { ascending: false }).limit(KANBAN_PAGE_SIZE);
  if (error) fail(error, 'load');
  const rows: unknown = data;
  if (!Array.isArray(rows)) throw new KanbanError('invalid');
  return { tasks: rows.map(taskFromRow), total: (count ?? 0) + excludedIds.length };
}
export async function saveKanbanTask(userId: string, id: string, draft: TaskDraft, version: number | null, resetPosition = false) {
  const fields = {
    title: draft.title.trim(), description: draft.description.trim(), kind: draft.kind, status: draft.status,
    due_date: draft.due_date, due_time: draft.due_time, cover_path: draft.cover_path,
    checklist: draft.checklist.map(item => ({ ...item, text: item.text.trim() })),
  };
  if (validateTaskDraft(fields)) throw new KanbanError('invalid');
  if (version === null) {
    const { data, error } = await supabase.from('kanban_tasks').insert({ id, owner_id: userId, ...fields }).select(TASK_SELECT).single();
    if (error?.code === '23505') {
      const existing = await supabase.from('kanban_tasks').select(TASK_SELECT).eq('id', id).eq('owner_id', userId).single();
      if (existing.error) fail(existing.error, 'save');
      const saved = taskFromRow(existing.data);
      if (saved.title !== fields.title || saved.description !== fields.description || saved.kind !== fields.kind
        || saved.status !== fields.status || saved.due_date !== fields.due_date || saved.due_time !== fields.due_time
        || saved.cover_path !== fields.cover_path
        || saved.checklist.length !== fields.checklist.length
        || saved.checklist.some((step, index) => step.id !== fields.checklist[index].id
          || step.text !== fields.checklist[index].text || step.done !== fields.checklist[index].done)) throw new KanbanError('conflict');
      return saved;
    }
    if (error) fail(error, 'save');
    return taskFromRow(data);
  }
  const { data, error } = await supabase.from('kanban_tasks').update({ ...fields, ...(resetPosition ? { position: 0 } : {}) })
    .eq('id', id).eq('owner_id', userId).eq('version', version).is('archived_at', null).select(TASK_SELECT).maybeSingle();
  if (error) fail(error, 'save');
  if (!data) throw new KanbanError('conflict');
  return taskFromRow(data);
}
export async function deleteKanbanTask(userId: string, task: KanbanTask) {
  const { data, error } = await supabase.from('kanban_tasks').delete().eq('id', task.id)
    .eq('owner_id', userId).eq('version', task.version).select('id').maybeSingle();
  if (error) fail(error, 'delete');
  if (!data) throw new KanbanError('conflict');
}
export async function archiveKanbanTask(task: KanbanTask, archived: boolean) {
  const { data, error } = await supabase.rpc('archive_kanban_task', { p_id: task.id, p_version: task.version, p_archive: archived });
  if (error) fail(error, 'save');
  return taskFromRow(data);
}
export interface PositionChange { id: string; position: number; version: number; }
function isPositionChange(value: unknown): value is PositionChange {
  return Boolean(value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    && 'position' in value && typeof value.position === 'number' && Number.isInteger(value.position) && value.position >= 0
    && 'version' in value && typeof value.version === 'number' && Number.isInteger(value.version) && value.version > 0);
}
export async function reorderKanbanTask(task: KanbanTask, status: TaskStatus, beforeId: string | null) {
  const { data, error } = await supabase.rpc('reorder_kanban_task', {
    p_id: task.id, p_status: status, p_before_id: beforeId, p_version: task.version,
  });
  if (error) fail(error, 'save');
  const result: unknown = data;
  if (!result || typeof result !== 'object' || !('task' in result) || !('positions' in result)
    || !Array.isArray(result.positions) || !result.positions.every(isPositionChange)) throw new KanbanError('invalid');
  return { task: taskFromRow(result.task), positions: result.positions };
}
