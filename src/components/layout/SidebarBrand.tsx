import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

/** Símbolo de la marca; coincide con el trazo de /public/icon.svg. */
const BRAND_MARK_PATH =
  'M1000.46 450C1174.77 450 1278.43 553.669 1278.43 691.282C1278.43 828.896 1174.77 932.563 1000.46 932.563H912.382L1350 1350H1040.82L707.794 1033.48C683.944 1011.47 672.936 985.781 672.935 963.765C672.935 932.572 694.959 905.049 737.161 893.122L908.712 847.244C973.85 829.812 1018.81 779.353 1018.81 713.298C1018.8 632.567 952.745 585.78 871.095 585.78H450V450H1000.46Z';

interface SidebarBrandProps {
  /** Nombre accesible de la marca; conserva la grafía original. */
  name: string;
}

/**
 * Marca de la sidebar: el símbolo de ViñoPlastic como SVG animado.
 * Reutiliza el reveal `fadeUp` del sistema; con movimiento reducido se
 * muestra estático. El color lo hereda de `currentColor`.
 */
export function SidebarBrand({ name }: SidebarBrandProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.svg
      className="sidebar__brand-mark"
      viewBox="0 0 1800 1800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={name}
      variants={fadeUp}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <path d={BRAND_MARK_PATH} fill="currentColor" />
    </motion.svg>
  );
}
