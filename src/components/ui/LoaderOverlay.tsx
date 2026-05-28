import { motion } from 'framer-motion';
import './LoaderOverlay.css';

const EASE = [0.22, 1, 0.36, 1] as const;

export type LoaderTone = 'full' | 'route';

interface LoaderOverlayProps {
  /** Texto principal (ej. "Entrando…"). Si se omite, sólo se muestra el mark. */
  title?: string;
  /** Línea secundaria en mayúsculas (ej. "RECLUTAMIENTO"). */
  hint?: string;
  /** `full` para login/logout (velo opaco); `route` para cambios de página. */
  tone?: LoaderTone;
}

/**
 * Mark animado de marca: triada de orbes (primary/teal/amber) girando sobre un
 * núcleo pulsante con un arco perimetral. Reutilizable fuera del overlay.
 */
export function BrandLoaderMark() {
  return (
    <div className="loader-mark" role="img" aria-label="Cargando">
      <span className="loader-mark__ring" aria-hidden="true" />
      <span className="loader-mark__arc" aria-hidden="true" />
      <span className="loader-mark__orbit" aria-hidden="true">
        <span className="loader-mark__orbit-dot loader-mark__orbit-dot--a" />
        <span className="loader-mark__orbit-dot loader-mark__orbit-dot--b" />
        <span className="loader-mark__orbit-dot loader-mark__orbit-dot--c" />
      </span>
      <span className="loader-mark__core" aria-hidden="true" />
    </div>
  );
}

/**
 * Splash de carga full-screen con entrada/salida (framer-motion). Pensado para
 * envolverse en <AnimatePresence> por quien lo monta (ver useLoader).
 */
export function LoaderOverlay({ title, hint, tone = 'full' }: LoaderOverlayProps) {
  return (
    <motion.div
      className={`loader-overlay${tone === 'route' ? ' loader-overlay--route' : ''}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: tone === 'route' ? 0.2 : 0.32, ease: EASE }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg, 24px)' }}
      >
        <BrandLoaderMark />
        {(title || hint) && (
          <span className="loader-overlay__label">
            {title && <span className="loader-overlay__title">{title}</span>}
            {hint && <span className="loader-overlay__hint">{hint}</span>}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
