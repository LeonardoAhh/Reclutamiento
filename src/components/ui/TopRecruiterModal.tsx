import { useEffect, useState } from 'react';
import { Medal, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRecruitmentGoals } from '@/hooks/useIndicadoresStats';
import { supabase } from '@/lib/supabase';
import { Modal } from './Modal';
import './TopRecruiterModal.css';

export function TopRecruiterModal() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [topRecruiter, setTopRecruiter] = useState<{name: string, total: number} | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<{name: string, total: number, isTop: boolean, isTie?: boolean} | null>(null);
  const { monthlyGoal, weeklyGoal } = getRecruitmentGoals(new Date());

  useEffect(() => {
    // Solo mostramos el modal una vez por sesión
    if (sessionStorage.getItem('hasSeenTopRecruiterModal') === 'true') return;

    if (!profile || profile.role !== 'reclutador') return;

    const currentUserNameLower = (profile.display_name || profile.username || '').toLowerCase();

    const fetchStats = async () => {
      const currentMonth = new Date().getMonth(); // 0-11
      const currentYear = new Date().getFullYear();
      
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

      const [empRes, bajRes] = await Promise.all([
        supabase.from('empleados').select('reclutador').gte('fecha_ingreso', startOfMonth).lte('fecha_ingreso', endOfMonth),
        supabase.from('bajas').select('reclutador').gte('fecha_ingreso', startOfMonth).lte('fecha_ingreso', endOfMonth)
      ]);

      const allRecords = [...(empRes.data || []), ...(bajRes.data || [])];
      
      if (allRecords.length === 0) return;

      const recruiterTotals: Record<string, number> = {};
      allRecords.forEach(record => {
        const rawRecruiter = record.reclutador ? record.reclutador.replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
        let recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];
        
        if (recruiter !== 'Sin Reclutador') {
          // Capitalizar correctamente el nombre (Ej. "DANIELA" -> "Daniela")
          recruiter = recruiter.charAt(0).toUpperCase() + recruiter.slice(1).toLowerCase();
          
          // Renombrar a Nayeli por Alexandra por preferencia del usuario
          if (recruiter === 'Nayeli') {
            recruiter = 'Alexandra';
          }

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
          currentUserNameLower === recNameLower || 
          currentUserNameLower.includes(recNameLower) || 
          recNameLower.includes(currentUserNameLower)
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

      setTopRecruiter(actualTopRecruiter);
      setCurrentUserStats({ name: currentUserName, total: currentUserTotal, isTop, isTie });
      setIsOpen(true);
      sessionStorage.setItem('hasSeenTopRecruiterModal', 'true');
    };

    fetchStats().catch(console.error);
  }, [profile]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      className="top-recruiter-modal"
      size="xs"
      fullscreenMobile={false}
      icon={isTop
        ? <Medal aria-hidden="true" />
        : <TrendingUp aria-hidden="true" />}
      title={isTop
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

        <p className="top-recruiter-modal__text type-body-md">
          {getContextualMessage(progress, isTop)}
        </p>
      </div>
    </Modal>
  );
}
