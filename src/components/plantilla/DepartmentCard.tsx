import { useId } from 'react';
import { HeartPulse } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPercentage } from '@/lib/utils';
import { summarizeOperationalCoverage } from '@/lib/workforceProjection';
import type { WorkforceProjection } from '@/lib/workforceProjection';

interface DepartmentCardProps {
  area: string;
  projection: WorkforceProjection | undefined;
  onOpen: () => void;
  incapacidadCount: number;
}

export function DepartmentCard({ area, projection, onOpen, incapacidadCount }: DepartmentCardProps) {
  const coverageId = useId();
  const current = projection ? summarizeOperationalCoverage(projection.current) : null;
  const future = projection ? summarizeOperationalCoverage(projection.withAllProximos) : null;
  const percentage = current?.percentage ?? null;

  return (
    <article className={`dept-card${future && future.vacancies > 0 ? ' dept-card--alert' : ''}`} data-area={area}>
      <button
        className="dept-card__button"
        onClick={onOpen}
        aria-label={`Ver detalle de ${area}`}
        aria-describedby={coverageId}
        type="button"
      >
        <div className="dept-card__header">
          <div className="dept-card__header-left">
            <h2 className="dept-card__title">{area}</h2>
            {incapacidadCount > 0 && (
              <Badge variant="amber" title={`${incapacidadCount} incapacidades`}>
                <HeartPulse aria-hidden="true" className="dept-card__status-icon" />
                {incapacidadCount}
              </Badge>
            )}
          </div>
        </div>
        <div id={coverageId} className="dept-card__body dept-card__coverage">
          <div className="dept-card__coverage-heading type-body-sm">
            <span>Cobertura actual</span>
            <strong className="type-body-sm-strong">
              {!current ? 'No disponible' : percentage === null ? 'No aplica' : formatPercentage(percentage)}
            </strong>
          </div>
          {percentage !== null && (
            <progress
              className={`dept-card__coverage-bar${percentage === 100 ? ' dept-card__coverage-bar--complete' : ''}`}
              value={percentage}
              max={100}
              aria-label={`Cobertura actual de ${area}`}
              aria-valuetext={formatPercentage(percentage)}
            />
          )}
          {current && current.target > 0 && (
            <span className="dept-card__coverage-note type-caption-sm">
              {current.covered} de {current.target} puestos cubiertos
            </span>
          )}
          {projection && projection.current.surplus > 0 && (
            <span className="dept-card__coverage-note type-caption-sm">
              {projection.current.surplus} {projection.current.surplus === 1 ? 'excedente' : 'excedentes'} fuera de cobertura
            </span>
          )}
          {projection && (projection.undatedEmployees > 0 || projection.ambiguousEmployees > 0) && (
            <span className="dept-card__coverage-note type-caption-sm">
              Sin incluir: {projection.undatedEmployees} sin fecha válida; {projection.ambiguousEmployees} con puesto ambiguo.
            </span>
          )}
        </div>
      </button>
    </article>
  );
}
