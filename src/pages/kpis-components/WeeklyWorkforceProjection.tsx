import type { WorkforceProjection as Projection } from '@/lib/workforceProjection';
import { formatPercentage } from '@/lib/utils';
import './WeeklyWorkforceProjection.css';

const CATEGORIES = [
  { key: 'plantilla', label: 'Plantilla' },
  { key: 'backup', label: 'Backup' },
  { key: 'starlite', label: 'Starlite' },
] as const;

interface Props {
  projection: Projection;
}

function CoveragePercentage({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="type-caption-sm text-muted">No aplica</span>;
  }
  return <span>{formatPercentage(value)}</span>;
}

export function WorkforceProjection({ projection }: Props) {
  return (
    <section className="workforce-projection" aria-label="Cobertura actual de plantilla">
      <header className="workforce-projection__header">
        <h2 className="type-body-strong text-ink">Cobertura de plantilla</h2>
      </header>

      <div className="workforce-projection__cards" role="list">
        {CATEGORIES.map(({ key, label }) => {
          const current = projection.current[key];
          const hasVacancies = current.vacancies > 0;
          return (
            <div key={key} className="workforce-projection__card" role="listitem">
              <header className="workforce-projection__card-header">
                <h3 className="type-caption-up text-muted">{label}</h3>
                {current.target > 0 && hasVacancies && (
                  <span className="workforce-projection__card-badge type-caption-xs text-error">
                    {current.vacancies} {current.vacancies === 1 ? 'vacante' : 'vacantes'}
                  </span>
                )}
              </header>
              <div className="workforce-projection__card-body">
                <span className="type-heading-md text-ink">
                  <CoveragePercentage value={projection.current[key].percentage} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <details className="workforce-projection__details">
        <summary className="workforce-projection__details-summary type-caption-sm text-muted">
          Ver desglose
        </summary>
        <div className="workforce-projection__breakdown" role="list">
          {CATEGORIES.map(({ key, label }) => {
            const current = projection.current[key];
            return (
              <div key={key} className="workforce-projection__breakdown-card" role="listitem">
                <span className="workforce-projection__breakdown-label type-caption-up text-muted">
                  {label === 'Plantilla' ? 'Plantilla autorizada' : label}
                </span>
                <div className="workforce-projection__breakdown-row">
                  <span className="workforce-projection__breakdown-stat">
                    <span className="workforce-projection__breakdown-value type-body-strong text-ink">
                      {current.covered}
                    </span>
                    <span className="type-caption-xs text-muted">
                      &nbsp;de {current.target} puestos cubiertos
                    </span>
                  </span>
                  {current.vacancies > 0 && (
                    <span className="workforce-projection__breakdown-vacancy type-caption-sm text-error" aria-label={`${current.vacancies} vacante${current.vacancies === 1 ? '' : 's'}`}>
                      −{current.vacancies}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </details>
      {projection.undatedEmployees > 0 && (
        <p className="workforce-projection__note type-caption-sm text-error">
          {projection.undatedEmployees} registros sin fecha válida de ingreso no están incluidos.
        </p>
      )}
      {projection.ambiguousEmployees > 0 && (
        <p className="workforce-projection__note type-caption-sm text-error">
          {projection.ambiguousEmployees} registros coinciden con varios puestos y no están incluidos. Revisa su área, sección y puesto.
        </p>
      )}
    </section>
  );
}
