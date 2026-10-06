import { motion, useReducedMotion } from 'framer-motion';
import { BrandMarkPath } from '@/components/ui/BrandMark';
import { useLanguage } from '@/contexts/LanguageContext';
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
    ? english ? 'Preparing your session…' : 'Preparando tu sesión…'
    : variant === 'workspace-exit'
      ? english ? 'Signing out…' : 'Cerrando sesión…'
      : english ? 'Syncing…' : 'Sincronizando…');
  const accessibleMessage = variant === 'workspace-entry' && !title
    ? `${english ? 'Access confirmed.' : 'Acceso confirmado.'} ${message}`
    : message;

  return (
    <div className="transition-loader" role="status" aria-atomic="true">
      <span className="sr-only">{accessibleMessage}</span>
      <motion.div
        className="transition-loader__content"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, y: 'var(--design-spacing-md)' }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.svg
          className="transition-loader__mark"
          viewBox="0 0 1800 1800"
          fill="none"
          initial={reduceMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
        >
          <BrandMarkPath />
        </motion.svg>
        <span className="transition-loader__brand">ViñoPlastic</span>
        <span className="transition-loader__message">{message}</span>
        <span className="transition-loader__track">
          <motion.span
            className="transition-loader__indicator"
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={reduceMotion ? undefined : { type: 'spring', repeat: Infinity, repeatType: 'reverse' }}
          />
        </span>
      </motion.div>
    </div>
  );
}
