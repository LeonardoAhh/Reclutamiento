import { useEffect, useState } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CoverageBar } from './CoverageBar';
import './TopRecruiterModal.css';

const MONTHLY_GOAL = 28;
const WEEKLY_GOAL = 7;

export function TopRecruiterModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [topRecruiter, setTopRecruiter] = useState<{name: string, total: number} | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<{name: string, total: number, isTop: boolean} | null>(null);

  useEffect(() => {
    // Solo mostramos el modal una vez por sesión
    if (sessionStorage.getItem('hasSeenTopRecruiterModal') === 'true') return;

    if (!user || !user.email) return;

    // Restringir el modal exclusivamente a los reclutadores
    const allowedRecruiters = ['alexandra@reclutamiento.local', 'daniela@reclutamiento.local'];
    if (!allowedRecruiters.includes(user.email.toLowerCase())) return;

    fetch('/indicador.json')
      .then(res => res.ok ? res.json() : null)
      .then((data: any[]) => {
        if (!data || data.length === 0) return;

        const currentMonth = new Date().getMonth(); // 0-11
        const currentYear = new Date().getFullYear();

        const recruiterTotals: Record<string, number> = {};
        data.forEach(record => {
          const fechaIngresoStr = record["Fecha Ingreso"];
          if (!fechaIngresoStr) return;

          const parts = fechaIngresoStr.split('/');
          if (parts.length !== 3) return;

          const recordMonth = parseInt(parts[1], 10) - 1;
          const recordYear = parseInt(parts[2], 10);

          if (recordMonth !== currentMonth || recordYear !== currentYear) return;

          const rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
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
        
        let actualTopRecruiter = { name: 'Nadie', total: 0 };
        if (totalsArray.length > 0) {
          actualTopRecruiter = totalsArray.reduce((max, current) => current.total > max.total ? current : max);
        }

        const emailMap: Record<string, string> = {
          'leonardo': 'leonardo@reclutamiento.local',
          'daniela': 'daniela@reclutamiento.local',
          'alexandra': 'alexandra@reclutamiento.local',
          'nayeli': 'alexandra@reclutamiento.local'
        };

        const topNameLower = actualTopRecruiter.name.toLowerCase();
        const expectedEmail = emailMap[topNameLower];
        
        const isTop = expectedEmail 
          ? user.email?.toLowerCase() === expectedEmail
          : (user.email?.toLowerCase().includes(topNameLower) && topNameLower !== 'nadie');

        // Determinar estadísticas del usuario actual
        let currentUserTotal = 0;
        let currentUserName = '';
        const userEmailLower = user.email?.toLowerCase() || '';

        for (const r of totalsArray) {
          const recNameLower = r.name.toLowerCase();
          const expected = emailMap[recNameLower];
          if (expected) {
            if (userEmailLower === expected) {
              currentUserTotal = r.total;
              currentUserName = r.name;
              break;
            }
          } else if (userEmailLower.includes(recNameLower)) {
            currentUserTotal = r.total;
            currentUserName = r.name;
            break;
          }
        }

        if (!currentUserName) {
           const fallbackName = userEmailLower.split('@')[0] || 'Reclutador';
           currentUserName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
        }

        setTopRecruiter(actualTopRecruiter);
        setCurrentUserStats({ name: currentUserName, total: currentUserTotal, isTop });
        setIsOpen(true);
        sessionStorage.setItem('hasSeenTopRecruiterModal', 'true');
      })
      .catch(console.error);
  }, [user]);

  // Manejo de teclado (ESC para cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !topRecruiter || !currentUserStats) return null;

  const topProgress = Math.round((topRecruiter.total / MONTHLY_GOAL) * 100);
  const personalProgress = Math.round((currentUserStats.total / MONTHLY_GOAL) * 100);

  return (
    <div 
      className="top-recruiter-modal-overlay" 
      onClick={() => setIsOpen(false)}
      role="presentation"
    >
      <div
        className="top-recruiter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="top-recruiter-modal__close"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar mensaje"
        >
          <X size={24} />
        </button>
        
        {currentUserStats.isTop ? (
          <>
            <div className="top-recruiter-modal__icon-wrapper" aria-hidden="true">
              <Trophy size={24} />
            </div>
            
            <div className="top-recruiter-modal__content">
              <h2 id="modal-title" className="top-recruiter-modal__title type-heading-md">
                ¡Felicidades, {topRecruiter.name}!
              </h2>
              <p className="top-recruiter-modal__text type-body-md">
                Eres el reclutador <span className="top-recruiter-modal__highlight">#1</span> del mes con <span className="top-recruiter-modal__highlight">{topRecruiter.total} ingresos</span>.
              </p>
              
              <div className="top-recruiter-modal__kpi">
                <CoverageBar 
                  percentage={topProgress} 
                  color="var(--color-warning)" 
                />
                <p className="top-recruiter-modal__kpi-text type-caption-sm">
                  {topRecruiter.total >= MONTHLY_GOAL 
                    ? `¡Has superado la meta mensual de ${MONTHLY_GOAL} ingresos!` 
                    : `Estás a ${MONTHLY_GOAL - topRecruiter.total} de tu meta mensual de ${MONTHLY_GOAL} (${WEEKLY_GOAL}/sem).`}
                </p>
              </div>

              <p className="top-recruiter-modal__text type-body-sm">
                ¡Gracias por tu excelente trabajo! Sigue rompiendo récords.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="top-recruiter-modal__icon-wrapper top-recruiter-modal__icon-wrapper--personal" aria-hidden="true">
              <Star size={24} />
            </div>
            
            <div className="top-recruiter-modal__content">
              <h2 id="modal-title" className="top-recruiter-modal__title type-heading-md">
                ¡Excelente esfuerzo, {currentUserStats.name}!
              </h2>
              
              <div className="top-recruiter-modal__kpi">
                <CoverageBar 
                  percentage={personalProgress} 
                  color="var(--color-success)" 
                />
                <p className="top-recruiter-modal__kpi-text type-caption-sm">
                  {currentUserStats.total > 0 
                    ? `Llevas ${currentUserStats.total} ingresos acumulados de ${MONTHLY_GOAL} (${WEEKLY_GOAL} por semana).`
                    : `Meta mensual: ${MONTHLY_GOAL} ingresos (${WEEKLY_GOAL} por semana).`}
                </p>
              </div>

              {currentUserStats.total > 0 ? (
                <p className="top-recruiter-modal__text type-body-md">
                  Tu esfuerzo es fundamental para el equipo. ¡Vamos por más!
                </p>
              ) : (
                <p className="top-recruiter-modal__text type-body-md">
                  ¡Es un nuevo mes! Anota tu primer ingreso y empieza a sumar para el equipo. ¡Vamos con todo!
                </p>
              )}
            </div>
          </>
        )}
        
        <button 
          className="btn-primary"
          onClick={() => setIsOpen(false)}
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}

