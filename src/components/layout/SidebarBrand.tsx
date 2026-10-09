import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

import { BrandMarkPath } from '@/components/ui/BrandMark';

interface SidebarBrandProps {
  title: string;
}

/**
 * Identidad del usuario en la sidebar junto al símbolo de la aplicación.
 * Reutiliza el reveal `fadeUp` del sistema; con movimiento reducido se
 * muestra estático. El color lo hereda de `currentColor`.
 */
export function SidebarBrand({ title }: SidebarBrandProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="sidebar__brand">
      <motion.svg
        className="sidebar__brand-mark"
        viewBox="0 0 1800 1800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        variants={fadeUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <BrandMarkPath />
      </motion.svg>
      <span className="sidebar__brand-title">{title}</span>
    </div>
  );
}
