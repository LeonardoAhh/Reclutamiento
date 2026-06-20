import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTIVATIONAL_QUOTES, type Quote } from '@/lib/quotes';
import './LoaderOverlay.css';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Duración compartida de las escenas cinemáticas (login y logout). */
const SCENE_DURATION_MS = 4000;
const SCENE_DURATION_S = SCENE_DURATION_MS / 1000;
/** Geometría del núcleo en unidades del viewBox (se escala por CSS). */
const RING_R = 70;
const RING_C = 2 * Math.PI * RING_R;
const PARTICLES = [0, 1, 2, 3, 4, 5];

export type LoaderTone = 'full' | 'route' | 'logout';

interface LoaderOverlayProps {
  title?: string;
  hint?: string;
  tone?: LoaderTone;
}

// ── 1. Cargador Mínimo para cambios de ruta ──────────────────
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

// ── 2. Núcleo compartido (motivo cohesivo login ↔ logout) ─────
//
// `mode='in'`  → partículas convergen al núcleo + anillo que se llena.
// `mode='out'` → núcleo se dispersa + anillo que se vacía.
// Mismo elemento, dirección invertida. Solo tokens (claro/oscuro).
export function CoreGraphic({ mode, reduce }: { mode: 'in' | 'out'; reduce: boolean }) {
  const filling = mode === 'in';
  return (
    <svg viewBox="0 0 200 200" className="loader-core" role="img" aria-hidden="true">
      {/* Pista del anillo */}
      <circle
        cx={100} cy={100} r={RING_R}
        fill="none"
        stroke="var(--loader-core-track, var(--color-hairline-strong))"
        strokeWidth={3}
        opacity={0.35}
      />

      {/* Anillo de progreso: se llena (in) o se vacía (out) en la duración */}
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

      {/* Partículas: convergen (in) o se dispersan (out). Loop sutil. */}
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

      {/* Halo expansivo del núcleo */}
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

      {/* Núcleo central: se enciende (in) o se apaga/dispersa (out) */}
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

// ── 3. Entrada (login): una sola escena, mensaje único ────────
function CinematicEntrance() {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="loader-core-scene">
      <CoreGraphic mode="in" reduce={reduce} />
      <motion.div
        className="loader-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        <h2>Preparando tu espacio</h2>
      </motion.div>
    </div>
  );
}

// ── 4. Salida (logout): mismo núcleo dispersándose + frase ────
function LogoutCinematic({ username }: { username?: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  if (!quote) return null;

  return (
    <div className="loader-core-scene">
      <CoreGraphic mode="out" reduce={reduce} />
      <div className="loader-logout">
        {username && (
          <motion.h2
            className="loader-logout-greeting"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          >
            HASTA PRONTO, {username}
          </motion.h2>
        )}
        <motion.div
          className="loader-logout-quote"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
        >
          "{quote.text}"
        </motion.div>
        <motion.p
          className="loader-logout-author"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 1.8 }}
        >
          — {quote.author}
        </motion.p>
      </div>
    </div>
  );
}

// ── 5. Main Overlay Wrapper ──────────
export function LoaderOverlay({ title, tone = 'full' }: LoaderOverlayProps) {
  return (
    <motion.div
      className={`loader-overlay ${tone === 'route' ? 'loader-overlay--route' : ''}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {tone === 'route' && <RouteLoader />}
      {tone === 'full' && <CinematicEntrance />}
      {tone === 'logout' && <LogoutCinematic username={title} />}
    </motion.div>
  );
}
