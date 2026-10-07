import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ACCOUNT_PATH, HOME_PATH, TEAM_PATH, VACANCY_ASSIGNMENTS_PATH, getLocalizedNavigation } from './navigation';
import { isPlantillaPath, PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { FEATURES, getConfiguracionHref } from '@/lib/configuracionNavigation';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SessionNotice } from './SessionNotice';
import { CAREER_PATH } from '@/features/career/types';
import { REPORT_COMPARISON_PATH } from '@/components/reporte-diario/navigation';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_TITLES: Readonly<Record<string, string>> = {
  [HOME_PATH]: 'Inicio',
  [CAREER_PATH]: 'Tu camino profesional',
  '/employee-turnover': 'Rotación',
  '/departure-reasons': 'Motivos de baja',
  [DATA_UPDATE_PATH]: 'Actualización de datos',
  [ACCOUNT_PATH]: 'Cuenta',
  [TEAM_PATH]: 'Equipo',
  [VACANCY_ASSIGNMENTS_PATH]: 'Asignación de vacantes',
};

/**
 * Shell de la app autenticada.
 *  - Desktop (>=1080px): Sidebar fijo a la izquierda + contenido desplazado.
 *  - Tablet/movil (<1080px): Header superior + Sidebar deslizable.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const restoreMenuFocusRef = useRef(false);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const isMobileMenuOpen = mobileMenuOpen && !isDesktop;
  const location = useLocation();

  const pageTitle = useMemo(() => {
    if (location.pathname === REPORT_COMPARISON_PATH) return language === 'en' ? 'Monthly comparison' : 'Comparativa mensual';
    if (location.pathname === CANDIDATE_METRICS_PATH) return language === 'en' ? 'Metrics and KPIs' : 'Métricas y KPIs';
    if (language === 'en' && location.pathname === ACCOUNT_PATH) return 'Account';
    if (language === 'en' && location.pathname === TEAM_PATH) return 'Team';
    if (language === 'en' && location.pathname === VACANCY_ASSIGNMENTS_PATH) return 'Vacancy assignments';
    const currentNavItem = getLocalizedNavigation(language)
      .flatMap((section) => section.items)
      .find((item) => {
        if (item.to === PLANTILLA_PATH) return isPlantillaPath(location.pathname);
        if (item.end) return location.pathname === item.to;
        return location.pathname.startsWith(item.to);
      });
    const feature = FEATURES.find(({ id }) => getConfiguracionHref(id) === location.pathname);
    return currentNavItem?.label ?? PAGE_TITLES[location.pathname] ?? feature?.label ?? 'App';
  }, [language, location.pathname]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const closeMobileMenu = useCallback(() => {
    if (!mobileMenuOpen) return;
    restoreMenuFocusRef.current = !isDesktop;
    setMobileMenuOpen(false);
  }, [mobileMenuOpen, isDesktop]);
  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) closeMobileMenu();
    else setMobileMenuOpen(true);
  }, [mobileMenuOpen, closeMobileMenu]);

  // No conservar un overlay móvil al cambiar a escritorio y volver a móvil.
  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (isMobileMenuOpen || !restoreMenuFocusRef.current) return;
    restoreMenuFocusRef.current = false;
    mobileMenuButtonRef.current?.focus();
  }, [isMobileMenuOpen]);

  // Cerrar menú móvil con Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !(e.target instanceof Node)) return;
      if (document.getElementById('app-sidebar')?.contains(e.target)) {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <div className="app-shell">
      <SessionNotice />
      <Sidebar
        mobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      {isMobileMenuOpen && (
        <button
          type="button"
          className="sidebar-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label={language === 'en' ? 'Close menu' : 'Cerrar menú'}
          tabIndex={-1}
        />
      )}

      <div className="app-shell__workspace" inert={isMobileMenuOpen}>
        <Header
          onMobileMenuToggle={toggleMobileMenu}
          mobileMenuOpen={isMobileMenuOpen}
          mobileMenuButtonRef={mobileMenuButtonRef}
          language={language}
        />
        <div className="app-shell__main">
          {children}
        </div>
      </div>
    </div>
  );
}
