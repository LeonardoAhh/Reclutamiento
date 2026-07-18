import { motion } from 'framer-motion';
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
      {/* ── Enhanced Monochrome Loader (KokonutUI Port) ── */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className="transition-loader__ring-container"
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      >
        {/* Outer elegant ring with shimmer */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="transition-loader__ring transition-loader__ring--outer"
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {/* Primary animated ring with gradient */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="transition-loader__ring transition-loader__ring--primary"
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: [0.4, 0, 0.6, 1] }}
        />

        {/* Secondary elegant ring - counter rotation */}
        <motion.div
          animate={{ rotate: [0, -360] }}
          className="transition-loader__ring transition-loader__ring--secondary"
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: [0.4, 0, 0.6, 1] }}
        />

        {/* Accent particles */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          className="transition-loader__ring transition-loader__ring--accent"
          transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </motion.div>

      {/* Enhanced Typography with Breathing Animation */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.4, 0, 0.2, 1] }}
        className="transition-loader__text-container"
      >
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="transition-loader__title"
        >
          <motion.span
            animate={{ opacity: [0.9, 0.7, 0.9] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: [0.4, 0, 0.6, 1] }}
          >
            {title}
          </motion.span>
        </motion.h1>

        {hint && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="transition-loader__hint"
          >
            <motion.span
              animate={{ opacity: [0.6, 0.4, 0.6] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: [0.4, 0, 0.6, 1] }}
            >
              {hint}
            </motion.span>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
