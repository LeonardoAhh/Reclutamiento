import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { isRecognitionMonthDismissed, readRecognitionPreferences } from '@/lib/recruiterRecognition';
import { loadRecruiterMonthlyProgress, type RecruiterMonthlyProgressData } from './loadRecruiterMonthlyProgress';
import './RecognitionIndicators.css';

interface RecruiterMonthlyProgressProps {
  open: boolean;
}

export function RecruiterMonthlyProgress({ open }: RecruiterMonthlyProgressProps) {
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const [result, setResult] = useState<{ profileId: string; data: RecruiterMonthlyProgressData | null } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const profileId = profile?.role === 'reclutador' ? profile.id : null;
  const hidden = profileId
    ? readRecognitionPreferences(profileId).frequency === 'off' || isRecognitionMonthDismissed(profileId)
    : true;

  useEffect(() => {
    if (!open || !profileId || hidden) return;
    const controller = new AbortController();
    void loadRecruiterMonthlyProgress(profileId, members, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setResult({ profileId, data });
          setError(false);
        }
      },
      (cause: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('No se pudo cargar el progreso mensual.', cause);
          setError(true);
        }
      },
    );
    return () => controller.abort();
  }, [hidden, members, open, profileId, retry]);

  if (!open || !profileId || hidden) return null;
  if (result?.profileId === profileId && result.data === null) return null;
  const data = result?.profileId === profileId && !error ? result.data : null;
  if (error) {
    return (
      <section className="recruiter-progress" aria-label="Progreso mensual">
        <p>No se pudo cargar el progreso mensual.</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setRetry((value) => value + 1)}>
          Reintentar
        </button>
      </section>
    );
  }
  if (!data) {
    return (
      <LoadingSkeleton className="recruiter-progress" label="Cargando progreso mensual">
        <span className="loading-skeleton__bone recruiter-progress__loading-line" />
        <span className="loading-skeleton__bone recruiter-progress__loading-line" />
      </LoadingSkeleton>
    );
  }

  const milestones = [
    ...(data.isTop ? [`${data.isTie ? 'Empate en primer lugar' : 'Primer lugar'}: ${data.total} ingresos`] : []),
    ...(data.total >= data.monthlyGoal ? ['Meta alcanzada'] : []),
    ...(data.consistent ? ['Constancia semanal'] : []),
    ...(data.improvement > 0
      ? [`${data.improvement} ${data.improvement === 1 ? 'ingreso más' : 'ingresos más'} que el mes anterior`]
      : []),
  ];

  return (
    <section className="recruiter-progress" aria-labelledby="recruiter-progress-title">
      <div className="recruiter-progress__heading">
        <h3 id="recruiter-progress-title">Progreso mensual</h3>
        <span className="recruiter-progress__visual">
          <progress
            className="sr-only"
            value={Math.min(data.total, Math.max(data.monthlyGoal, 1))}
            max={Math.max(data.monthlyGoal, 1)}
            aria-label={`${data.total} de ${data.monthlyGoal} ingresos de la meta mensual`}
          />
          <span
            className={`recognition-progress__track${data.total === 0 ? ' loading-skeleton__bone' : ''}`}
            aria-hidden="true"
          >
            <span
              className="recognition-progress__fill"
              style={{
                inlineSize: `${data.monthlyGoal > 0 ? Math.min((data.total / data.monthlyGoal) * 100, 100) : 0}%`,
              }}
            />
          </span>
        </span>
        <strong aria-hidden="true">
          {data.total}/{data.monthlyGoal}
        </strong>
      </div>
      {milestones.length > 0 && (
        <details className="recruiter-progress__details">
          <summary>
            Logros ({milestones.length})
            <ChevronDown aria-hidden="true" />
          </summary>
          <ul>
            {milestones.map((milestone) => (
              <li key={milestone}>{milestone}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
