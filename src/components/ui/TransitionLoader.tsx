import { motion, useReducedMotion } from 'framer-motion';
import { LiveOrb } from '@/components/ui/LiveOrb';
import { useLanguage } from '@/contexts/LanguageContext';
import { motionTransition } from '@/lib/motionTokens';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  title?: string;
  variant?: TransitionLoaderVariant;
}

export type TransitionLoaderVariant = 'default' | 'workspace-entry' | 'workspace-exit';

export function TransitionLoader({
  title,
  variant = 'default',
}: TransitionLoaderProps) {
  const reduceMotion = useReducedMotion();
  const { language } = useLanguage();
  const english = language === 'en';
  const message = title ?? (variant === 'workspace-entry'
    ? english ? 'Opening your workspace…' : 'Abriendo tu espacio…'
    : variant === 'workspace-exit'
      ? english ? 'Signing out…' : 'Cerrando sesión…'
      : english ? 'Loading…' : 'Cargando…');
  const accessibleMessage = variant === 'workspace-entry' && !title
    ? `${english ? 'Access confirmed.' : 'Acceso confirmado.'} ${message}`
    : message;
  const orbSize = 'min(var(--design-spacing-section), calc(100vi - max(var(--design-spacing-lg), var(--safe-area-left)) - max(var(--design-spacing-lg), var(--safe-area-right))))';

  return (
    <div className="transition-loader" role="status" aria-atomic="true">
      <span className="sr-only">{accessibleMessage}</span>
      <motion.div
        className="transition-loader__content"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, y: 'var(--design-spacing-md)' }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : motionTransition('--transition-base')}
      >
        <LiveOrb size={orbSize} />
        <span className="transition-loader__brand">ViñoPlastic</span>
        <span className="transition-loader__message">{message}</span>
        <span className="transition-loader__track">
          <span className="transition-loader__indicator" />
        </span>
      </motion.div>
    </div>
  );
}
