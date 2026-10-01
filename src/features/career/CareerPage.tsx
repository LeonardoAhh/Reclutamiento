import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { HOME_PATH } from '@/components/layout/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { CareerJourney } from './CareerJourney';
import { useCareerPlan } from './useCareerPlan';
import { supabase } from '@/lib/supabase';
import { completeCareerJourney, hasCompletedCareerJourney } from './completion';
import './CareerPage.css';

export function CareerPage() {
  const { user } = useAuth();
  const { members } = useTeamDirectory();
  if (!user) return null;
  const currentPosition = members.find(member => member.profile_id === user.id)?.job_title ?? '';
  return (
    <div className="career-entry">
      <div className="career-entry__workspace">
        <CareerWorkspace key={user.id} userId={user.id} currentPosition={currentPosition}
          completed={hasCompletedCareerJourney(user.user_metadata)} />
      </div>
    </div>
  );
}

function CareerWorkspace({ userId, currentPosition, completed }: {
  userId: string; currentPosition: string; completed: boolean;
}) {
  const plan = useCareerPlan(userId, currentPosition);
  const [confirm, setConfirm] = useState<'leave' | 'reload' | null>(null);
  const navigate = useNavigate();
  // La actualización de Auth durante el guardado no debe adelantar la navegación.
  const [completedOnEntry] = useState(completed);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const completionPending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function leave(): Promise<boolean> {
    if (completionPending.current) return false;
    completionPending.current = true;
    setIsCompleting(true);
    setCompletionError('');
    const result = await completeCareerJourney(supabase.auth, userId);
    if (!mounted.current) return false;
    completionPending.current = false;
    setIsCompleting(false);
    if (!result.ok) {
      setCompletionError(result.message);
      setConfirm(null);
      return false;
    }
    navigate(HOME_PATH, { replace: true, state: { careerMotivation: true } });
    return true;
  }

  async function close(): Promise<boolean> {
    if (plan.dirty) { setConfirm('leave'); return false; }
    return leave();
  }
  function reload() { if (plan.dirty) setConfirm('reload'); else plan.reload(); }

  if (completedOnEntry) return <Navigate to={HOME_PATH} replace />;

  return (
    <>
      <CareerJourney onClose={close}>
        {completionError && <p className="form-error-text" role="alert">{completionError}</p>}
        {(plan.readError || plan.saveError) && (
          <div className="career-page__error">
            <p className="form-error-text" role="alert">{plan.readError || plan.saveError}</p>
            <button type="button" className="btn-secondary" onClick={reload}>
              {plan.readError ? 'Volver a intentar' : 'Cargar meta guardada'}
            </button>
          </div>
        )}
        {plan.message && <p className="type-body-sm" role="status">{plan.message}</p>}
      </CareerJourney>
      <ConfirmModal isOpen={confirm !== null} title="Tienes cambios sin guardar"
        description={confirm === 'reload'
          ? 'Cargar las metas guardadas reemplazará el texto que estás editando.'
          : 'Puedes volver al organigrama y guardar tu meta antes de continuar.'}
        confirmLabel={confirm === 'reload' ? 'Cargar metas guardadas' : 'Continuar sin guardar'}
        cancelLabel="Volver al organigrama" isDestructive={false}
        isLoading={isCompleting}
        onCancel={() => { if (!isCompleting) setConfirm(null); }}
        onConfirm={() => { if (confirm === 'reload') { plan.reload(); setConfirm(null); } else void leave(); }} />
    </>
  );
}
