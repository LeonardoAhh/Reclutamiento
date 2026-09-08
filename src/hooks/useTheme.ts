import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'reclutamiento_theme';
const themeListeners = new Set<() => void>();
let systemThemeQuery: MediaQueryList | null = null;

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}
type StartViewTransition = (cb: () => void | Promise<void>) => ViewTransition;

function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // El tema sigue funcionando durante la sesión aunque el storage no esté disponible.
  }
}

function clearStoredTheme(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // El tema del sistema sigue funcionando aunque el storage no esté disponible.
  }
}

function notifyThemeListeners(): void {
  themeListeners.forEach((listener) => listener());
}

function handleSystemThemeChange(): void {
  notifyThemeListeners();
}

function handleThemeStorageChange(event: StorageEvent): void {
  if (event.key === STORAGE_KEY) notifyThemeListeners();
}

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);

  if (themeListeners.size === 1) {
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('storage', handleThemeStorageChange);
  }

  return () => {
    themeListeners.delete(listener);
    if (themeListeners.size > 0) return;

    systemThemeQuery?.removeEventListener('change', handleSystemThemeChange);
    systemThemeQuery = null;
    window.removeEventListener('storage', handleThemeStorageChange);
  };
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  return getStoredTheme() ?? 'system';
}

function syncBrowserChrome(): void {
  const root = document.documentElement;
  const canvas = window
    .getComputedStyle(root)
    .getPropertyValue('--color-canvas-soft')
    .trim();
  if (!canvas) return;

  const meta = document.getElementById('theme-color-meta');
  meta?.setAttribute('content', canvas);
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  syncBrowserChrome();
}

/** Estado y acciones compartidos para la preferencia visual de la aplicación. */
export function useTheme() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribeTheme,
    getInitialPreference,
    () => 'system',
  );
  const systemTheme = useSyncExternalStore<Theme>(
    subscribeTheme,
    getSystemTheme,
    () => 'light',
  );
  const theme = preference === 'system' ? systemTheme : preference;

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    notifyThemeListeners();
  }, []);

  const setThemePreference = useCallback((next: ThemePreference) => {
    if (next === 'system') {
      clearStoredTheme();
    } else {
      persistTheme(next);
    }
    notifyThemeListeners();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    notifyThemeListeners();
  }, [theme]);

  return {
    theme,
    preference,
    toggleTheme,
    setTheme,
    setThemePreference,
  };
}

/** Aplica una sola vez al documento los cambios emitidos por el estado compartido. */
export function useThemeController(): void {
  const { theme } = useTheme();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;

      /* index.html resuelve el tema antes del primer paint; aquí solo corregimos
         una posible desalineación y sincronizamos el chrome del navegador. */
      if (document.documentElement.getAttribute('data-theme') !== theme) {
        applyTheme(theme);
      } else {
        syncBrowserChrome();
      }
      return;
    }

    if (document.documentElement.getAttribute('data-theme') === theme) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduceMotion) {
      applyTheme(theme);
      return;
    }

    const startVT = (
      document as Document & { startViewTransition?: StartViewTransition }
    ).startViewTransition;

    if (typeof startVT === 'function') {
      startVT.call(document, () => {
        applyTheme(theme);
      });
      return;
    }

    applyTheme(theme);
  }, [theme]);
}
