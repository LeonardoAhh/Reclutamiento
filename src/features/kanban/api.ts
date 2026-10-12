import { supabase } from '@/lib/supabase';
import { isKanbanTask, type KanbanTask, type TaskDraft } from './types';

export type KanbanErrorCode = 'load' | 'save' | 'delete' | 'conflict' | 'permission' | 'setup' | 'invalid';
export class KanbanError extends Error {
  constructor(public readonly code: KanbanErrorCode) { super(code); }
}
const TASK_SELECT = 'id, title, description, kind, status, version, created_at';
export const KANBAN_PAGE_SIZE = 100;
function fail(error: { code?: string }, fallback: KanbanErrorCode): never {
  if (error.code === '42501') throw new KanbanError('permission');
  if (error.code === '42P01' || error.code === 'PGRST205') throw new KanbanError('setup');
  throw new KanbanError(fallback);
}
function taskFromRow(row: unknown): KanbanTask {
  if (!isKanbanTask(row)) throw new KanbanError('invalid');
  return row;
}
export async function listKanbanTasks(userId: string, offset: number) {
  const { data, count, error } = await supabase.from('kanban_tasks')
    .select(TASK_SELECT, { count: 'exact' }).eq('owner_id', userId)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(offset, offset + KANBAN_PAGE_SIZE - 1);
  if (error) fail(error, 'load');
  return { tasks: (data ?? []).map(taskFromRow), total: count ?? 0 };
}
export async function saveKanbanTask(userId: string, id: string, draft: TaskDraft, version: number | null) {
  const fields = { title: draft.title.trim(), description: draft.description.trim(), kind: draft.kind, status: draft.status };
  if (!fields.title || fields.title.length > 160 || fields.description.length > 4000) throw new KanbanError('invalid');
  if (version === null) {
    const { data, error } = await supabase.from('kanban_tasks')
      .insert({ id, owner_id: userId, ...fields }).select(TASK_SELECT).single();
    if (error?.code === '23505') {
      // Reintenta el mismo UUID sin duplicar un guardado cuya respuesta se perdió.
      const existing = await supabase.from('kanban_tasks').select(TASK_SELECT)
        .eq('id', id).eq('owner_id', userId).single();
      if (existing.error) fail(existing.error, 'save');
      const saved = taskFromRow(existing.data);
      if (saved.title !== fields.title || saved.description !== fields.description
        || saved.kind !== fields.kind || saved.status !== fields.status) throw new KanbanError('conflict');
      return saved;
    }
    if (error) fail(error, 'save');
    return taskFromRow(data);
  }
  const { data, error } = await supabase.from('kanban_tasks').update(fields)
    .eq('id', id).eq('owner_id', userId).eq('version', version).select(TASK_SELECT).maybeSingle();
  if (error) fail(error, 'save');
  if (!data) throw new KanbanError('conflict');
  return taskFromRow(data);
}
export async function deleteKanbanTask(userId: string, task: KanbanTask) {
  const { data, error } = await supabase.from('kanban_tasks').delete()
    .eq('id', task.id).eq('owner_id', userId).eq('version', task.version).select('id').maybeSingle();
  if (error) fail(error, 'delete');
  if (!data) throw new KanbanError('conflict');
}
