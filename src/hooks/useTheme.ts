import { useCallback, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'reclutamiento_theme';

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

/**
 * Theme controller. Persiste las preferencias explícitas en localStorage,
 * sigue al sistema cuando no hay override y permite volver a esa preferencia.
 *
 * Si el navegador soporta View Transitions API y el usuario no tiene
 * `prefers-reduced-motion`, el cambio usa las duraciones definidas por tokens.
 */
export function useTheme() {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = preference === 'system' ? systemTheme : preference;
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;

      /* El script de index.html aplica el tema antes del primer paint. Cuando
         ThemeToggle se monta dentro de un popover, no debemos volver a escribir
         el atributo raíz: hacerlo fuerza un repintado completo aunque el valor
         sea el mismo. Solo sincronizamos si el documento quedó desalineado. */
      if (document.documentElement.getAttribute('data-theme') !== theme) {
        applyTheme(theme);
      } else {
        syncBrowserChrome();
      }
      return;
    }

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

    /* Fallback: sin View Transitions, aplicar directo. */
    applyTheme(theme);
  }, [theme]);

  /* Sync con cambios del SO */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange(e: MediaQueryListEvent) {
      setSystemTheme(e.matches ? 'dark' : 'light');
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setPreferenceState(next);
  }, []);

  const setThemePreference = useCallback((next: ThemePreference) => {
    if (next === 'system') {
      clearStoredTheme();
      setSystemTheme(getSystemTheme());
    } else {
      persistTheme(next);
    }
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    setPreferenceState(next);
  }, [theme]);

  return {
    theme,
    preference,
    toggleTheme,
    setTheme,
    setThemePreference,
  };
}
