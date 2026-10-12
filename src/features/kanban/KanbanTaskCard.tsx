import { useId } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateTimeMx, formatMetadataDate } from '@/lib/dates';
import { KanbanKindBadge } from './KanbanBadge';
import type { KanbanTask } from './types';
import type { KanbanCopy } from './copy';

interface KanbanTaskCardProps {
  task: KanbanTask;
  copy: KanbanCopy;
  disabled: boolean;
  onEdit: () => void;
  editButtonRef: (node: HTMLButtonElement | null) => void;
}
export function KanbanTaskCard({ task, copy: t, disabled, onEdit, editButtonRef }: KanbanTaskCardProps) {
  const id = useId();
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: task.id, data: { status: task.status }, disabled,
  });
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes;
  return (
    <article ref={setNodeRef} className="kanban-task kanban-task--card" aria-labelledby={id}
      data-dragging={isDragging || undefined} style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}>
      <button ref={node => { setActivatorNodeRef(node); editButtonRef(node); }}
        type="button" className="kanban-task__open" {...dragAttributes} {...listeners} disabled={disabled}
        aria-label={`${t.edit}: ${task.title}`} onClick={onEdit} />
      <header className="kanban-task__header">
        <KanbanKindBadge kind={task.kind} copy={t} />
        <time dateTime={task.created_at} className="kanban-task__created type-body-sm"
          aria-label={`${t.createdAt}: ${formatDateTimeMx(task.created_at, locale)}`}>
          {formatMetadataDate(task.created_at, locale)}
        </time>
      </header>
      <div className="kanban-task__body">
        <h4 id={id} className="type-body-strong">{task.title}</h4>
        {task.description && <p className="kanban-task__description type-body-md">{task.description}</p>}
      </div>
    </article>
  );
}
