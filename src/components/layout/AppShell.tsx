import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';

const STORAGE_KEY = 'sidebar-collapsed';

/**
 * Shell de la app autenticada.
 *  - Desktop (>=1024px): Sidebar fijo a la izquierda + contenido desplazado.
 *  - Tablet/movil (<1024px): Header superior + BottomTabBar (sin sidebar).
 * El estado de colapso del sidebar persiste en localStorage.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), []);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className="app-shell__main">
        <Header />
        {children}
        <div className="bottom-nav-spacer" aria-hidden="true" />
        <BottomTabBar />
      </div>
    </div>
  );
}