import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { EASE_OUT } from '@/lib/motion';
import { Clock3, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import './MaintenanceGuard.css';

const curtainVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
  exit: { opacity: 0, scale: 0.98, y: -8 },
};

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { profile, profileLoading, loading: authLoading, signOut } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    refresh: refreshMaintenance,
  } = useMaintenanceMode();
  const isAdmin = profile?.role === 'admin';
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    setIsChecking(true);
    // Add artificial delay so the user can perceive the action
    await Promise.all([
      refreshMaintenance({ silent: true }),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    setIsChecking(false);
  };

  if (authLoading || maintenanceLoading || (isMaintenance && profileLoading)) {
    return null;
  }

  if (!isMaintenance || isAdmin) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence>
      {isMaintenance && !isAdmin && (
        <motion.div
          variants={curtainVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="maintenance-overlay"
          role="status"
          aria-live="polite"
          aria-labelledby="maintenance-title"
        >
          <motion.div
            variants={cardVariants}
            className="maintenance-card"
          >
            <div className="maintenance-icon-wrap" aria-hidden="true">
              <ShieldCheck className="maintenance-icon" />
            </div>

            <div className="maintenance-content">
              <span className="maintenance-eyebrow type-caption-up">Mantenimiento programado</span>
              <h1 id="maintenance-title" className="maintenance-title type-heading-lg">
                Volvemos en breve
              </h1>
              <div className="maintenance-text-wrapper">
                <p className="type-body-md maintenance-text">
                  Estamos realizando ajustes programados para mantener el sistema estable. Tu información permanece protegida y el acceso se restaurará automáticamente al finalizar.
                </p>
              </div>
              <div className="maintenance-meta type-body-sm text-muted">
                <Clock3 aria-hidden="true" />
                <span>No necesitas actualizar la página.</span>
              </div>
            </div>

            <div className="maintenance-actions">
              <button
                onClick={handleCheck}
                className="btn-primary maintenance-button"
                type="button"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Comprobando...
                  </>
                ) : (
                  'Comprobar disponibilidad'
                )}
              </button>
              <button
                onClick={signOut}
                className="btn-secondary maintenance-button"
                type="button"
                disabled={isChecking}
              >
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
