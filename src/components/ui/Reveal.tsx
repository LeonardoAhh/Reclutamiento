import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retraso extra (s) antes de animar. */
  delay?: number;
  /** Tag a renderizar (default div). */
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Revela su contenido (fade + slide) cuando entra en viewport.
 * Scroll-driven, una sola vez. Respeta reduced-motion vía MotionConfig.
 */
export function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ delay }}
    >
      {children}
    </Comp>
  );
}

/**
 * Contenedor que escalona (stagger) la entrada de sus hijos `RevealItem`
 * al entrar en viewport.
 */
export function RevealList({
  children,
  className,
  as = 'div',
}: Omit<RevealProps, 'delay'>) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-6% 0px' }}
    >
      {children}
    </Comp>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}

/** Hijo de `RevealList`. */
export function RevealItem({ children, className, as = 'div' }: RevealItemProps) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={staggerItem}>
      {children}
    </Comp>
  );
}
