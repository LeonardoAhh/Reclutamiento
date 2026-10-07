import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useReporteDiario, type ReporteDiarioSummary } from '@/hooks/useReporteDiario';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import { ReportComparisonContent } from '@/components/reporte-diario/ReportComparisonContent';

export function ReportComparisonPage() {
  const { copy } = useReportLocale();
  const { fetchSummaries, loading, error } = useReporteDiario();
  const [summaries, setSummaries] = useState<ReporteDiarioSummary[] | null>(null);
  const [revision, setRevision] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    void fetchSummaries().then(data => { if (active) setSummaries(data); });
    return () => { active = false; };
  }, [fetchSummaries, revision]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <main className="report-comparison-page container" aria-labelledby="report-comparison-title">
      <header className="page-header">
        <div className="page-header__content">
          <h1 ref={headingRef} tabIndex={-1} id="report-comparison-title" className="app-page-title">
            <Link to="/reports" className="report-comparison-page__title-link" aria-label={copy('Comparativa mensual: volver a Reporte diario', 'Monthly comparison: back to Daily report')}>
              {copy('Comparativa mensual', 'Monthly comparison')}
            </Link>
          </h1>
        </div>
      </header>
      {loading || summaries === null ? (
        <LoadingSkeleton label={copy('Cargando comparativa…', 'Loading comparison…')} className="reporte-cmp__body">
          <div aria-hidden="true" className="report-comparison-skeleton">
            <span className="loading-skeleton__bone report-comparison-skeleton__heading" />
            <div className="reporte-cmp__quarters">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="reporte-cmp__quarter">
                  <span className="loading-skeleton__bone report-comparison-skeleton__line" />
                  <span className="loading-skeleton__bone report-comparison-skeleton__heading" />
                </div>
              ))}
            </div>
            <span className="loading-skeleton__bone report-comparison-skeleton__heading" />
            {Array.from({ length: 5 }, (_, index) => <span key={index} className="loading-skeleton__bone report-comparison-skeleton__row" />)}
          </div>
        </LoadingSkeleton>
      )
        : error ? <div>
          <p className="form-error-text" role="alert">{copy('No se pudieron cargar los reportes guardados.', 'Could not load saved reports.')}</p>
          <button type="button" className="btn-secondary" onClick={() => setRevision(value => value + 1)}>{copy('Reintentar', 'Retry')}</button>
        </div>
        : summaries.length < 2 ? <p role="status">{copy('Guarda al menos dos reportes mensuales para compararlos.', 'Save at least two monthly reports to compare them.')}</p>
        : <ReportComparisonContent summaries={summaries} />}
    </main>
  );
}
