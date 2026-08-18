import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { useMorphingSequence } from '@/hooks/useMorphingSequence';
import './SplashTypewriter.css';

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
  const { icon, shouldReduceMotion } = useMorphingSequence();
  const entrance = shouldReduceMotion ? false : { opacity: 0, y: 10 };
  const exit = shouldReduceMotion ? undefined : { opacity: 0 };

  useEffect(() => {
    // La duración es siempre la misma sin importar la preferencia de movimiento
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="app-splash"
      role="status"
      aria-label="Cargando..."
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={exit}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }}
    >
      <motion.div
        className="app-splash__content"
        initial={entrance}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
      >
        <div style={{ color: 'var(--color-primary)' }}>
          <MorphingIcon 
            icon={icon} 
            size={48} 
            spring={shouldReduceMotion ? 'snappy' : 'bouncy'}
            aria-hidden="true"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
