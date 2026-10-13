import { ArchiveRestore } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateTimeMx, formatMetadataDate } from '@/lib/dates';
import { KanbanKindBadge } from './KanbanBadge';
import type { KanbanTask } from './types';
import type { KanbanCopy } from './copy';

export function ArchivedTasks({ tasks, copy: t, disabled, onRestore }: {
  tasks: readonly KanbanTask[]; copy: KanbanCopy; disabled: boolean;
  onRestore: (task: KanbanTask) => Promise<boolean>;
}) {
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  return <ul className="kanban-archive">
    {tasks.map(task => <li key={task.id}>
      <article className="kanban-task">
        <header className="kanban-task__header">
          <KanbanKindBadge kind={task.kind} copy={t} />
          {task.archived_at && <time dateTime={task.archived_at} className="kanban-task__created type-body-sm"
            aria-label={`${t.archivedOn}: ${formatDateTimeMx(task.archived_at, locale)}`}>
            {formatMetadataDate(task.archived_at, locale)}
          </time>}
        </header>
        <h3 className="type-body-strong">{task.title}</h3>
        {task.description && <p className="kanban-task__description type-body-md">{task.description}</p>}
        <button type="button" className="btn-ghost kanban-archive__restore" disabled={disabled}
          aria-label={`${t.restore}: ${task.title}`} onClick={() => { void onRestore(task); }}>
          <ArchiveRestore size="var(--icon-size-md)" aria-hidden="true" />{t.restore}
        </button>
      </article>
    </li>)}
  </ul>;
}
