import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { motionDistance, motionTransition, type MotionTransitionToken } from '@/lib/motionTokens';

/**
 * Transición y distancia tokenizadas para framer-motion. Con movimiento
 * reducido la duración y el desplazamiento son 0: el contenido aparece en su
 * estado final sin animación.
 */
export function useMotionTokens(token: MotionTransitionToken = '--transition-base') {
  const reduce = useReducedMotion() ?? false;
  return useMemo(() => ({
    reduce,
    transition: reduce ? { duration: 0 } : motionTransition(token),
    distance: reduce ? 0 : motionDistance('--motion-float-distance'),
  }), [reduce, token]);
}
