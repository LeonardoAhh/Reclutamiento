import { useEffect, useState } from 'react';
import { CheckCircle2, Star, Trophy, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CoverageBar } from './CoverageBar';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import './TopRecruiterModal.css';

const MONTHLY_GOAL = 28;
const WEEKLY_GOAL = 7;

function Confetti() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const colors = ['var(--color-accent-teal)', 'var(--color-accent-purple)', 'var(--color-accent-orange)', 'var(--color-accent-sky)'];
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -20, 
            x: '50%',
            opacity: 1 
          }}
          animate={{ 
            y: 400 + Math.random() * 200,
            x: `${50 + (Math.random() * 120 - 60)}%`,
            rotate: Math.random() * 360,
            opacity: 0
          }}
          transition={{ 
            duration: 1.5 + Math.random() * 1,
            ease: "easeOut",
            delay: Math.random() * 0.2
          }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            width: Math.random() > 0.5 ? 8 : 6,
            height: Math.random() > 0.5 ? 8 : 6,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
        />
      ))}
    </div>
  );
}

export function TopRecruiterModal() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [topRecruiter, setTopRecruiter] = useState<{name: string, total: number} | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<{name: string, total: number, isTop: boolean, isTie?: boolean} | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

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

  // Manejo de teclado (ESC para cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentUserStats && topRecruiter) {
      const targetTotal = currentUserStats.isTop ? topRecruiter.total : currentUserStats.total;
      const targetProgress = Math.round((targetTotal / MONTHLY_GOAL) * 100);
      const timer = setTimeout(() => {
        setAnimatedProgress(targetProgress);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(0);
    }
  }, [isOpen, currentUserStats, topRecruiter]);

  const getContextualMessage = (progress: number, isTop: boolean) => {
    if (isTop) return "¡Gracias por tu excelente trabajo! Sigue rompiendo récords.";
    if (progress === 0) return "¡Es un nuevo mes! Anota tu primer ingreso y empieza a sumar para el equipo. ¡Vamos con todo!";
    if (progress < 25) return "¡El mes acaba de empezar! Cada ingreso cuenta para alcanzar nuestras metas.";
    if (progress <= 50) return "Vas a buen ritmo. Mantén la constancia y sigue sumando logros.";
    if (progress < 100) return "¡Estás muy cerca de la meta! Tu esfuerzo es fundamental para el equipo. ¡Vamos por más!";
    return "¡Meta mensual alcanzada! Excelente trabajo y dedicación.";
  };

  return (
    <AnimatePresence>
      {isOpen && topRecruiter && currentUserStats && (
        <motion.div 
          className="top-recruiter-modal-overlay" 
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <motion.div
            className="top-recruiter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {animatedProgress >= 100 && <Confetti />}

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
                    ¡Felicidades, {currentUserStats.name}!
                  </h2>
                  <p className="top-recruiter-modal__text type-body-md">
                    {currentUserStats.isTie ? (
                      <>Estás empatado(a) en <span className="top-recruiter-modal__highlight">1er lugar</span> del mes con <span className="top-recruiter-modal__highlight">{topRecruiter.total} ingresos</span>.</>
                    ) : (
                      <>Eres el reclutador <span className="top-recruiter-modal__highlight">#1</span> del mes con <span className="top-recruiter-modal__highlight">{topRecruiter.total} ingresos</span>.</>
                    )}
                  </p>
                  
                  <div className="top-recruiter-modal__kpi">
                    <CoverageBar 
                      percentage={animatedProgress} 
                      color="var(--color-warning)" 
                    />
                    <p className="top-recruiter-modal__kpi-text type-caption-sm">
                      {topRecruiter.total >= MONTHLY_GOAL 
                        ? `¡Has superado la meta mensual de ${MONTHLY_GOAL} ingresos!` 
                        : `Estás a ${MONTHLY_GOAL - topRecruiter.total} de tu meta mensual de ${MONTHLY_GOAL} (${WEEKLY_GOAL}/sem).`}
                    </p>
                  </div>

                  <p className="top-recruiter-modal__text type-body-md">
                    {getContextualMessage(animatedProgress, true)}
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
                      percentage={animatedProgress} 
                      color="var(--color-success)" 
                    />
                    <p className="top-recruiter-modal__kpi-text type-caption-sm">
                      {currentUserStats.total > 0 
                        ? `Llevas ${currentUserStats.total} ingresos acumulados de ${MONTHLY_GOAL} (${WEEKLY_GOAL} por semana).`
                        : `Meta mensual: ${MONTHLY_GOAL} ingresos (${WEEKLY_GOAL} por semana).`}
                    </p>
                  </div>

                  <p className="top-recruiter-modal__text type-body-md">
                    {getContextualMessage(animatedProgress, false)}
                  </p>
                </div>
              </>
            )}
            
            <motion.button 
              className="btn-primary top-recruiter-modal__btn"
              onClick={() => setIsOpen(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ¡Genial!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

