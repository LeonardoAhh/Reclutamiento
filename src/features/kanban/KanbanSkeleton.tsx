import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { TASK_STATUSES } from './types';

export function KanbanSkeleton({ label }: { label: string }) {
  return (
    <LoadingSkeleton label={label} className="kanban-board">
      {TASK_STATUSES.map(status => (
        <div key={status} className="kanban-column" aria-hidden="true">
          <div className="kanban-column__header">
            <span className="loading-skeleton__bone kanban-skeleton__badge" />
            <span className="loading-skeleton__bone kanban-skeleton__count" />
          </div>
          <div className="kanban-column__list">
            <div className="kanban-task kanban-task--card">
              <div className="kanban-task__header">
                <span className="loading-skeleton__bone kanban-skeleton__badge" />
                <span className="loading-skeleton__bone kanban-skeleton__date" />
              </div>
              <div className="kanban-task__body">
                <span className="loading-skeleton__bone kanban-skeleton__title" />
                <span className="loading-skeleton__bone kanban-skeleton__text" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </LoadingSkeleton>
  );
}
