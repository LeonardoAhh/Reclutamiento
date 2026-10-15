import { useId } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CalendarClock } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateTimeMx, formatMetadataDate, localDateToIso } from '@/lib/dates';
import { KanbanKindBadge, KanbanStatusBadge } from './KanbanBadge';
import { KanbanCover } from './KanbanCover';
import { isTaskOverdue } from './presentation';
import type { KanbanTask } from './types';
import type { KanbanCopy } from './copy';

interface KanbanTaskCardProps {
  task: KanbanTask;
  copy: KanbanCopy;
  disabled: boolean;
  now: number;
  onEdit: () => void;
  editButtonRef: (node: HTMLButtonElement | null) => void;
  layout?: 'card' | 'list';
}
export function KanbanTaskCard({ task, copy: t, disabled, now, onEdit, editButtonRef, layout = 'card' }: KanbanTaskCardProps) {
  const id = useId();
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging, isOver } = useSortable({
    id: task.id, data: { status: task.status }, disabled,
  });
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes;
  const overdue = isTaskOverdue(task, now);
  const completed = task.checklist.filter(step => step.done).length;
  return (
    <article ref={setNodeRef} className={`kanban-task kanban-task--card${layout === 'list' ? ' kanban-task--list' : ''}`} aria-labelledby={id}
      data-dragging={isDragging || undefined} data-drag-over={isOver && !isDragging || undefined}
      style={transform ? { transform: CSS.Transform.toString(transform) } : undefined}>
      <button ref={node => { setActivatorNodeRef(node); editButtonRef(node); }}
        type="button" className="kanban-task__open" {...dragAttributes} {...listeners} disabled={disabled}
        aria-label={`${t.view}: ${task.title}`} onClick={onEdit} />
      <KanbanCover path={task.cover_path} copy={t} />
      <div className="kanban-task__content">
      <header className="kanban-task__header">
        <KanbanKindBadge kind={task.kind} copy={t} />
        {layout === 'list' && <KanbanStatusBadge status={task.status} copy={t} />}
        <time dateTime={task.created_at} className="kanban-task__created type-body-sm"
          aria-label={`${t.createdAt}: ${formatDateTimeMx(task.created_at, locale)}`}>
          {formatMetadataDate(task.created_at, locale)}
        </time>
      </header>
      <div className="kanban-task__body">
        <h4 id={id} className="kanban-task__title type-body-strong">{task.title}</h4>
        {task.description && <p className="kanban-task__description type-body-md">{task.description}</p>}
      </div>
      {(task.due_date || task.checklist.length > 0) && <footer className="kanban-task__metadata type-body-sm">
        {task.due_date && <span className="kanban-task__meta" data-overdue={overdue || undefined}>
          <CalendarClock size="var(--icon-size-sm)" aria-hidden="true" />
          <time aria-label={t.dueDate + ': ' + task.due_date + (task.due_time ? ' ' + task.due_time : '')} dateTime={task.due_date + (task.due_time ? `T${task.due_time}` : '')}>
            {formatMetadataDate(localDateToIso(task.due_date) ?? '', locale)}{task.due_time ? ` · ${task.due_time}` : ''}
          </time>
          {overdue && <span>{t.overdue}</span>}
        </span>}
        {task.checklist.length > 0 && <div className="kanban-task__progress">
          <progress className="kanban-task__progress-bar" value={completed} max={task.checklist.length} aria-label={t.progress} />
          <div className="kanban-task__progress-caption">
            <span>{t.checklist}</span><span>{completed}/{task.checklist.length}</span>
          </div>
        </div>}
      </footer>}
      </div>
    </article>
  );
}
