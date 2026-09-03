import { useEffect, useState } from 'react';
import { CalendarCheck2, Medal, Target, TrendingUp } from 'lucide-react';
import { differenceInCalendarWeeks, parseISO, startOfISOWeek } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { getRecruitmentGoals } from '@/hooks/useIndicadoresStats';
import { supabase } from '@/lib/supabase';
import { markRecognitionShown, setRecognitionMonthDismissed, shouldShowRecognition } from '@/lib/recruiterRecognition';
import { Modal } from './Modal';
import './TopRecruiterModal.css';

function recruiterName(value: string | null) {
  const raw = value?.replace(/\s+/g, ' ').trim();
  if (!raw || raw === 'Sin Reclutador') return null;
  const first = raw.split(' ')[0];
  const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return name === 'Nayeli' ? 'Alexandra' : name;
}

export function TopRecruiterModal() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [topRecruiter, setTopRecruiter] = useState<{name: string, total: number} | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<{name: string, total: number, isTop: boolean, isTie?: boolean, previousTotal: number, consistent: boolean} | null>(null);
  const [dismissedThisMonth, setDismissedThisMonth] = useState(false);
  const [preferenceError, setPreferenceError] = useState(false);
  const { monthlyGoal, weeklyGoal } = getRecruitmentGoals(new Date());

  useEffect(() => {
    if (!profile || profile.role !== 'reclutador') return;
    if (!shouldShowRecognition(profile.id)) return;
    let cancelled = false;

    const currentUserNameLower = (profile.display_name || profile.username || '').toLowerCase();

    const fetchStats = async () => {
      const currentMonth = new Date().getMonth(); // 0-11
      const currentYear = new Date().getFullYear();
      
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

      const [empRes, bajRes] = await Promise.all([
        supabase.from('empleados').select('reclutador, fecha_ingreso').gte('fecha_ingreso', startOfPreviousMonth).lte('fecha_ingreso', endOfMonth),
        supabase.from('bajas').select('reclutador, fecha_ingreso').gte('fecha_ingreso', startOfPreviousMonth).lte('fecha_ingreso', endOfMonth)
      ]);
      if (cancelled) return;
      if (empRes.error) throw empRes.error;
      if (bajRes.error) throw bajRes.error;

      const records = [...(empRes.data || []), ...(bajRes.data || [])];
      const monthStart = parseISO(startOfMonth);
      const allRecords = records.filter(record => record.fecha_ingreso && parseISO(record.fecha_ingreso) >= monthStart);
      const previousRecords = records.filter(record => record.fecha_ingreso && parseISO(record.fecha_ingreso) < monthStart);
      
      if (allRecords.length === 0) return;

      const recruiterTotals: Record<string, number> = {};
      allRecords.forEach(record => {
        const recruiter = recruiterName(record.reclutador);
        if (recruiter) {
          recruiterTotals[recruiter] = (recruiterTotals[recruiter] || 0) + 1;
        }
      });

      const totalsArray = Object.entries(recruiterTotals).map(([name, total]) => ({ name, total }));
      
      let topTotal = 0;
      if (totalsArray.length > 0) {
        topTotal = Math.max(...totalsArray.map(r => r.total));
      }

      const topRecruiters = totalsArray.filter(r => r.total === topTotal && topTotal > 0);
      const isTie = topRecruiters.length > 1;

      // Determinar estadísticas del usuario actual
      let currentUserTotal = 0;
      let currentUserName = '';

      for (const r of totalsArray) {
        const recNameLower = r.name.toLowerCase();
        if (
          currentUserNameLower && (currentUserNameLower === recNameLower ||
          currentUserNameLower.includes(recNameLower) ||
          recNameLower.includes(currentUserNameLower))
        ) {
          currentUserTotal = r.total;
          currentUserName = r.name;
          break;
        }
      }

      if (!currentUserName) {
         currentUserName = profile.display_name || profile.username || 'Reclutador';
      }

      // El usuario actual es top recruiter si su total es igual al máximo y es > 0
      const isTop = currentUserTotal > 0 && currentUserTotal === topTotal;

      let actualTopRecruiter = { name: 'Nadie', total: 0 };
      if (topRecruiters.length > 0) {
        // Si hay empate y el usuario actual es uno de ellos, mostrar su nombre en el mensaje general
        if (isTop) {
          actualTopRecruiter = { name: currentUserName, total: topTotal };
        } else {
          actualTopRecruiter = topRecruiters[0];
        }
      }

      const previousTotal = previousRecords.filter(record => recruiterName(record.reclutador) === currentUserName).length;
      const weeklyTotals = new Map<number, number>();
      allRecords.forEach(record => {
        if (recruiterName(record.reclutador) !== currentUserName || !record.fecha_ingreso) return;
        const weekStart = startOfISOWeek(parseISO(record.fecha_ingreso)).getTime();
        weeklyTotals.set(weekStart, (weeklyTotals.get(weekStart) ?? 0) + 1);
      });
      const qualifyingWeeks = [...weeklyTotals.entries()]
        .filter(([, total]) => weeklyGoal !== null && total >= weeklyGoal)
        .map(([week]) => week)
        .sort((first, second) => first - second);
      const consistent = qualifyingWeeks.some((week, index) => index > 0
        && differenceInCalendarWeeks(week, qualifyingWeeks[index - 1], { weekStartsOn: 1 }) === 1);

      if (cancelled || !shouldShowRecognition(profile.id)) return;
      setTopRecruiter(actualTopRecruiter);
      setCurrentUserStats({ name: currentUserName, total: currentUserTotal, isTop, isTie, previousTotal, consistent });
      setIsOpen(true);
      markRecognitionShown(profile.id);
    };

    fetchStats().catch(console.error);
    return () => { cancelled = true; };
  }, [profile, weeklyGoal]);

  const getContextualMessage = (progress: number, isTop: boolean) => {
    if (isTop) return "¡Gracias por tu excelente trabajo! Sigue rompiendo récords.";
    if (progress === 0) return "¡Es un nuevo mes! Anota tu primer ingreso y empieza a sumar para el equipo. ¡Vamos con todo!";
    if (progress < 25) return "¡El mes acaba de empezar! Cada ingreso cuenta para alcanzar nuestras metas.";
    if (progress <= 50) return "Vas a buen ritmo. Mantén la constancia y sigue sumando logros.";
    if (progress < 100) return "¡Estás muy cerca de la meta! Tu esfuerzo es fundamental para el equipo. ¡Vamos por más!";
    return "¡Meta mensual alcanzada! Excelente trabajo y dedicación.";
  };

  if (!topRecruiter || !currentUserStats) return null;

  const isTop = currentUserStats.isTop;
  const progress = Math.round((currentUserStats.total / monthlyGoal) * 100);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const remainingToGoal = Math.max(monthlyGoal - currentUserStats.total, 0);
  const weeklyGoalCopy = weeklyGoal ? ` · Referencia semanal: ${weeklyGoal}` : '';
  const improvement = currentUserStats.total - currentUserStats.previousTotal;
  const milestones = [
    ...(remainingToGoal === 0 ? [{ id: 'goal', Icon: Target, title: 'Meta alcanzada', detail: `${currentUserStats.total} de ${monthlyGoal} ingresos este mes.` }] : []),
    ...(currentUserStats.consistent ? [{ id: 'consistency', Icon: CalendarCheck2, title: 'Constancia semanal', detail: 'Meta semanal cumplida en dos semanas consecutivas de este mes.' }] : []),
    ...(improvement > 0 ? [{ id: 'improvement', Icon: TrendingUp, title: 'Mejora mensual', detail: `${improvement} ${improvement === 1 ? 'ingreso más' : 'ingresos más'} que el total del mes anterior.` }] : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      className="top-recruiter-modal"
      size="xs"
      icon={isTop
        ? <Medal aria-hidden="true" />
        : <TrendingUp aria-hidden="true" />}
      title={milestones.length > 0 || isTop
        ? `¡Felicidades, ${currentUserStats.name}!`
        : `¡Excelente esfuerzo, ${currentUserStats.name}!`}
      footerActions={
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsOpen(false)}
        >
          Entendido
        </button>
      }
    >
      <div className="modal-body top-recruiter-modal__body">
        {isTop && (
          <p className="top-recruiter-modal__text type-body-md">
            {currentUserStats.isTie ? (
              <>Compartes el <strong>primer lugar</strong> del mes con {topRecruiter.total} ingresos.</>
            ) : (
              <>Lideras el mes con <strong>{topRecruiter.total} ingresos</strong>.</>
            )}
          </p>
        )}

        <div className="top-recruiter-modal__kpi">
          <div className="top-recruiter-modal__progress-heading">
            <span>Progreso mensual</span>
            <strong>{progress}%</strong>
          </div>
          <progress
            className={`top-recruiter-modal__progress${clampedProgress === 100 ? ' top-recruiter-modal__progress--complete' : ''}`}
            value={clampedProgress}
            max="100"
            aria-label={`${progress} por ciento de la meta mensual`}
          />
          <p className="top-recruiter-modal__kpi-text type-caption-sm">
            {remainingToGoal === 0
              ? `Meta mensual alcanzada: ${currentUserStats.total} de ${monthlyGoal} ingresos.`
              : `${remainingToGoal} ingresos para alcanzar la meta de ${monthlyGoal}${weeklyGoalCopy}.`}
          </p>
        </div>

        {milestones.length > 0 && (
          <section aria-labelledby="recognition-milestones-title">
            <h3 id="recognition-milestones-title" className="top-recruiter-modal__section-title type-body-sm-strong">Logros del mes</h3>
            <ul className="top-recruiter-modal__milestones" role="list">
              {milestones.map(({ id, Icon, title, detail }) => (
                <li key={id} className="top-recruiter-modal__milestone">
                  <Icon aria-hidden="true" />
                  <div className="top-recruiter-modal__milestone-copy type-body-sm">
                    <strong className="type-body-sm-strong">{title}</strong>
                    <span>{detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="top-recruiter-modal__text type-body-md">
          {getContextualMessage(progress, isTop)}
        </p>
        <div className="top-recruiter-modal__preferences">
          <label className="top-recruiter-modal__dismiss type-body-sm">
            <input
              type="checkbox"
              checked={dismissedThisMonth}
              onChange={(event) => {
                if (!profile) return;
                const next = event.target.checked;
                const saved = setRecognitionMonthDismissed(profile.id, next);
                setPreferenceError(!saved);
                if (saved) setDismissedThisMonth(next);
              }}
            />
            <span>No volver a mostrar este mes</span>
          </label>
          {preferenceError && <p role="alert" className="top-recruiter-modal__text type-body-sm">No se pudo guardar. Permite almacenamiento en el navegador e inténtalo otra vez.</p>}
          <p className="top-recruiter-modal__kpi-text type-caption-sm">Configura la frecuencia en tu menú de usuario, en Reconocimientos.</p>
        </div>
      </div>
    </Modal>
  );
}
