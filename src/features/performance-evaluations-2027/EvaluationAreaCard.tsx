import { toNaturalCase } from '@/lib/utils';
import { kanbanCopy } from '@/features/kanban/copy';
import { KanbanStatusBadge } from '@/features/kanban/KanbanBadge';
import { getEvaluationStatusLabel } from './copy';
import type { Language } from '@/contexts/LanguageContext';
import type { EvaluationArea } from './types';
import type { TaskStatus } from '@/features/kanban/types';

interface EvaluationAreaCardProps {
  area: EvaluationArea;
  language: Language;
  copy: {
    responsible: string;
    status: string;
    progress: string;
    positions: string;
    position: string;
    category: string;
    completed: string;
    pending: string;
    of: string;
    positionCompleted: string;
    positionsCompleted: string;
  };
}

const STATUS_BADGE_STATE: Record<EvaluationArea['status'], TaskStatus> = {
  Pendiente: 'pending',
  'En proceso': 'in_progress',
  Entregado: 'completed',
  Revisado: 'completed',
};

export function EvaluationAreaCard({
  area,
  language,
  copy,
}: EvaluationAreaCardProps) {
  const completedPositions = area.positions.filter(
    ({ status }) => status === 'Entregado' || status === 'Revisado',
  ).length;
  const completionPercentage = new Intl.NumberFormat(
    language === 'en' ? 'en-US' : 'es-MX',
    { maximumFractionDigits: 1 },
  ).format((completedPositions / area.positions.length) * 100);
  const kanbanStatusCopy = kanbanCopy[language];
  const sortedPositions = [...area.positions].sort(
    (left, right) =>
      left.title.localeCompare(right.title, 'es-MX', { sensitivity: 'base' })
      || (left.category ?? '').localeCompare(
        right.category ?? '',
        'es-MX',
        { sensitivity: 'base' },
      ),
  );

  return (
    <article
      className="evaluation-area-card"
      aria-labelledby={`evaluation-area-${area.id}`}
    >
      <header className="evaluation-area-card__header">
        <h3 id={`evaluation-area-${area.id}`}>
          {toNaturalCase(area.name, { preserveAcronyms: false })}
        </h3>
        <KanbanStatusBadge
          status={STATUS_BADGE_STATE[area.status]}
          copy={kanbanStatusCopy}
          label={getEvaluationStatusLabel(area.status, language)}
        />
      </header>

      <div className="evaluation-area-card__summary">
        <dl className="evaluation-area-card__responsible">
          <div>
            <dt>{copy.responsible}</dt>
            <dd>
              <strong>
                {toNaturalCase(area.responsibleName, { preserveAcronyms: false })}
              </strong>
              <span>
                {toNaturalCase(area.responsibleTitle, { preserveAcronyms: false })}
              </span>
            </dd>
          </div>
        </dl>

        <div className="evaluation-area-card__progress">
          <div className="evaluation-area-card__progress-caption">
            <span>{copy.progress}</span>
            <span>
              {completedPositions} {copy.of} {area.positions.length}{' '}
              {area.positions.length === 1
                ? copy.positionCompleted
                : copy.positionsCompleted}
            </span>
          </div>
          <strong className="evaluation-area-card__progress-value">
            {completionPercentage}%
          </strong>
          <progress
            className="evaluation-area-card__progress-bar"
            value={completedPositions}
            max={area.positions.length}
            aria-label={`${copy.progress}: ${completionPercentage}%`}
          />
        </div>
      </div>

      <section
        className="evaluation-area-card__positions"
        aria-label={copy.positions}
      >
        <table
          className="data-table data-table--cards evaluation-area-card__positions-table"
        >
          <colgroup>
            <col className="evaluation-area-card__position-column" />
            <col className="evaluation-area-card__category-column" />
            <col className="evaluation-area-card__status-column" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{copy.position}</th>
              <th scope="col">{copy.category}</th>
              <th scope="col">{copy.status}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPositions.map((position) => {
              const completed =
                position.status === 'Entregado' || position.status === 'Revisado';

              return (
                <tr key={position.id}>
                  <td data-label={copy.position}>
                    {toNaturalCase(position.title)}
                  </td>
                  <td data-label={copy.category}>
                    {position.category ?? 'N/A'}
                  </td>
                  <td data-label={copy.status}>
                    <KanbanStatusBadge
                      status={completed ? 'completed' : 'pending'}
                      copy={kanbanStatusCopy}
                      label={completed ? copy.completed : copy.pending}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </article>
  );
}
