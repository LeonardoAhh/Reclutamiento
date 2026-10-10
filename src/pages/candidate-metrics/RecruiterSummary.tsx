import type { CSSProperties } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ReclutadorBadge } from '@/components/ui/Badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { RecruiterStats } from './useCandidateMetrics';

export function RecruiterSummary({ recruiterStats }: { recruiterStats: RecruiterStats[] }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const isMobile = useIsMobile();
  return (
          <div className="recruiter-metrics__grid">
            {recruiterStats.map((r) => {
              const pct = (n: number) =>
                r.total === 0 ? 0 : Math.round((n / r.total) * 100);
              
              const efectividadAsistencia = r.total === 0 ? 0 : Math.round(((r.total - r.no_asistio) / r.total) * 100);

              return (
                <article key={r.name} className="recruiter-metrics__card">
                  <header className="recruiter-metrics__card-head">
                    <div className="recruiter-metrics__card-meta">
                      <h3 className="recruiter-metrics__card-name">
                        <ReclutadorBadge nombre={r.name} showRole className="recruiter-metrics__name-badge" />
                      </h3>
                      <div className="recruiter-metrics__card-totals">
                        <span className="recruiter-metrics__card-total">
                          {r.total} {en ? (r.total === 1 ? 'candidate' : 'candidates') : `candidato${r.total === 1 ? '' : 's'}`}
                        </span>
                        <span className="recruiter-metrics__card-efectividad">
                          {efectividadAsistencia}% {en ? 'Effectiveness' : 'Efectividad'}
                        </span>
                      </div>
                    </div>
                  </header>

                  <div className="recruiter-metrics__card-stats">
                    <div className="recruiter-metrics__stat recruiter-metrics__stat--citados">
                      <span className="recruiter-metrics__stat-value">{pct(r.citados)}%</span>
                      <span className="recruiter-metrics__stat-label">{en ? 'Scheduled' : 'Citados'}</span>
                      <span className="recruiter-metrics__stat-count">({r.citados})</span>
                    </div>
                    <div className="recruiter-metrics__stat recruiter-metrics__stat--contratados">
                      <span className="recruiter-metrics__stat-value">{pct(r.contratados)}%</span>
                      <span className="recruiter-metrics__stat-label">{en ? 'Hired' : 'Contratados'}</span>
                      <span className="recruiter-metrics__stat-count">({r.contratados})</span>
                    </div>
                    {!isMobile && (
                      <>
                        <div className="recruiter-metrics__stat recruiter-metrics__stat--rechazados">
                          <span className="recruiter-metrics__stat-value">{pct(r.rechazados)}%</span>
                          <span className="recruiter-metrics__stat-label">{en ? 'Rejected' : 'Rechazados'}</span>
                          <span className="recruiter-metrics__stat-count">({r.rechazados})</span>
                        </div>
                        <div className="recruiter-metrics__stat recruiter-metrics__stat--no-asistio">
                          <span className="recruiter-metrics__stat-value">{pct(r.no_asistio)}%</span>
                          <span className="recruiter-metrics__stat-label">{en ? 'Did not attend' : 'No Asistió'}</span>
                          <span className="recruiter-metrics__stat-count">({r.no_asistio})</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isMobile && (
                    <div className="recruiter-metrics__card-bar" aria-hidden="true">
                      <div
                        className="recruiter-metrics__card-bar-segment recruiter-metrics__card-bar-segment--contratados"
                        style={{ '--bar-width': `${pct(r.contratados)}%` } as CSSProperties}
                      />
                      <div
                        className="recruiter-metrics__card-bar-segment recruiter-metrics__card-bar-segment--citados"
                        style={{ '--bar-width': `${pct(r.citados)}%` } as CSSProperties}
                      />
                      <div
                        className="recruiter-metrics__card-bar-segment recruiter-metrics__card-bar-segment--rechazados"
                        style={{ '--bar-width': `${pct(r.rechazados)}%` } as CSSProperties}
                      />
                      <div
                        className="recruiter-metrics__card-bar-segment recruiter-metrics__card-bar-segment--no-asistio"
                        style={{ '--bar-width': `${pct(r.no_asistio)}%` } as CSSProperties}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
  );
}
