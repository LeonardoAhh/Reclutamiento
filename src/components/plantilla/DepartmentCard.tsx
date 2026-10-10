import { useId } from 'react';
import { HeartPulse } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPercentage } from '@/lib/utils';
import { summarizeOperationalCoverage } from '@/lib/workforceProjection';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import type { WorkforceProjection } from '@/lib/workforceProjection';

interface DepartmentCardProps {
  area: string;
  projection: WorkforceProjection | undefined;
  onOpen: () => void;
  incapacidadCount: number;
}

export function DepartmentCard({ area, projection, onOpen, incapacidadCount }: DepartmentCardProps) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const coverageId = useId();
  const current = projection ? summarizeOperationalCoverage(projection.current) : null;
  const future = projection ? summarizeOperationalCoverage(projection.withAllProximos) : null;
  const percentage = current?.percentage ?? null;

  return (
    <article className={`dept-card${future && future.vacancies > 0 ? ' dept-card--alert' : ''}`} data-area={area}>
      <button
        className="dept-card__button"
        onClick={onOpen}
        aria-label={`${t('Ver detalle de')} ${area}`}
        aria-describedby={coverageId}
        type="button"
      >
        <div className="dept-card__header">
          <div className="dept-card__header-left">
            <h2 className="dept-card__title">{area}</h2>
            {incapacidadCount > 0 && (
              <Badge variant="amber" title={`${incapacidadCount} ${t('incapacidades')}`}>
                <HeartPulse aria-hidden="true" className="dept-card__status-icon" />
                {incapacidadCount}
              </Badge>
            )}
          </div>
        </div>
        <div id={coverageId} className="dept-card__body dept-card__coverage">
          <div className="dept-card__coverage-heading type-body-md">
            <span>{t('Cobertura actual')}</span>
            <strong className="type-body-strong">
              {!current ? t('No disponible') : percentage === null ? t('No aplica') : formatPercentage(percentage)}
            </strong>
          </div>
          {percentage !== null && (
            <progress
              className={`dept-card__coverage-bar${percentage === 100 ? ' dept-card__coverage-bar--complete' : ''}`}
              value={percentage}
              max={100}
              aria-label={`${t('Cobertura actual')} ${area}`}
              aria-valuetext={formatPercentage(percentage)}
            />
          )}
          {current && current.target > 0 && (
            <span className="dept-card__coverage-note type-body-md">
              {current.covered} {language === 'en' ? 'of' : 'de'} {current.target} {t('puestos cubiertos')}
            </span>
          )}
          {projection && (projection.undatedEmployees > 0 || projection.ambiguousEmployees > 0) && (
            <span className="dept-card__coverage-note type-body-md">
              {t('Sin incluir:')} {projection.undatedEmployees} {t('sin fecha válida')}; {projection.ambiguousEmployees} {t('con puesto ambiguo.')}
            </span>
          )}
        </div>
      </button>
    </article>
  );
}
