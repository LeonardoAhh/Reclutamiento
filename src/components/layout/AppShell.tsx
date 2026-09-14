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

/**
 * Shell de la app autenticada.
 *  - Desktop (>=1080px): Sidebar fijo a la izquierda + contenido desplazado.
 *  - Tablet/movil (<1080px): Header superior + Sidebar deslizable.
 */
export function AppShell({ children }: { children: ReactNode }) {
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
    <div className="app-shell">
      <SessionNotice />
      <Header
        onMobileMenuToggle={toggleMobileMenu}
        mobileMenuOpen={isMobileMenuOpen}
        mobileMenuButtonRef={mobileMenuButtonRef}
      />
      <Sidebar
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
