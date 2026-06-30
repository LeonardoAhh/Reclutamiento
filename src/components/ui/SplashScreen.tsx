import { useEffect } from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css';

const EASE = [0.22, 1, 0.36, 1] as const;
/** Tiempo visible antes del exit (ms). El exit añade ~450 ms más. */
const HOLD_MS = 2200;

interface SplashScreenProps {
  onDone: () => void;
}

/**
 * Pantalla de entrada que aparece una sola vez por sesión antes del
 * login. Minimalista, semántica, mobile-first.
 * Sin valores hardcodeados: usa exclusivamente tokens del design system.
 */
export function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const id = window.setTimeout(onDone, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <motion.div
      className="splash"
      role="status"
      aria-label="Iniciando la aplicación de reclutamiento"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="splash__inner">

        {/* ── Marca ── */}
        <motion.div
          className="splash__brand"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <strong className="splash__wordmark">
            ViñoPlastic
          </strong>
          <span className="splash__sub" aria-hidden="true">
            Reclutamiento
          </span>
        </motion.div>

        {/* ── Barra de progreso ── */}
        <motion.div
          className="splash__track"
          role="progressbar"
          aria-label="Cargando"
          aria-valuemin={0}
          aria-valuemax={100}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.div
            className="splash__bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: (HOLD_MS / 1000) - 0.5,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>

      </div>
    </motion.div>
  );
}
