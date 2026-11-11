import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { Language } from '@/contexts/LanguageContext';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { useAuth } from '@/hooks/useAuth';
import { loadTeamMonthlyProgress, type TeamMonthlyProgressData } from './loadRecruiterMonthlyProgress';
import './RecognitionIndicators.css';

interface AdminRecruiterIndicatorsProps {
  open: boolean;
  language: Language;
  refreshKey: number;
}

type LoadResult = { key: string; state: 'loaded'; data: TeamMonthlyProgressData } | { key: string; state: 'error' };

export function AdminRecruiterIndicators({ open, language, refreshKey }: AdminRecruiterIndicatorsProps) {
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [retry, setRetry] = useState(0);
  const adminId = profile?.role === 'admin' ? profile.id : null;
  const requestKey = `${adminId ?? ''}:${refreshKey}:${retry}`;
  const currentResult = result?.key === requestKey ? result : null;
  const english = language === 'en';

  useEffect(() => {
    if (!open || !adminId) return;
    const controller = new AbortController();
    void loadTeamMonthlyProgress(members, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, state: 'loaded', data });
      },
      (cause: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('No se pudieron cargar los indicadores de reclutadores.', cause);
          setResult({ key: requestKey, state: 'error' });
        }
      },
    );
    return () => controller.abort();
  }, [adminId, members, open, requestKey]);

  if (!open || !adminId) return null;
  if (!currentResult) {
    return (
      <LoadingSkeleton
        className="admin-recruiter-indicators"
        label={english ? 'Loading recruiter indicators' : 'Cargando indicadores de reclutadores'}
      >
        <span className="loading-skeleton__bone admin-recruiter-indicators__loading-line" />
        <span className="loading-skeleton__bone admin-recruiter-indicators__loading-line" />
      </LoadingSkeleton>
    );
  }
  if (currentResult.state === 'error') {
    return (
      <section
        className="admin-recruiter-indicators"
        aria-label={english ? 'Recruiter indicators' : 'Indicadores de reclutadores'}
      >
        <p>{english ? 'Could not load recruiter indicators.' : 'No se pudieron cargar los indicadores.'}</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setRetry((value) => value + 1)}>
          {english ? 'Retry' : 'Reintentar'}
        </button>
      </section>
    );
  }

  const { recruiters, monthlyGoal } = currentResult.data;
  return (
    <section className="admin-recruiter-indicators" aria-labelledby="admin-recruiter-indicators-title">
      <h3 id="admin-recruiter-indicators-title">{english ? 'Monthly hires' : 'Ingresos del mes'}</h3>
      {recruiters.length === 0 ? (
        <p>{english ? 'No active recruiters.' : 'No hay reclutadores activos.'}</p>
      ) : (
        <ul className="admin-recruiter-indicators__list">
          {recruiters.map((recruiter) => (
            <li className="admin-recruiter-indicators__item" key={recruiter.id}>
              <span className="admin-recruiter-indicators__name">{recruiter.name}</span>
              <span className="admin-recruiter-indicators__progress">
                <progress
                  className="sr-only"
                  value={Math.min(recruiter.total, Math.max(monthlyGoal, 1))}
                  max={Math.max(monthlyGoal, 1)}
                  aria-label={
                    english
                      ? `${recruiter.name}: ${recruiter.total} of ${monthlyGoal} monthly hires`
                      : `${recruiter.name}: ${recruiter.total} de ${monthlyGoal} ingresos de la meta mensual`
                  }
                />
                <span
                  className={`recognition-progress__track${recruiter.total === 0 ? ' loading-skeleton__bone' : ''}`}
                  aria-hidden="true"
                >
                  <span
                    className="recognition-progress__fill"
                    style={{
                      inlineSize: `${monthlyGoal > 0 ? Math.min((recruiter.total / monthlyGoal) * 100, 100) : 0}%`,
                    }}
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
