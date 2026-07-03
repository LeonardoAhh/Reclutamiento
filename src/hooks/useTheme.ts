import { useCallback, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'reclutamiento_theme';

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}
type StartViewTransition = (cb: () => void | Promise<void>) => ViewTransition;

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Colores exactos del canvas por tema — deben coincidir con los tokens
 * `--color-canvas` de global.css. */
const CANVAS_BY_THEME: Record<Theme, string> = {
  light: '#f6f5f4',
  dark: '#191817',
};

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.backgroundColor = CANVAS_BY_THEME[theme];
  const meta = document.getElementById('theme-color-meta');
  if (meta) {
    meta.setAttribute('content', CANVAS_BY_THEME[theme]);
  }
}

/**
 * Theme controller. Persiste en localStorage, sigue preferencia del SO por
 * defecto, y expone `theme` + `toggleTheme()` + `setTheme(t)`.
 *
 * Si el navegador soporta View Transitions API y el usuario no tiene
 * `prefers-reduced-motion`, el cambio se envuelve en un cross-fade de 200ms.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      applyTheme(theme);
      window.localStorage.setItem(STORAGE_KEY, theme);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);

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

    /* Fallback: sin View Transitions, aplicar directo */
    applyTheme(theme);
  }, [theme]);

  /* Sync con cambios del SO */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange(e: MediaQueryListEvent) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== 'light' && stored !== 'dark') {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, setTheme };
}

