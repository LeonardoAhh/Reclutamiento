import { motion } from 'framer-motion';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useTheme } from '@/hooks/useTheme';
import './ThemeToggle.css';

/**
 * ThemeToggle — emblema "split disc + orbital dot".
 *
 * No usa íconos clásicos de sol/luna. Visualiza el estado del tema como un
 * disco partido a la mitad: un hemisferio "ink" y otro "canvas". Un pequeño
 * orbe satélite se mueve sobre el lado oscuro, y todo el emblema rota 180°
 * al alternar el tema (efecto monedita / planeta girando sobre su eje).
 *
 * Al hacer click, se calcula el centro del botón y se pasa como `origin` al
 * hook. El hook lo usa para anclar la transición circular (clip-path) del
 * View Transitions API.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  function handleClick(e: ReactMouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleTheme({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="theme-toggle"
      data-state={isDark ? 'dark' : 'light'}
      data-testid="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9, rotate: -8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      <motion.span
        className="theme-toggle__halo"
        aria-hidden="true"
        animate={{
          opacity: isDark ? 0.35 : 0.18,
          scale: isDark ? 1.08 : 1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      />

      <motion.svg
        viewBox="0 0 32 32"
        className="theme-toggle__emblem"
        aria-hidden="true"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.7 }}
      >
        {/* Hairline ring */}
        <circle
          cx="16"
          cy="16"
          r="11"
          className="theme-toggle__ring"
          fill="none"
        />

        {/* Hemisferio "ink": media luna vertical izquierda */}
        <path
          d="M 16 5 A 11 11 0 0 0 16 27 Z"
          className="theme-toggle__hemisphere"
        />

        {/* Satélite: pequeño orbe sobre el hemisferio ink */}
        <motion.circle
          cx="10.5"
          cy="16"
          r="1.6"
          className="theme-toggle__satellite"
          animate={{
            cy: isDark ? 12 : 16,
            r: isDark ? 1.9 : 1.6,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        />
      </motion.svg>
    </motion.button>
  );
}
