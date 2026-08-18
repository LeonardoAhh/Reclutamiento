import { motion } from 'framer-motion';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { useMorphingSequence } from '@/hooks/useMorphingSequence';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  title?: string;
}

export function TransitionLoader({ 
  title = "Sincronizando..."
}: TransitionLoaderProps) {
  const { icon, shouldReduceMotion } = useMorphingSequence();

  return (
    <div className="transition-loader" role="status" aria-live="polite" aria-label={title}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="transition-loader__content"
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
    </div>
  );
}
