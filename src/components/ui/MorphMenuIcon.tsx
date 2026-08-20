import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

interface MorphMenuIconProps {
  isOpen: boolean;
  size?: number;
  className?: string;
}

export function MorphMenuIcon({ isOpen, size = 24, className = '' }: MorphMenuIconProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Si el usuario prefiere reducir movimiento, la animación será instantánea (duration: 0)
  const transition = {
    duration: shouldReduceMotion ? 0 : 0.25,
    ease: EASE_OUT
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <motion.path
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          closed: { d: "M4 6 L20 6" },
          open: { d: "M6 6 L18 18" }
        }}
        transition={transition}
      />
      <motion.path
        d="M4 12 L20 12"
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          closed: { opacity: 1, scale: 1 },
          open: { opacity: 0, scale: 0.5 }
        }}
        transition={transition}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.path
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          closed: { d: "M4 18 L20 18" },
          open: { d: "M6 18 L18 6" }
        }}
        transition={transition}
      />
    </svg>
  );
}
