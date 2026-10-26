import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { BrandMarkPath } from '@/components/ui/BrandMark';

export function SidebarBrand() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="sidebar__brand">
      <motion.span
        className="sidebar__brand-mark"
        variants={fadeUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <svg
          viewBox="0 0 1800 1800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <BrandMarkPath />
        </svg>
      </motion.span>
      <span className="sidebar__brand-text">
        <span className="sidebar__brand-title">ViñoPlastic</span>
        <span className="sidebar__brand-subtitle">Reclutamiento</span>
      </span>
    </div>
  );
}
