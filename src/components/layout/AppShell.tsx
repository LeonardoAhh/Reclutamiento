import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NAV_ITEMS } from './navigation';
import { EMPLEADOS_PATH, isPlantillaPath, PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { FEATURES, getConfiguracionHref } from '@/lib/configuracionNavigation';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SessionNotice } from './SessionNotice';

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
 *  - Desktop (>=1080px): Sidebar fijo a la izquierda + contenido desplazado.
 *  - Tablet/movil (<1080px): Header superior + Sidebar deslizable.
 * El estado de colapso del sidebar en escritorio persiste en localStorage.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const isMobileMenuOpen = mobileMenuOpen && !isDesktop;
  const location = useLocation();

  useEffect(() => {
    const currentNavItem = NAV_ITEMS.find((item) => {
      if (item.to === PLANTILLA_PATH) return isPlantillaPath(location.pathname);
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    });

    const feature = FEATURES.find(({ id }) => getConfiguracionHref(id) === location.pathname);
    let pageTitle = currentNavItem?.label ?? feature?.label ?? 'App';
    if (location.pathname === EMPLEADOS_PATH) pageTitle = 'Empleados';
    document.title = pageTitle;
  }, [location.pathname]);

  useEffect(() => {
    persistSidebarCollapsed(collapsed);
    document.body.setAttribute('data-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-sidebar-collapsed');
    };
  }, []);

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), []);
  const closeMobileMenu = useCallback(() => {
    if (!mobileMenuOpen) return;
    setMobileMenuOpen(false);
    if (!isDesktop) mobileMenuButtonRef.current?.focus();
  }, [mobileMenuOpen, isDesktop]);
  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) closeMobileMenu();
    else setMobileMenuOpen(true);
  }, [mobileMenuOpen, closeMobileMenu]);

  // No conservar un overlay móvil al cambiar a escritorio y volver a móvil.
  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false);
  }, [isDesktop]);

  // Cerrar menú móvil con Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <SessionNotice />
      <Header
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onMobileMenuToggle={toggleMobileMenu}
        mobileMenuOpen={isMobileMenuOpen}
        mobileMenuButtonRef={mobileMenuButtonRef}
      />
      <Sidebar
        collapsed={collapsed}
        mobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      {isMobileMenuOpen && (
        <button
          type="button"
          className="sidebar-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Cerrar menú"
        />
      )}

      <div className="app-shell__main">
        {children}
      </div>
    </div>
  );
}
