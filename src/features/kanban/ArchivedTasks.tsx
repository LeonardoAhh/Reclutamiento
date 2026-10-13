import { AnimatePresence, motion } from 'framer-motion';
import { ArchiveRestore } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { formatDateTimeMx, formatMetadataDate } from '@/lib/dates';
import { KanbanKindBadge } from './KanbanBadge';
import { KanbanCover } from './KanbanCover';
import type { KanbanTask } from './types';
import type { KanbanCopy } from './copy';

export function ArchivedTasks({ tasks, copy: t, disabled, onRestore }: {
  tasks: readonly KanbanTask[]; copy: KanbanCopy; disabled: boolean;
  onRestore: (task: KanbanTask) => Promise<boolean>;
}) {
  const { language } = useLanguage();
  const motionTokens = useMotionTokens('--transition-base');
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  return <ul className="kanban-archive">
    <AnimatePresence initial={false} mode="popLayout">
      {tasks.map(task => <motion.li key={task.id} layout={!motionTokens.reduce}
        initial={{ opacity: 0, y: motionTokens.distance }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -motionTokens.distance }} transition={motionTokens.transition}>
        <article className="kanban-task kanban-task--archived">
          <KanbanCover path={task.cover_path} copy={t} />
          <div className="kanban-task__content">
          <header className="kanban-task__header">
            <KanbanKindBadge kind={task.kind} copy={t} />
            {task.archived_at && <time dateTime={task.archived_at} className="kanban-task__created type-body-sm"
              aria-label={`${t.archivedOn}: ${formatDateTimeMx(task.archived_at, locale)}`}>
              {formatMetadataDate(task.archived_at, locale)}
            </time>}
          </header>
          <h3 className="kanban-task__title type-body-strong">{task.title}</h3>
          {task.description && <p className="kanban-task__description type-body-md">{task.description}</p>}
          <footer className="kanban-archive__footer">
            <button type="button" className="kanban-toolbar-button" disabled={disabled}
              aria-label={`${t.restore}: ${task.title}`} onClick={() => { void onRestore(task); }}>
              <ArchiveRestore size="var(--icon-size-md)" aria-hidden="true" />{t.restore}
            </button>
          </footer>
          </div>
        </article>
      </motion.li>)}
    </AnimatePresence>
  </ul>;
}
