import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, UsersRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RecruiterSummary } from './candidate-metrics/RecruiterSummary';
import { WeeklyMetrics } from './candidate-metrics/WeeklyMetrics';
import { useCandidateMetrics } from './candidate-metrics/useCandidateMetrics';
import { CANDIDATE_METRICS_PATH } from './candidate-metrics/navigation';
import './CandidateMetricsPage.css';

export function CandidateMetricsPage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [params] = useSearchParams();
  const selectedView = params.get('view');
  const recruiterId = params.get('recruiter') ?? '';
  const metrics = useCandidateMetrics(recruiterId);
  const recruiters = metrics.members.filter(member => member.include_in_metrics);
  const recruiter = recruiters.find(member => member.id === recruiterId);
  const view = selectedView === 'global' || selectedView === 'pauta' || (selectedView === 'recruiter' && recruiter)
    ? selectedView : null;
  const title = view === 'global' ? (en ? 'Recruiter summary' : 'Resumen de Reclutadores')
    : view === 'pauta' ? (en ? 'Campaign details' : 'Detalle Pauta')
    : (en ? 'Details for ' : 'Detalle ') + (recruiter?.short_name ?? '');
  const destination = (mode: string, id?: string) => {
    const query = new URLSearchParams({ view: mode });
    if (id) query.set('recruiter', id);
    return CANDIDATE_METRICS_PATH + '?' + query.toString();
  };

  useEffect(() => {
    if (!metrics.loading) headingRef.current?.focus({ preventScroll: true });
  }, [view, recruiterId, metrics.loading]);

  return (
    <main className="candidate-metrics container" aria-labelledby="candidate-metrics-title">
      <header className="page-header">
        <div className="page-header__content">
          <h1 ref={view ? undefined : headingRef} tabIndex={-1} id="candidate-metrics-title" className="app-page-title">
            <Link
              className="candidate-metrics__title-link"
              to={view ? CANDIDATE_METRICS_PATH : '/candidates'}
              aria-label={view
                ? (en ? 'Back to metrics: Metrics and KPIs' : 'Volver a métricas: Métricas y KPIs')
                : (en ? 'Back to candidates: Metrics and KPIs' : 'Volver a candidatos: Métricas y KPIs')}
            >
              {en ? 'Metrics and KPIs' : 'Métricas y KPIs'}
            </Link>
          </h1>
        </div>
      </header>
      {metrics.loading && <p role="status">{en ? 'Loading metrics…' : 'Cargando métricas…'}</p>}
      {metrics.error && <div className="candidate-metrics__error">
        <p role="alert">{en ? 'Could not load candidate metrics.' : 'No se pudieron cargar las métricas de candidatos.'}</p>
        <button type="button" className="btn-secondary" onClick={() => void metrics.refetch()}>{en ? 'Retry' : 'Reintentar'}</button>
      </div>}
      {!metrics.loading && (!metrics.error || metrics.candidateCount > 0) && (
        view ? <section className="candidate-metrics__section" aria-labelledby="candidate-metrics-detail">
          <h2 ref={headingRef} tabIndex={-1} id="candidate-metrics-detail" className="candidate-metrics__heading">{title}</h2>
          {view === 'global' ? <RecruiterSummary recruiterStats={metrics.recruiterStats} />
            : <WeeklyMetrics key={view === 'recruiter' ? recruiterId : view} stats={view === 'pauta' ? metrics.pautaStats : metrics.individualStats} />}
        </section> : <div className="candidate-metrics__menu">
          <Link to={destination('global')} className="candidate-metrics__link">
            <UsersRound size="var(--icon-size-lg)" aria-hidden="true" />
            <span className="candidate-metrics__link-body">
              <span>{en ? 'Overall summary' : 'Resumen General'}</span>
              <span className="candidate-metrics__hint">{metrics.scheduledCount} {en ? 'scheduled' : 'citados'}</span>
            </span>
            <ArrowUpRight size="var(--icon-size-sm)" aria-hidden="true" />
          </Link>
          <section className="candidate-metrics__section" aria-labelledby="candidate-metrics-weekly">
            <h2 id="candidate-metrics-weekly" className="candidate-metrics__heading">{en ? 'Weekly tracking' : 'Seguimiento semanal'}</h2>
            <Link to={destination('pauta')} className="candidate-metrics__link">
              <span>{en ? 'Campaign' : 'Pauta'}</span><ArrowUpRight size="var(--icon-size-sm)" aria-hidden="true" />
            </Link>
          </section>
          <section className="candidate-metrics__section" aria-labelledby="candidate-metrics-recruiters">
            <h2 id="candidate-metrics-recruiters" className="candidate-metrics__heading">{en ? 'By recruiter' : 'Por reclutador'}</h2>
            <div className="candidate-metrics__recruiters">
              {recruiters.map(member => <Link key={member.id} to={destination('recruiter', member.id)} className="candidate-metrics__link">
                <span>{member.short_name}{!member.active && (en ? ' (inactive)' : ' (inactivo)')}</span>
                <ArrowUpRight size="var(--icon-size-sm)" aria-hidden="true" />
              </Link>)}
            </div>
            {recruiters.length === 0 && <p role="status">{en ? 'No recruiters available.' : 'No hay reclutadores disponibles.'}</p>}
          </section>
          {metrics.candidateCount === 0 && <p role="status">{en ? 'No candidates yet.' : 'Aún no hay candidatos.'}</p>}
        </div>
      )}
    </main>
  );
}
