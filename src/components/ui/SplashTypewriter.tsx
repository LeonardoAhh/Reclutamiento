import { motion } from 'framer-motion';
import { Typewriter } from './Typewriter';
import './SplashTypewriter.css';

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
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
      <Typewriter
        text="RECLUTAMIENTO QUERÉTARO"
        speed={0.06}
        delay={0.2}
        className="splash-typewriter__text"
        onComplete={() => {
          // Add a short delay after typing finishes before dismissing
          setTimeout(onDone, 800);
        }}
      />
    </motion.div>
  );
}
