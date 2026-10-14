import type { ReactNode } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { usePagination } from '@/hooks/usePagination';
import { KanbanStatusBadge } from './KanbanBadge';
import { KanbanTaskCard } from './KanbanTaskCard';
import type { KanbanTask, TaskStatus } from './types';
import type { KanbanCopy } from './copy';

interface DropColumnProps {
  status: TaskStatus;
  disabled: boolean;
  empty: boolean;
  pending: boolean;
  headingId: string;
  children: ReactNode;
}

function DropColumn({ status, disabled, empty, pending, headingId, children }: DropColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled });
  const { over } = useDndContext();
  const highlighted = isOver || over?.data.current?.status === status;
  return <section ref={setNodeRef} className="kanban-column" aria-labelledby={headingId}
    data-empty={empty || undefined} data-drag-over={highlighted || undefined}
    data-drop-pending={pending || undefined}>{children}</section>;
}

interface KanbanColumnProps {
  layout?: 'list' | 'grid';
  status: TaskStatus;
  tasks: KanbanTask[];
  copy: KanbanCopy;
  locked: boolean;
  dragging: boolean;
  pending: boolean;
  now: number;
  headingId: string;
  pageSize: number;
  headingRef: (node: HTMLHeadingElement | null) => void;
  editButtonRef: (taskId: string, node: HTMLButtonElement | null) => void;
  onEdit: (task: KanbanTask) => void;
}

export function KanbanColumn({ status, tasks, copy: t, locked, dragging, pending, now, headingId, pageSize,
  headingRef, editButtonRef, onEdit, layout = 'list' }: KanbanColumnProps) {
  const pagination = usePagination(tasks, pageSize);
  const motionTokens = useMotionTokens('--transition-spring');
  const rows = pagination.pageItems;
  const empty = rows.length === 0 && !dragging;
  const paged = pagination.totalPages > 1;

  return (
    <DropColumn status={status} disabled={locked} empty={empty} pending={pending} headingId={headingId}>
      <header className="kanban-column__header">
        <h3 id={headingId} className="type-body-strong" tabIndex={-1} ref={headingRef}>
          <KanbanStatusBadge status={status} copy={t} />
        </h3>
        <div className="kanban-column__header-actions">
          {paged && <nav className="kanban-column__pagination" aria-label={`${t.paginationFor} ${t.statuses[status]}`}>
            <button type="button" className="step-nav-control" onClick={pagination.prevPage}
              disabled={!pagination.canGoPrev} aria-label={t.previousPage}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <span className="kanban-column__page type-body-sm" aria-live="polite" aria-atomic="true">
              <span aria-hidden="true">{pagination.currentPage}/{pagination.totalPages}</span>
              <span className="sr-only">{t.page} {pagination.currentPage} {t.of} {pagination.totalPages}</span>
            </span>
            <button type="button" className="step-nav-control" onClick={pagination.nextPage}
              disabled={!pagination.canGoNext} aria-label={t.nextPage}>
              <ChevronRight aria-hidden="true" />
            </button>
          </nav>}
          <Badge className="kanban-column__count"><span className="sr-only">{t.total}: </span>{tasks.length}</Badge>
        </div>
      </header>
      <SortableContext items={rows.map(task => task.id)} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        <ul className={`kanban-column__list${layout === 'grid' ? ' kanban-column__list--grid' : ''}`}>
          {rows.length === 0 && dragging && <li className="kanban-column__empty type-body-md">{t.dropHere}</li>}
          <AnimatePresence initial={false}>
            {rows.map(task => (
              <motion.li key={task.id} className="kanban-column__item"
                initial={{ opacity: 0, y: motionTokens.distance }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTokens.transition}>
                <KanbanTaskCard task={task} copy={t} disabled={locked} now={now}
                  editButtonRef={node => editButtonRef(task.id, node)}
                  onEdit={() => onEdit(task)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DropColumn>
  );
}
