import { endOfDayMxMs, localDateTimeToIso } from '@/lib/dates';
import type { KanbanTask } from './types';

export function sortKanbanTasks(tasks: readonly KanbanTask[], archived = false) {
  return [...tasks].sort((a, b) => archived
    ? (b.archived_at ?? '').localeCompare(a.archived_at ?? '') || b.id.localeCompare(a.id)
    : a.position - b.position || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}
export function isTaskOverdue(task: KanbanTask, now: number) {
  if (!task.due_date || task.status === 'completed' || task.archived_at) return false;
  const instant = task.due_time ? localDateTimeToIso(task.due_date, task.due_time) : null;
  const deadline = task.due_time ? (instant ? Date.parse(instant) : null) : endOfDayMxMs(task.due_date);
  return deadline !== null && now > deadline;
}
