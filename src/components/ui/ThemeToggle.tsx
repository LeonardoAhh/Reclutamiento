import { motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide';
import { useTheme } from '@/hooks/useTheme';
import { useFeedback } from '@/hooks/useFeedback';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
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
        <MorphingIcon
          icon={isDark ? Moon : Sun}
          size={14}
          strokeWidth={2.5}
          className="theme-toggle__icon"
        />
      </motion.span>
    </button>
  );
}
