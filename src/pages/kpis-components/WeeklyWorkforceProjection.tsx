import type { WorkforceProjection as Projection } from '@/lib/workforceProjection';
import { formatPercentage } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import './WeeklyWorkforceProjection.css';

const CATEGORIES = [
  { key: 'plantilla', label: 'Plantilla' },
  { key: 'backup', label: 'Backup' },
  { key: 'starlite', label: 'Starlite' },
] as const;

interface Props {
  projection: Projection;
}

function CoveragePercentage({ value, unavailableLabel }: { value: number | null; unavailableLabel: string }) {
  if (value === null) {
    return <span className="type-body-md text-muted">{unavailableLabel}</span>;
  }
  return <span>{formatPercentage(value)}</span>;
}

export function WorkforceProjection({ projection }: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  return (
    <section className="workforce-projection" aria-label={t('Cobertura actual de plantilla')}>
      <header className="workforce-projection__header">
        <h2 className="type-body-strong text-ink">{t('Cobertura de plantilla')}</h2>
      </header>

      <div className="workforce-projection__cards" role="list">
        {CATEGORIES.map(({ key, label }) => {
          const current = projection.current[key];
          const hasVacancies = current.vacancies > 0;
          return (
            <div key={key} className="workforce-projection__card" role="listitem">
              <header className="workforce-projection__card-header">
                <h3 className="type-caption-up text-muted">{t(label)}</h3>
                {current.target > 0 && hasVacancies && (
                  <span className="workforce-projection__card-badge type-caption-up text-error">
                    {current.vacancies} {t(current.vacancies === 1 ? 'vacante' : 'vacantes')}
                  </span>
                )}
              </header>
              <div className="workforce-projection__card-body">
                <span className="type-body-strong text-ink">
                  <CoveragePercentage value={projection.current[key].percentage} unavailableLabel={t('No aplica')} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {projection.undatedEmployees > 0 && (
        <p className="workforce-projection__note type-body-md text-error">
          {projection.undatedEmployees} {t('registros sin fecha válida de ingreso no están incluidos.')}
        </p>
      )}
      {projection.ambiguousEmployees > 0 && (
        <p className="workforce-projection__note type-body-md text-error">
          {projection.ambiguousEmployees} {t('registros coinciden con varios puestos y no están incluidos. Revisa su área, sección y puesto.')}
        </p>
      )}
    </section>
  );
}
