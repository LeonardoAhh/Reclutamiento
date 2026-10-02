import { useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeSnapshot {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  storageError: boolean;
}

interface ThemeController {
  getSnapshot: () => ThemeSnapshot;
  subscribe: (listener: () => void) => () => void;
  setPreference: (preference: ThemePreference) => void;
}

declare global {
  interface Window {
    reclutamientoTheme: ThemeController;
  }
}

const SERVER_SNAPSHOT: ThemeSnapshot = {
  preference: 'system',
  resolvedTheme: 'light',
  storageError: false,
};

export function useTheme() {
  const controller = window.reclutamientoTheme;
  if (!controller) throw new Error('No se inicializó el controlador de apariencia.');

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => SERVER_SNAPSHOT,
  );
  return { ...snapshot, setPreference: controller.setPreference };
}
