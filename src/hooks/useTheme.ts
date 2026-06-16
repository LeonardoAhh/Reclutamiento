import { useCallback, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeOrigin = { x: number; y: number };

const STORAGE_KEY = 'reclutamiento_theme';

/* ── Tipado mínimo de View Transitions API ──────────────────────────────
   Soporte: Chrome 111+, Edge 111+, Safari 18+ (sept 2024). En navegadores
   sin soporte hacemos graceful degradation a la transición CSS clásica.
─────────────────────────────────────────────────────────────────────── */
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

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // El safe-area superior en iOS lo pinta el <html>.
  root.style.backgroundColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  const meta = document.getElementById('theme-color-meta');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
  }
}

/**
 * Theme controller. Persiste en localStorage, sigue preferencia del SO por
 * defecto, y expone `theme` + `toggleTheme(origin?)` + `setTheme(t, origin?)`.
 *
 * Si el navegador soporta View Transitions API y el usuario no tiene
 * `prefers-reduced-motion`, el cambio de tema se envuelve en una transición
 * con clip-path circular que se expande desde el `origin` (centro del toggle).
 * El layout pinta el snapshot anterior y el nuevo en paralelo durante ~300ms.
 *
 * Las animaciones por capa (header, bottom-tab-bar, root) viven en CSS
 * (`::view-transition-*`) y crean el stagger sin orquestación JS.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const firstRender = useRef(true);

  /* ── Aplica el tema; opcionalmente vía View Transitions ─────────────── */
  useEffect(() => {
    /* Primer render: aplicar sin transición (ya lo hizo el script inline
       de index.html, pero aseguramos consistencia). */
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

    const startVT = (
      document as Document & { startViewTransition?: StartViewTransition }
    ).startViewTransition;

    if (reduceMotion || typeof startVT !== 'function') {
      applyTheme(theme);
      return;
    }

    startVT.call(document, () => {
      applyTheme(theme);
    });
  }, [theme]);

  /* ── Sync con cambios del SO sólo si el usuario no eligió manual ───── */
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

  /* ── Setter con origen para la animación circular ──────────────────── */
  const setTheme = useCallback((next: Theme, origin?: ThemeOrigin) => {
    if (origin) {
      const root = document.documentElement;
      root.style.setProperty('--theme-origin-x', `${origin.x}px`);
      root.style.setProperty('--theme-origin-y', `${origin.y}px`);
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(
    (origin?: ThemeOrigin) => {
      setThemeState((prev) => {
        if (origin) {
          const root = document.documentElement;
          root.style.setProperty('--theme-origin-x', `${origin.x}px`);
          root.style.setProperty('--theme-origin-y', `${origin.y}px`);
        }
        return prev === 'dark' ? 'light' : 'dark';
      });
    },
    [],
  );

  return { theme, toggleTheme, setTheme };
}
