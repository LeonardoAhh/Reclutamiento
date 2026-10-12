export const KANBAN_PATH = '/kanban';
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export const TASK_KINDS = ['activity', 'process', 'interview', 'todo'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskKind = typeof TASK_KINDS[number];
export interface TaskDraft {
  title: string;
  description: string;
  kind: TaskKind;
  status: TaskStatus;
}
export interface KanbanTask extends TaskDraft {
  id: string;
  version: number;
  created_at: string;
}
export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some(status => status === value);
}
export function isTaskKind(value: unknown): value is TaskKind {
  return TASK_KINDS.some(kind => kind === value);
}
export function isKanbanTask(value: unknown): value is KanbanTask {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value && typeof value.id === 'string'
    && 'title' in value && typeof value.title === 'string'
    && 'description' in value && typeof value.description === 'string'
    && 'kind' in value && isTaskKind(value.kind)
    && 'status' in value && isTaskStatus(value.status)
    && 'version' in value && typeof value.version === 'number'
    && Number.isInteger(value.version) && value.version > 0
    && 'created_at' in value && typeof value.created_at === 'string'
    && !Number.isNaN(Date.parse(value.created_at));
}
export const EMPTY_DRAFT: TaskDraft = { title: '', description: '', kind: 'activity', status: 'pending' };
