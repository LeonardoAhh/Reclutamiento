import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Users, BusFront, FileText } from 'lucide';
import type { IconInput } from 'morphicons/react';

const LOADER_ICONS: IconInput[] = [LayoutDashboard, Users, BusFront, FileText];

/**
 * Provee la secuencia animada de íconos para las pantallas de carga.
 * Respeta `prefers-reduced-motion` deteniendo el intervalo automáticamente.
 */
export function useMorphingSequence(intervalMs = 400) {
  const shouldReduceMotion = useReducedMotion();
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, dejamos el ícono 0 fijo.
    if (shouldReduceMotion) return;

    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % LOADER_ICONS.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [shouldReduceMotion, intervalMs]);

  return {
    icon: LOADER_ICONS[iconIndex],
    shouldReduceMotion,
  };
}
