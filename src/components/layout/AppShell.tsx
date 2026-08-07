import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NAV_ITEMS } from './navigation';

const STORAGE_KEY = 'sidebar-collapsed';

function readSidebarCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
    // La navegación funciona aunque el almacenamiento no esté disponible.
  }
}


/**
 * Shell de la app autenticada.
 *  - Desktop (>=1024px): Sidebar fijo a la izquierda + contenido desplazado.
 *  - Tablet/movil (<1024px): Header superior + Sidebar deslizable.
 * El estado de colapso del sidebar en escritorio persiste en localStorage.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const currentNavItem = NAV_ITEMS.find((item) => {
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    });

    const pageTitle = currentNavItem ? currentNavItem.label : 'App';
    document.title = `${pageTitle} — Reclutamiento`;
  }, [location.pathname]);

  useEffect(() => {
    persistSidebarCollapsed(collapsed);
    document.body.setAttribute('data-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);

  // Cerrar menú móvil con Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />
      {mobileMenuOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)} 
          aria-hidden="true" 
        />
      )}

      <div className="app-shell__main">
        <Header 
          onMobileMenuToggle={toggleMobileMenu} 
          mobileMenuOpen={mobileMenuOpen} 
        />
        {children}
      </div>
    </div>
  );
}