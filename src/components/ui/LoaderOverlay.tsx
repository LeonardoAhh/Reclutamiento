import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterTitle } from '@/components/ui/TypewriterTitle';
import { MOTIVATIONAL_QUOTES, type Quote } from '@/lib/quotes';
import './LoaderOverlay.css';

const EASE = [0.22, 1, 0.36, 1] as const;

export type LoaderTone = 'full' | 'route' | 'logout';

interface LoaderOverlayProps {
  title?: string;
  hint?: string;
  tone?: LoaderTone;
}

// ── 1. Cargador Mínimo para cambios de ruta (800ms) ──────────
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
        <circle cx="20" cy="20" r="16" stroke="var(--color-hairline-strong)" strokeWidth="3" />
        <motion.circle
          cx="20" cy="20" r="16"
          stroke="var(--color-primary)"
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

// ── 2. Animaciones de las Fases del Reclutamiento ──────────

// FASE 1: Atracción (Recolección de perfiles)
function AttractionGraphic() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="loader-svg">
      {/* Central Node */}
      <motion.circle 
        cx="80" cy="80" r="18" 
        fill="var(--color-primary)" 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }} 
      />
      {/* Orbiting nodes converging */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 360) / 6;
        const rad = (angle * Math.PI) / 180;
        const startX = 80 + Math.cos(rad) * 65;
        const startY = 80 + Math.sin(rad) * 65;
        return (
          <motion.circle
            key={i}
            cx={startX}
            cy={startY}
            r="5"
            fill="var(--color-primary)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], cx: 80, cy: 80 }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.3, ease: "easeInOut" }}
          />
        );
      })}
    </svg>
  );
}

// FASE 2: Selección (Filtro / Match)
function SelectionGraphic() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="loader-svg">
      {/* Profile Card base */}
      <motion.rect 
        x="45" y="35" width="70" height="90" rx="10" 
        fill="none" stroke="var(--color-hairline-strong)" strokeWidth="3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      />
      {/* Abstract profile items */}
      <motion.circle cx="80" cy="65" r="14" fill="var(--color-hairline-strong)" 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
      <motion.rect x="60" y="95" width="40" height="4" rx="2" fill="var(--color-hairline-strong)" 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
      <motion.rect x="65" y="107" width="30" height="4" rx="2" fill="var(--color-hairline-strong)" 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />

      {/* Scanner line */}
      <motion.line 
        x1="30" y1="35" x2="130" y2="35"
        stroke="var(--color-accent-teal)" strokeWidth="3"
        animate={{ y1: [35, 125, 35], y2: [35, 125, 35] }}
        transition={{ duration: 2.2, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
      />
      {/* Checkmark popping up periodically */}
      <motion.path 
        d="M68 85 L78 95 L98 65" 
        fill="none" stroke="var(--color-success)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
      />
    </svg>
  );
}

// FASE 3: Onboarding (Acceso al Dashboard)
function OnboardingGraphic() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="loader-svg">
      <motion.g 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 1, ease: EASE }}
      >
        <motion.rect x="35" y="35" width="40" height="40" rx="8" fill="var(--color-primary)" 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, ease: EASE }} />
        <motion.rect x="85" y="35" width="40" height="40" rx="8" fill="var(--color-hairline-strong)" 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, ease: EASE }} />
        <motion.rect x="35" y="85" width="90" height="40" rx="8" fill="var(--color-hairline-strong)" 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ease: EASE }} />
        
        {/* Abstract mini graphs indicating the dashboard is ready */}
        <motion.rect x="45" y="105" width="6" height="10" rx="2" fill="var(--color-canvas)" 
          initial={{ height: 0 }} animate={{ height: 10 }} transition={{ delay: 0.6 }} />
        <motion.rect x="55" y="100" width="6" height="15" rx="2" fill="var(--color-canvas)" 
          initial={{ height: 0 }} animate={{ height: 15 }} transition={{ delay: 0.7 }} />
        <motion.rect x="65" y="95" width="6" height="20" rx="2" fill="var(--color-canvas)" 
          initial={{ height: 0 }} animate={{ height: 20 }} transition={{ delay: 0.8 }} />
      </motion.g>
    </svg>
  );
}

// ── 3. Secuencia Cinemática de 7 segundos ──────────
function CinematicEntrance() {
  const [phase, setPhase] = useState(0);

  // La secuencia dura 7s en total, dividida en 3 actos (aprox 2.3s cada uno).
  useEffect(() => {
    // 0s a 2.33s: Atracción
    const t1 = setTimeout(() => setPhase(1), 2333);
    // 2.33s a 4.66s: Selección
    const t2 = setTimeout(() => setPhase(2), 4666);
    // 4.66s a 7s: Onboarding
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const variants = {
    initial: { opacity: 0, y: 15 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.6, ease: EASE } }
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.4, ease: EASE } }
  };

  return (
    <div className="loader-cinematic">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="phase0" className="loader-phase" initial="initial" animate="enter" exit="exit" variants={variants}>
             <AttractionGraphic />
             <motion.div className="loader-text" variants={textVariants}>
               <h2>Reclutamiento Querétaro</h2>
               <p>
                 <TypewriterTitle 
                   sequences={[{ text: "Cargando base de datos del personal...", deleteAfter: false }]}
                   typingSpeed={15}
                   startDelay={300}
                   autoLoop={false}
                 />
               </p>
             </motion.div>
          </motion.div>
        )}
        {phase === 1 && (
          <motion.div key="phase1" className="loader-phase" initial="initial" animate="enter" exit="exit" variants={variants}>
             <SelectionGraphic />
             <motion.div className="loader-text" variants={textVariants}>
               <h2>Estatus de Plantilla</h2>
               <p>
                 <TypewriterTitle 
                   sequences={[{ text: "Sincronizando candidatos en proceso e ingresos...", deleteAfter: false }]}
                   typingSpeed={15}
                   startDelay={300}
                   autoLoop={false}
                 />
               </p>
             </motion.div>
          </motion.div>
        )}
        {phase === 2 && (
          <motion.div key="phase2" className="loader-phase" initial="initial" animate="enter" exit="exit" variants={variants}>
             <OnboardingGraphic />
             <motion.div className="loader-text" variants={textVariants}>
               <h2>Dashboard Activo</h2>
               <p>
                 <TypewriterTitle 
                   sequences={[{ text: "Indicadores clave listos para presentar...", deleteAfter: false }]}
                   typingSpeed={15}
                   startDelay={300}
                   autoLoop={false}
                 />
               </p>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 4. Secuencia Cinemática de Salida (7 segundos motivacionales) ──────────
function LogoutCinematic({ username }: { username?: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Escoger una frase aleatoria al montar
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  if (!quote) return null;

  return (
    <motion.div 
      className="loader-logout"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1.02 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 7, ease: "easeInOut" }}
    >
      {username && (
        <motion.h2
          className="loader-logout-greeting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: EASE, delay: 0.1 }}
        >
          HASTA PRONTO, {username}
        </motion.h2>
      )}
      <motion.div 
        className="loader-logout-quote"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.3 }}
      >
        <TypewriterTitle 
          sequences={[{ text: `"${quote.text}"`, deleteAfter: false }]}
          typingSpeed={15}
          startDelay={800}
          autoLoop={false}
        />
      </motion.div>
      <motion.p 
        className="loader-logout-author"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: EASE, delay: 2.5 }}
      >
        — {quote.author}
      </motion.p>
    </motion.div>
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
