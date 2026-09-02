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

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
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
 * Theme controller. Persiste en localStorage, sigue preferencia del SO por
 * defecto, y expone `theme` + `toggleTheme()` + `setTheme(t)`.
 *
 * Si el navegador soporta View Transitions API y el usuario no tiene
 * `prefers-reduced-motion`, el cambio usa las duraciones definidas por tokens.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
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
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    setThemeState(next);
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}
