import { addDaysToIso } from '@/lib/dates';

export const KANBAN_PATH = '/kanban';
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'notes'] as const;
export const TASK_KINDS = ['activity', 'process', 'interview', 'todo'] as const;
export const CHECKLIST_MAX_ITEMS = 50;
export const CHECKLIST_TEXT_LIMIT = 240;
export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskKind = typeof TASK_KINDS[number];
export interface ChecklistItem { id: string; text: string; done: boolean; }
export interface TaskDraft {
  title: string;
  description: string;
  kind: TaskKind;
  status: TaskStatus;
  due_date: string | null;
  due_time: string | null;
  checklist: ChecklistItem[];
  cover_path: string | null;
}
export interface KanbanTask extends TaskDraft {
  id: string;
  version: number;
  created_at: string;
  position: number;
  archived_at: string | null;
}
export type DraftError = 'required' | 'descriptionLimit' | 'invalidDue' | 'timeNeedsDate' | 'invalidChecklist' | 'invalidCover';
export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some(status => status === value);
}
export function isTaskKind(value: unknown): value is TaskKind {
  return TASK_KINDS.some(kind => kind === value);
}
function validDueDate(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number(value.slice(0, 4)) > 0 && addDaysToIso(value, 0)?.padStart(10, '0') === value);
}
function validDueTime(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}
export function isChecklist(value: unknown): value is ChecklistItem[] {
  if (!Array.isArray(value) || value.length > CHECKLIST_MAX_ITEMS) return false;
  const ids = new Set<string>();
  return value.every((item: unknown) => {
    if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      || !('text' in item) || typeof item.text !== 'string' || !('done' in item) || typeof item.done !== 'boolean'
      || !item.text.trim() || item.text.trim().length > CHECKLIST_TEXT_LIMIT
      || Object.keys(item).some(key => !['id', 'text', 'done'].includes(key))) return false;
    const key = item.id.toLowerCase();
    if (ids.has(key)) return false;
    ids.add(key);
    return true;
  });
}
export function isCoverPath(value: unknown): value is string | null {
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  return value === null || (typeof value === 'string'
    && new RegExp(`^${uuid}/${uuid}/${uuid}\\.webp$`, 'i').test(value));
}
export function validateTaskDraft(draft: TaskDraft): DraftError | null {
  if (!draft.title.trim() || draft.title.trim().length > 160) return 'required';
  if (draft.description.trim().length > 4000) return 'descriptionLimit';
  if (!validDueDate(draft.due_date) || !validDueTime(draft.due_time)) return 'invalidDue';
  if (draft.due_time && !draft.due_date) return 'timeNeedsDate';
  if (!isChecklist(draft.checklist)) return 'invalidChecklist';
  if (!isCoverPath(draft.cover_path)) return 'invalidCover';
  return null;
}
export function isKanbanTask(value: unknown): value is KanbanTask {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value && typeof value.id === 'string'
    && 'title' in value && typeof value.title === 'string'
    && 'description' in value && typeof value.description === 'string'
    && 'kind' in value && isTaskKind(value.kind)
    && 'status' in value && isTaskStatus(value.status)
    && 'version' in value && typeof value.version === 'number' && Number.isInteger(value.version) && value.version > 0
    && 'created_at' in value && typeof value.created_at === 'string' && !Number.isNaN(Date.parse(value.created_at))
    && 'position' in value && typeof value.position === 'number' && Number.isInteger(value.position) && value.position >= 0
    && 'archived_at' in value && (value.archived_at === null
      || (typeof value.archived_at === 'string' && !Number.isNaN(Date.parse(value.archived_at))))
    && (value.archived_at === null || value.status === 'completed')
    && 'due_date' in value && validDueDate(value.due_date)
    && 'due_time' in value && validDueTime(value.due_time) && !(value.due_time && !value.due_date)
    && 'checklist' in value && isChecklist(value.checklist)
    && 'cover_path' in value && isCoverPath(value.cover_path)
    && (value.cover_path === null || (typeof value.cover_path === 'string'
      && value.cover_path.split('/')[1] === value.id));
}
export const EMPTY_DRAFT: TaskDraft = {
  title: '', description: '', kind: 'activity', status: 'pending', due_date: null, due_time: null, checklist: [], cover_path: null,
};
