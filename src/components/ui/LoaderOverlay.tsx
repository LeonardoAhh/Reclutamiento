import { motion, useReducedMotion } from 'framer-motion';
import './LoaderOverlay.css';

const EASE = [0.22, 1, 0.36, 1] as const;

const SCENE_DURATION_S = 4;
const RING_R = 70;
const RING_C = 2 * Math.PI * RING_R;
const PARTICLES = [0, 1, 2, 3, 4, 5];

export type LoaderTone = 'route';

interface LoaderOverlayProps {
  tone?: LoaderTone;
}

// ── Cargador mínimo para cambios de ruta ────────────────────────
function RouteLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="loader-route-spinner"
      role="img"
      aria-label="Cargando"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="var(--loader-core-track, var(--color-hairline-strong))" strokeWidth="3" />
        <motion.circle
          cx={20} cy={20} r={16}
          stroke="var(--loader-core-color, var(--color-primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset="75"
          animate={{ rotate: 360 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: 'linear' }}
          style={{ originX: '50%', originY: '50%' }}
        />
      </svg>
    </motion.div>
  );
}

// ── Núcleo gráfico (motivo visual del login) ─────────────────────
// Usado en la pantalla de Login (panel izquierdo).
// `mode='in'`  → partículas convergen + anillo que se llena.
export function CoreGraphic({ mode, reduce }: { mode: 'in' | 'out'; reduce: boolean }) {
  const filling = mode === 'in';
  return (
    <svg viewBox="0 0 200 200" className="loader-core" role="img" aria-hidden="true">
      <circle
        cx={100} cy={100} r={RING_R}
        fill="none"
        stroke="var(--loader-core-track, var(--color-hairline-strong))"
        strokeWidth={3}
        opacity={0.35}
      />
      <motion.circle
        cx={100} cy={100} r={RING_R}
        fill="none"
        stroke="var(--loader-core-color, var(--color-primary))"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_C}
        initial={{ strokeDashoffset: filling ? RING_C : 0 }}
        animate={{ strokeDashoffset: reduce ? (filling ? 0 : RING_C) : filling ? 0 : RING_C }}
        transition={{ duration: reduce ? 0 : SCENE_DURATION_S, ease: EASE }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
      />
      {!reduce &&
        PARTICLES.map((i) => {
          const angle = (i * 360) / PARTICLES.length;
          const rad = (angle * Math.PI) / 180;
          const outerX = 100 + Math.cos(rad) * RING_R;
          const outerY = 100 + Math.sin(rad) * RING_R;
          const fromX = filling ? outerX : 100;
          const fromY = filling ? outerY : 100;
          const toX = filling ? 100 : outerX;
          const toY = filling ? 100 : outerY;
          return (
            <motion.circle
              key={i}
              r={4}
              fill="var(--loader-core-color, var(--color-primary))"
              initial={{ cx: fromX, cy: fromY, opacity: 0 }}
              animate={{ cx: [fromX, toX], cy: [fromY, toY], opacity: [0, 1, 0] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      {!reduce && (
        <motion.circle
          cx={100} cy={100} r={16}
          fill="none"
          stroke="var(--loader-core-color, var(--color-primary))"
          strokeWidth={2}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 2.4], opacity: [0.45, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' }}
          style={{ transformOrigin: '100px 100px' }}
        />
      )}
      <motion.circle
        cx={100} cy={100} r={16}
        fill="var(--loader-core-color, var(--color-primary))"
        initial={{ scale: filling ? 0 : 1, opacity: filling ? 0 : 1 }}
        animate={
          reduce
            ? { scale: filling ? 1 : 0.2, opacity: filling ? 1 : 0.2 }
            : filling
              ? { scale: [0, 1.12, 1], opacity: 1 }
              : { scale: [1, 1.15, 0.15], opacity: [1, 1, 0] }
        }
        transition={{
          duration: filling ? 1 : SCENE_DURATION_S,
          ease: EASE,
          times: filling ? [0, 0.6, 1] : [0, 0.5, 1],
        }}
        style={{ transformOrigin: '100px 100px' }}
      />
    </svg>
  );
}

// ── Wrapper del overlay (solo spinner de ruta) ──────────────────
export function LoaderOverlay({ tone = 'route' }: LoaderOverlayProps) {
  void tone; // solo existe 'route'
  return (
    <motion.div
      className="loader-overlay loader-overlay--route"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <RouteLoader />
    </motion.div>
  );
}
