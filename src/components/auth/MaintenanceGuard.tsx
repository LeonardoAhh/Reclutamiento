import { type ReactNode, useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/lib/notify';
import { DotGrid } from '@/components/ui/DotGrid';
import { LiveOrb } from '@/components/ui/LiveOrb';
import { StatusPage } from '@/components/ui/StatusPage';
import './MaintenanceGuard.css';

// ── Variantes de animación ─────────────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 },
  },
};

// ── Componente principal ───────────────────────────────────────────────────────
export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const english = language === 'en';
  const { profile, profileLoading, loading: authLoading, signOut } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    error: maintenanceError,
    networkError,
    hasConfirmedState,
    refresh: refreshMaintenance,
  } = useMaintenanceMode();

  const isAdmin = profile?.role === 'admin';
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!hasChecked || !isMaintenance) return;

    toast.warning({
      title: english
        ? 'Maintenance continues'
        : 'Continúa el mantenimiento',
    });
    setHasChecked(false);
  }, [english, hasChecked, isMaintenance]);

  const handleCheck = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setHasChecked(false);
    try {
      await refreshMaintenance({ silent: true });
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (authLoading || maintenanceLoading || ((!hasConfirmedState || isMaintenance) && profileLoading)) {
    return null;
  }

  if ((hasConfirmedState && !isMaintenance) || isAdmin) {
    return <>{children}</>;
  }

  if (!hasConfirmedState && maintenanceError) {
    return <StatusPage
      kind={networkError ? 'offline' : 'server'}
      standalone
      onRetry={() => { void handleCheck(); }}
      retrying={isChecking}
    />;
  }

  const statusMessage = maintenanceError
    ? english ? 'Could not check the status. Try again.' : 'No se pudo consultar el estado. Intenta de nuevo.'
    : '';

  return (
    <motion.main
      className="maintenance-overlay"
      variants={overlayVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
    >
      <motion.section
        className="maintenance-workspace"
        aria-labelledby="maintenance-title"
        variants={cardVariants}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
      >
        <div className="maintenance-visual" aria-hidden="true">
          <DotGrid />
          <LiveOrb size={160} />
        </div>
        <div className="maintenance-panel">
          <div className="maintenance-content">
            <h1 id="maintenance-title" className="app-page-title">
              {hasConfirmedState
                ? english ? 'Under maintenance' : 'En mantenimiento'
                : english ? 'Access not confirmed' : 'Sin acceso confirmado'}
            </h1>
            <p className="maintenance-body">
              {hasConfirmedState
                ? english ? 'We are working on the system. Please check back soon.' : 'Estamos trabajando en el sistema. Vuelve pronto.'
                : english
                  ? 'We could not verify your access. Check the status or sign in again.'
                  : 'No pudimos verificar tu acceso. Comprueba el estado o inicia sesión de nuevo.'}
            </p>
          </div>

          <div className="maintenance-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleCheck}
              disabled={isChecking}
              aria-busy={isChecking}
              aria-describedby={maintenanceError ? 'maintenance-status' : undefined}
            >
              {isChecking && <LoaderCircle className="spin" aria-hidden="true" />}
              {isChecking
                ? english ? 'Checking…' : 'Comprobando…'
                : english ? 'Check status' : 'Comprobar estado'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={signOut}
              disabled={isChecking}
            >
              {english ? 'Sign out' : 'Cerrar sesión'}
            </button>
          </div>

          {statusMessage && (
            <p
              id="maintenance-status"
              className="maintenance-status"
              role="status"
              aria-atomic="true"
              aria-live="polite"
            >
              {statusMessage}
            </p>
          )}
        </div>
      </motion.section>
    </motion.main>
  );
}
