import { useEffect, useState } from 'react';
import { Toaster } from 'sileo';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

/**
 * Host de notificaciones (sileo) montado una sola vez en la raíz de la app.
 *
 * - Posición `top-center` (mobile-first: aparece bajo el notch, centrado).
 * - Sincroniza su tema con el `data-theme` del documento vía MutationObserver,
 *   así el toast acompaña el toggle claro/oscuro sin context extra.
 * - `offset.top` respeta el safe-area de iOS.
 */
export function AppToaster() {
  const [theme, setTheme] = useState<Theme>(readTheme);

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
      position="top-center"
      theme={theme}
      offset={{
        top: 'calc(var(--header-height, 64px) + env(safe-area-inset-top, 0px) + 0.5rem)',
      }}
      options={{ duration: 4000 }}
    />
  );
}
