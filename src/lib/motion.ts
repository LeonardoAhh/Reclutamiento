import type { Variants } from 'framer-motion';

/** Easing de marca (mismo que usa el resto de la app). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Aparición suave hacia arriba — para secciones individuales. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

/** Contenedor que escalona la entrada de sus hijos (stagger). */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** Hijo de un `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};
