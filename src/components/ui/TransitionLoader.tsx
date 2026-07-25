import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  title?: string;
  hint?: string;
}

export function TransitionLoader({ 
  title = "Sincronizando...", 
  hint = "Por favor espera mientras preparamos tu sesión" 
}: TransitionLoaderProps) {
  return (
    <div className="transition-loader" role="status" aria-live="polite">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="transition-loader__content"
      >
        <Loader2 className="transition-loader__spinner" aria-hidden="true" />
        <div className="transition-loader__text-container">
          <h1 className="transition-loader__title">{title}</h1>
          {hint && <p className="transition-loader__hint">{hint}</p>}
        </div>
      </motion.div>
    </div>
  );
}
