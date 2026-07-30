import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './SplashTypewriter.css';

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Mantener en pantalla unos 2.2 segundos para que sea legible y luego desaparecer
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="splash-typewriter"
      role="status"
      aria-label="Iniciando la aplicación de reclutamiento"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.h1
        className="splash-typewriter__text"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        RECLUTAMIENTO QUERÉTARO
      </motion.h1>
    </motion.div>
  );
}
