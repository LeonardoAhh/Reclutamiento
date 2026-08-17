import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { LayoutDashboard, Users, BusFront, FileText } from 'lucide';
import './SplashTypewriter.css';

const ICONS = [LayoutDashboard, Users, BusFront, FileText];

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const entrance = shouldReduceMotion ? false : { opacity: 0, y: 10 };
  const exit = shouldReduceMotion ? undefined : { opacity: 0 };
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    // Cambiar de ícono cada 400ms para crear el efecto morphing
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, 400);

    // Duración total reducida
    const timer = setTimeout(onDone, 1600);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
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
            icon={ICONS[iconIndex]} 
            size={48} 
            spring="bouncy"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
