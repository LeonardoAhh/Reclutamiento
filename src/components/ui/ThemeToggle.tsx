import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useFeedback } from '@/hooks/useFeedback';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

/**
 * ThemeToggle — interruptor minimalista tipo pill con Sol/Luna.
 * Carril redondeado con un "thumb" deslizante que muestra
 * el ícono del tema actual.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { trigger } = useFeedback();
  const shouldReduceMotion = useReducedMotion();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    trigger('light');
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="theme-toggle"
      data-state={isDark ? 'dark' : 'light'}
      data-testid="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      <motion.span
        className="theme-toggle__thumb"
        layout
        transition={{ type: shouldReduceMotion ? false : 'spring', stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            className="theme-toggle__icon"
            key={isDark ? 'moon' : 'sun'}
            initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: -90 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: 90 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
          >
            {isDark ? <Moon size={14} strokeWidth={2.5} /> : <Sun size={14} strokeWidth={2.5} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
