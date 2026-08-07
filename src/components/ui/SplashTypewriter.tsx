import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './SplashTypewriter.css';

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const entrance = shouldReduceMotion ? false : { opacity: 0, scale: 0.95 };
  const exit = shouldReduceMotion ? undefined : { opacity: 0 };

  useEffect(() => {
    // Reducido a 1.5s para no ser pesado y rápido
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="splash-typewriter"
      role="status"
      aria-label="Iniciando la aplicación de reclutamiento"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={exit}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }}
    >
      <motion.div
        className="splash-typewriter__content"
        initial={entrance}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
      >
        <h1 className="splash-typewriter__text">
          RECLUTAMIENTO QUERÉTARO
        </h1>
      </motion.div>
    </motion.div>
  );
}
