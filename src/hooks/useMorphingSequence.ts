import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Users, BusFront, FileText } from 'lucide';
import type { IconInput } from 'morphicons/react';

const LOADER_ICONS = [LayoutDashboard, Users, BusFront, FileText] satisfies readonly IconInput[];

/** Ritmo central de la secuencia; corresponde al token de movimiento spring. */
export const MORPHING_SEQUENCE_INTERVAL_MS = 400;
export const MORPHING_SEQUENCE_CYCLE_MS = MORPHING_SEQUENCE_INTERVAL_MS * LOADER_ICONS.length;

/**
 * Provee la secuencia animada de íconos para las pantallas de carga.
 * Respeta `prefers-reduced-motion` deteniendo el intervalo automáticamente.
 */
export function useMorphingSequence(intervalMs = MORPHING_SEQUENCE_INTERVAL_MS) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [iconIndex, setIconIndex] = useState(0);
  const safeIntervalMs = Number.isFinite(intervalMs) && intervalMs > 0
    ? intervalMs
    : MORPHING_SEQUENCE_INTERVAL_MS;

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setIconIndex((previousIndex) => (previousIndex + 1) % LOADER_ICONS.length);
    }, safeIntervalMs);

    return () => window.clearInterval(interval);
  }, [safeIntervalMs, shouldReduceMotion]);

  return {
    icon: LOADER_ICONS[shouldReduceMotion ? 0 : iconIndex],
    shouldReduceMotion,
  };
}
