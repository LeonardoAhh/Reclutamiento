import { type ReactNode, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { sleep } from 'robot-toast/robots';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import './MaintenanceGuard.css';

// ── SVG decorativo: engrane minimalista ───────────────────────────────────────
function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 15a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 4.5 18 9a15 15 0 0 0-4.24 2.47L9 9.75 4.5 18l3.75 3a14.9 14.9 0 0 0 0 6L4.5 30 9 38.25l4.76-1.72A15 15 0 0 0 18 39l1.5 4.5h9L30 39a15 15 0 0 0 4.24-2.47L39 38.25 43.5 30l-3.75-3a14.9 14.9 0 0 0 0-6l3.75-3L39 9.75l-4.76 1.72A15 15 0 0 0 30 9l-1.5-4.5h-9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

const gearVariants: Variants = {
  animate: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 8, ease: 'linear' },
  },
  still: { rotate: 0 },
};

const robotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.25 },
  },
};

// ── Componente principal ───────────────────────────────────────────────────────
export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { profile, profileLoading, loading: authLoading, signOut } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    error: maintenanceError,
    hasConfirmedState,
    refresh: refreshMaintenance,
  } = useMaintenanceMode();

  const isAdmin = profile?.role === 'admin';
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const reduceMotion = useReducedMotion();

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

  const statusMessage = isChecking
    ? 'Verificando…'
    : maintenanceError
      ? 'No se pudo consultar el estado. Intenta de nuevo.'
      : hasChecked && isMaintenance
        ? 'El sistema sigue en mantenimiento.'
        : '';

  return (
    <motion.main
      className="maintenance-overlay"
      aria-labelledby="maintenance-title"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        className="maintenance-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Ilustración */}
        <div className="maintenance-visual" aria-hidden="true">
          <motion.div
            className="maintenance-gear-wrap"
            variants={gearVariants}
            animate={reduceMotion ? 'still' : 'animate'}
          >
            <GearIcon className="maintenance-gear" />
          </motion.div>
          <motion.img
            className="maintenance-robot"
            src={sleep}
            alt=""
            variants={robotVariants}
            initial="hidden"
            animate="visible"
          />
        </div>

        {/* Texto */}
        <div className="maintenance-content">
          <h1 id="maintenance-title" className="app-page-title">
            {hasConfirmedState ? 'En mantenimiento' : 'Sin acceso confirmado'}
          </h1>
          <p className="maintenance-body">
            {hasConfirmedState
              ? 'Estamos trabajando en el sistema. Vuelve pronto.'
              : 'No pudimos verificar tu acceso. Comprueba el estado o inicia sesión de nuevo.'}
          </p>
        </div>

        {/* Acciones */}
        <div className="maintenance-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCheck}
            disabled={isChecking}
            aria-busy={isChecking}
            aria-describedby="maintenance-status"
          >
            {isChecking ? 'Comprobando…' : 'Comprobar estado'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={signOut}
            disabled={isChecking}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Estado accesible */}
        <p
          id="maintenance-status"
          className="maintenance-status"
          role="status"
          aria-atomic="true"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </motion.section>
    </motion.main>
  );
}
