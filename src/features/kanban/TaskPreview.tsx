import { Circle, CircleCheck, CalendarClock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateTimeMx, formatMetadataDate, localDateToIso } from '@/lib/dates';
import { KanbanKindBadge, KanbanStatusBadge } from './KanbanBadge';
import { KanbanCoverView } from './KanbanCover';
import { useKanbanCover } from './useKanbanCover';
import type { KanbanTask } from './types';
import type { KanbanCopy } from './copy';

export function TaskPreview({ task, copy: t, cover }: {
  task: KanbanTask;
  copy: KanbanCopy;
  cover: ReturnType<typeof useKanbanCover>;
}) {
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const completed = task.checklist.filter(item => item.done).length;
  const dueDate = task.due_date ? formatMetadataDate(localDateToIso(task.due_date) ?? '', locale) : null;

  return <div className="kanban-task-preview type-body-md">
    <KanbanCoverView path={task.cover_path} copy={t} cover={cover} variant="detail" />
    <div className="kanban-task-preview__meta">
      <KanbanKindBadge kind={task.kind} copy={t} />
      <KanbanStatusBadge status={task.status} copy={t} />
    </div>
    {task.description && <p className="kanban-task-preview__description">{task.description}</p>}
    <div className="kanban-task-preview__dates">
      <div>
        <span className="type-body-sm kanban-task-preview__label">{t.createdAt}</span>
        <time dateTime={task.created_at}>{formatDateTimeMx(task.created_at, locale)}</time>
      </div>
      {task.due_date && <div>
        <span className="type-body-sm kanban-task-preview__label">{t.dueDate}</span>
        <span className="kanban-task-preview__due">
          <CalendarClock size="var(--icon-size-sm)" aria-hidden="true" />
          <time dateTime={task.due_date + (task.due_time ? `T${task.due_time}` : '')}>
            {dueDate}{task.due_time ? ` · ${task.due_time}` : ''}
          </time>
        </span>
      </div>}
    </div>
    {task.checklist.length > 0 && <section className="kanban-task-preview__checklist">
      <h3 className="kanban-task-preview__checklist-heading type-body-strong">
        <span>{t.checklist}</span>
        <span className="type-body-sm">
          <span className="sr-only">{t.progress}: </span>
          {completed}/{task.checklist.length}
        </span>
      </h3>
      <ul>
        {task.checklist.map(item => <li key={item.id} data-completed={item.done || undefined}>
          {item.done
            ? <CircleCheck size="var(--icon-size-md)" aria-hidden="true" />
            : <Circle size="var(--icon-size-md)" aria-hidden="true" />}
          <span className="sr-only">{item.done ? t.statuses.completed : t.statuses.pending}: </span>
          <span>{item.text}</span>
        </li>)}
      </ul>
    </section>}
  </div>;
}
