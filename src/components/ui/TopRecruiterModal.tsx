import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import './TopRecruiterModal.css';

// Componente simple de confeti con framer-motion para evitar dependencias extra
const Confetti = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const pieces = Array.from({ length: 40 });

  return (
    <div className="top-recruiter-modal__confetti" aria-hidden="true">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: '50%',
            y: '100%',
            scale: 0
          }}
          animate={{
            opacity: [1, 1, 0],
            x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
            y: `${-Math.random() * 300}px`,
            scale: [0, Math.random() + 0.5, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            ease: "easeOut",
            delay: Math.random() * 0.2
          }}
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '10px',
            height: '10px',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  );
};

export function TopRecruiterModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [topRecruiter, setTopRecruiter] = useState<{name: string, total: number} | null>(null);

  useEffect(() => {
    // Solo mostramos el modal una vez por sesión
    if (sessionStorage.getItem('hasSeenTopRecruiterModal') === 'true') return;

    if (!user) return;

    fetch('/indicador.json')
      .then(res => res.ok ? res.json() : null)
      .then((data: any[]) => {
        if (!data || data.length === 0) return;

        const recruiterTotals: Record<string, number> = {};
        data.forEach(record => {
          const rawRecruiter = record["Reclutador"] ? record["Reclutador"].replace(/\s+/g, ' ').trim() : 'Sin Reclutador';
          const recruiter = rawRecruiter === 'Sin Reclutador' ? rawRecruiter : rawRecruiter.split(' ')[0];
          
          if (recruiter !== 'Sin Reclutador') {
            recruiterTotals[recruiter] = (recruiterTotals[recruiter] || 0) + 1;
          }
        });

        const totalsArray = Object.entries(recruiterTotals).map(([name, total]) => ({ name, total }));
        if (totalsArray.length === 0) return;

        const actualTopRecruiter = totalsArray.reduce((max, current) => current.total > max.total ? current : max);
        
        const emailMap: Record<string, string> = {
          'leonardo': 'leonardo@reclutamiento.local',
          'daniela': 'daniela@reclutamiento.local',
          'alexandra': 'alexandra@reclutamiento.local'
        };

        const topNameLower = actualTopRecruiter.name.toLowerCase();
        const expectedEmail = emailMap[topNameLower];
        
        const isTop = expectedEmail 
          ? user.email?.toLowerCase() === expectedEmail
          : user.email?.toLowerCase().includes(topNameLower);

        if (isTop) {
          setTopRecruiter(actualTopRecruiter);
          setIsOpen(true);
          sessionStorage.setItem('hasSeenTopRecruiterModal', 'true');
        }
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

  return (
    <AnimatePresence>
      {isOpen && topRecruiter && (
        <div 
          className="top-recruiter-modal-overlay" 
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
            className="top-recruiter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <Confetti />
            
            <button 
              className="top-recruiter-modal__close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar mensaje"
            >
              <X size={24} />
            </button>
            
            <div className="top-recruiter-modal__icon-wrapper" aria-hidden="true">
              <Trophy size={36} />
            </div>
            
            <div className="top-recruiter-modal__content">
              <h2 id="modal-title" className="top-recruiter-modal__title type-heading-md">
                ¡Felicidades, {topRecruiter.name}!
              </h2>
              <p className="top-recruiter-modal__text type-body-md">
                Eres el reclutador <span className="top-recruiter-modal__highlight">#1</span> del mes con <span className="top-recruiter-modal__highlight">{topRecruiter.total} ingresos</span>.
              </p>
              <p className="top-recruiter-modal__text type-body-sm">
                ¡Gracias por tu excelente trabajo! Sigue rompiendo récords.
              </p>
            </div>
            
            <button 
              className="btn btn--primary top-recruiter-modal__action"
              onClick={() => setIsOpen(false)}
            >
              ¡Genial!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
