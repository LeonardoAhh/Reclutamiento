import { useEffect, useState } from 'react';
import { Toaster } from 'sileo';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Host de notificaciones (sileo) montado una sola vez en la raíz de la app.
 *
 * - Móvil (<768px): `top-center` — bajo el notch, centrado.
 * - Desktop (≥768px): `bottom-left` — abajo a la izquierda.
 * - Sincroniza su tema con el `data-theme` del documento vía MutationObserver.
 * - `offset.top` respeta el safe-area de iOS.
 */
export function AppToaster() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const isMobile = useIsMobile();

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <Toaster
      position={isMobile ? 'top-center' : 'bottom-left'}
      theme={theme}
      offset={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      options={{ duration: 4000 }}
    />
  );
}