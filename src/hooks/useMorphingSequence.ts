import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  CircleCheckBig,
  ChartNoAxesCombined,
  Fingerprint,
  LogOut,
  NotebookText,
  PanelLeft,
  Route,
  UserSearch,
} from 'lucide';
import type { IconInput } from 'morphicons/react';

const LOADER_ICONS = [
  ChartNoAxesCombined,
  UserSearch,
  Route,
  NotebookText,
] as const satisfies readonly IconInput[];

const WORKSPACE_ENTRY_ICONS = [
  Fingerprint,
  CircleCheckBig,
  PanelLeft,
] as const satisfies readonly IconInput[];

const WORKSPACE_EXIT_ICONS = [
  PanelLeft,
  LogOut,
  CircleCheckBig,
] as const satisfies readonly IconInput[];

export type MorphingSequence = 'default' | 'workspace-entry' | 'workspace-exit';

/** Ritmo central de la secuencia; corresponde al token de movimiento spring. */
const MORPHING_SEQUENCE_INTERVAL_MS = 400;

/**
 * Provee la secuencia animada de íconos para las pantallas de carga.
 * Respeta `prefers-reduced-motion` deteniendo el intervalo automáticamente.
 */
export function useMorphingSequence(
  sequence: MorphingSequence = 'default',
  intervalMs = MORPHING_SEQUENCE_INTERVAL_MS,
) {
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [iconIndex, setIconIndex] = useState(0);
  const icons = sequence === 'workspace-entry'
    ? WORKSPACE_ENTRY_ICONS
    : sequence === 'workspace-exit'
      ? WORKSPACE_EXIT_ICONS
      : LOADER_ICONS;
  const safeIntervalMs = Number.isFinite(intervalMs) && intervalMs > 0
    ? intervalMs
    : MORPHING_SEQUENCE_INTERVAL_MS;

  useEffect(() => {
    setIconIndex(0);
  }, [sequence]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setIconIndex((previousIndex) => (previousIndex + 1) % icons.length);
    }, safeIntervalMs);

    return () => window.clearInterval(interval);
  }, [icons.length, safeIntervalMs, shouldReduceMotion]);

  return {
    icon: icons[shouldReduceMotion ? 0 : iconIndex],
    shouldReduceMotion,
  };
}
