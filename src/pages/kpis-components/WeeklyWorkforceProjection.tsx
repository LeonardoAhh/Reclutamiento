import type { WorkforceProjection as Projection } from '@/lib/workforceProjection';
import { formatProjectionDate } from '@/lib/dates';
import './WeeklyWorkforceProjection.css';

const CATEGORIES = [
  { key: 'plantilla', label: 'Plantilla' },
  { key: 'backup', label: 'Backup' },
  { key: 'starlite', label: 'Starlite' },
] as const;

interface Props {
  projection: Projection;
  todayIso: string;
}

function CoveragePercentage({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="type-caption-sm text-muted">No aplica</span>;
  }
  const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return <span>{displayValue}%</span>;
}

export function WorkforceProjection({ projection, todayIso }: Props) {
  return (
    <section className="workforce-projection" aria-label="Cobertura actual y proyección al próximo ingreso">
      <header className="workforce-projection__header">
        <h2 className="type-body-strong text-ink">Cobertura de plantilla</h2>
        {projection.nextHireDate && (
          <span className="type-caption-sm text-muted">
            Próximo ingreso: <time dateTime={projection.nextHireDate}>{formatProjectionDate(projection.nextHireDate)}</time>
          </span>
        )}
      </header>

      <div className="workforce-projection__cards" role="list">
        {CATEGORIES.map(({ key, label }) => {
          const hasVacancies = projection.withAllProximos[key].vacancies > 0;
          const target = projection.withAllProximos[key].target;
          const vacantes = projection.withAllProximos[key].vacancies;
          return (
            <div key={key} className="workforce-projection__card" role="listitem">
              <header className="workforce-projection__card-header">
                <h3 className="type-caption-up text-muted">{label}</h3>
                {target > 0 && hasVacancies && (
                  <span className="workforce-projection__card-badge type-caption-xs text-error">
                    {vacantes} {vacantes === 1 ? 'vacante' : 'vacantes'}
                  </span>
                )}
              </header>
              <div className="workforce-projection__card-body">
                <span className="type-heading-md text-ink">
                  <CoveragePercentage value={projection.current[key].percentage} />
                </span>
                {projection.nextHireDate && (
                  <span className="type-caption-sm text-muted">
                    Próx. ingreso: <CoveragePercentage value={projection.projected[key].percentage} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="workforce-projection__summary type-caption-sm text-muted">
        {projection.scheduledHires === 0
          ? 'Sin ingresos previstos'
          : `+${projection.scheduledHires} ${projection.scheduledHires === 1 ? 'ingreso previsto' : 'ingresos previstos'}`}
      </p>

      <details className="workforce-projection__details">
        <summary className="workforce-projection__details-summary type-caption-sm text-muted">
          Ver desglose
        </summary>
        <div className="workforce-projection__breakdown" role="list">
          {CATEGORIES.map(({ key, label }) => {
            const current = projection.current[key];
            const withAll = projection.withAllProximos[key];
            const projected = projection.projected[key];
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
                      &nbsp;/ {current.target}
                    </span>
                  </span>
                  {withAll.vacancies > 0 && (
                    <span className="workforce-projection__breakdown-vacancy type-caption-sm text-error" aria-label={`${withAll.vacancies} vacante${withAll.vacancies === 1 ? '' : 's'}`}>
                      −{withAll.vacancies}
                    </span>
                  )}
                </div>
                {projection.nextHireDate && projected.covered !== current.covered && (
                  <span className="type-caption-xs text-muted">
                    Próx. ingreso: {projected.covered} / {projected.target}
                  </span>
                )}
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
