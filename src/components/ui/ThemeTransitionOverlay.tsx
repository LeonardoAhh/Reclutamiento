import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './ThemeTransitionOverlay.css';

/**
 * Fallback de la animación de cambio de tema para navegadores SIN
 * View Transitions API (iOS Safari < 18, Firefox, WebViews antiguas).
 *
 * Funcionamiento:
 *  - `useTheme` dispatcha `theme:transition` con `{ x, y, prevBg }` justo
 *    ANTES de aplicar el nuevo tema.
 *  - El overlay aparece con el color del tema VIEJO cubriendo toda la
 *    pantalla, y se contrae como un círculo (clip-path) hacia el punto
 *    `(x, y)` del toggle, descubriendo el nuevo tema debajo.
 *  - Apple-style spring (cubic-bezier(0.32, 0.72, 0, 1)), ~320 ms.
 *
 * Si VT API SÍ está disponible, useTheme NO dispatcha el evento y este
 * overlay nunca se renderiza — la transición la hace el navegador con CSS
 * de `::view-transition-*`.
 */

type Detail = {
  x: number;
  y: number;
  prevBg: string;
  id: number;
};

export function ThemeTransitionOverlay() {
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    function onTransition(e: Event) {
      const ce = e as CustomEvent<Omit<Detail, 'id'>>;
      setDetail({ ...ce.detail, id: Date.now() });
    }
    window.addEventListener('theme:transition', onTransition);
    return () => window.removeEventListener('theme:transition', onTransition);
  }, []);

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          key={detail.id}
          className="theme-transition-overlay"
          aria-hidden="true"
          style={{ backgroundColor: detail.prevBg }}
          initial={{
            clipPath: `circle(150% at ${detail.x}px ${detail.y}px)`,
          }}
          animate={{
            clipPath: `circle(0% at ${detail.x}px ${detail.y}px)`,
          }}
          exit={{ opacity: 0 }}
          transition={{
            clipPath: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
            opacity: { duration: 0.12 },
          }}
          onAnimationComplete={() => setDetail(null)}
        />
      )}
    </AnimatePresence>
  );
}
