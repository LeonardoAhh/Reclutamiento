import { useEffect, useState } from 'react';
import { Toaster } from 'sileo';

type Theme = 'light' | 'dark';

const DESKTOP_QUERY = '(min-width: 768px)';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

function readIsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Host de notificaciones (sileo) montado una sola vez en la raíz de la app.
 *  - PC (>=768px): top-right (no tapa el header).
 *  - Movil (<768px): top-center (bajo el notch).
 */
export function AppToaster() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [isDesktop, setIsDesktop] = useState<boolean>(readIsDesktop);

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <Toaster
      position={isDesktop ? 'top-right' : 'top-center'}
      theme={theme}
      offset={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      options={{ duration: 4000 }}
    />
  );
}