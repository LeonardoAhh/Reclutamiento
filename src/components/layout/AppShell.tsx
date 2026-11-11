import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ACCOUNT_PATH, HOME_PATH, getLocalizedNavigation, localizeNavigationText } from './navigation';
import { isPlantillaPath, PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { FEATURES, getConfiguracionHref } from '@/lib/configuracionNavigation';
import { DATA_UPDATE_PATH } from '@/features/data-update/types';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SessionNotice } from './SessionNotice';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import { RouteErrorBoundary } from '@/components/ui/RouteErrorBoundary';
import { DotGrid } from '@/components/ui/DotGrid';
import { REPORT_COMPARISON_PATH, REPORT_DAY_PATTERN } from '@/components/reporte-diario/navigation';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import { REPORT_SGI_LABEL, REPORT_SGI_PATH } from '@/pages/report-sgi/navigation';
import { bindSoundInteractions } from '@/lib/sound';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSidebarCollapsed } from './useSidebarCollapsed';
import { ProductTour } from '@/components/ui/ProductTour';
import { SkipLink } from '@/components/ui/SkipLink';
import { useProductTourController } from '@/features/onboarding/useProductTourController';
import './AppShell.css';

const PAGE_TITLES: Readonly<Record<string, string>> = {
  [HOME_PATH]: 'Inicio',
  '/employee-turnover': 'Rotación',
  '/departure-reasons': 'Motivos de baja',
  [DATA_UPDATE_PATH]: 'Actualización de datos',
  [ACCOUNT_PATH]: 'Cuenta',
  [REPORT_SGI_PATH]: REPORT_SGI_LABEL,
};

/**
 * Shell de la app autenticada.
 *  - Desktop (>=1080px): Sidebar fijo y header dentro del workspace.
 *  - Tablet/movil (<1080px): Header superior + Sidebar deslizable.
 */
export function AppShell(props: { children: ReactNode }) {
  const { children } = props;
  const { language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionNoticeReady, setSessionNoticeReady] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const appShellRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRadiusRef = useRef<number | null>(null);
  const edgeWidthRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    startProgress: number;
    sidebarWidth: number;
    dragging: boolean;
  } | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const isMobileMenuOpen = mobileMenuOpen && !isDesktop;
  const location = useLocation();

  const resolveSessionNotice = useCallback(() => setSessionNoticeReady(true), []);

  const setDrawerProgress = useCallback((progress: number, measuredSidebarWidth?: number) => {
    const shell = appShellRef.current;
    const sidebar = sidebarRef.current;
    if (!shell || !sidebar) return;
    const nextProgress = Math.max(0, Math.min(1, progress));
    const width = measuredSidebarWidth ?? sidebar.getBoundingClientRect().width;
    if (workspaceRadiusRef.current === null) {
      const radius = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--workspace-radius'),
      );
      workspaceRadiusRef.current = Number.isFinite(radius) ? radius : 0;
    }
    shell.style.setProperty('--sidebar-progress', String(nextProgress));
    shell.style.setProperty('--sidebar-offset', `${width * nextProgress}px`);
    shell.style.setProperty('--sidebar-corner-radius', `${workspaceRadiusRef.current * nextProgress}px`);
  }, []);
  const {
    profile,
    accountMenuOpen,
    tourReplayRequest,
    tourStepIndex,
    setTourStepIndex,
    handleAccountMenuOpenChange,
    replayProductTour,
    openAccountMenuForTour,
    closeAccountMenuForTour,
    navigateToAccountForTour,
    prepareAccountTourTarget,
  } = useProductTourController({ isDesktop, setDrawerProgress, setMobileMenuOpen });

  const pageTitle = useMemo(() => {
    if (location.pathname === getConfiguracionHref('analisis')) {
      return localizeNavigationText(language, 'Análisis');
    }
    if (matchPath(REPORT_DAY_PATTERN, location.pathname)) return localizeNavigationText(language, 'Detalle del día');
    if (location.pathname === REPORT_COMPARISON_PATH) return localizeNavigationText(language, 'Comparativa mensual');
    if (location.pathname === CANDIDATE_METRICS_PATH) return localizeNavigationText(language, 'Métricas y KPIs');
    const currentNavItem = getLocalizedNavigation(language).find((item) => {
      if (item.to === PLANTILLA_PATH) return isPlantillaPath(location.pathname);
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    });
    const feature = FEATURES.find(({ id }) => getConfiguracionHref(id) === location.pathname);
    return localizeNavigationText(
      language,
      currentNavItem?.label ?? PAGE_TITLES[location.pathname] ?? feature?.label ?? 'App',
    );
  }, [language, location.pathname]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => bindSoundInteractions(document), []);

  const closeMobileMenu = useCallback(() => {
    setDrawerProgress(0);
    setMobileMenuOpen(false);
  }, [setDrawerProgress]);
  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setDrawerProgress(1);
      setMobileMenuOpen(true);
    }
  }, [mobileMenuOpen, closeMobileMenu, setDrawerProgress]);
  const restoreMobileMenuFocus = useCallback(() => mobileMenuButtonRef.current?.focus({ preventScroll: true }), []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isDesktop || !event.isPrimary || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [data-sidebar-no-drag]')) return;
      if (mobileMenuOpen && target?.closest('.sidebar')) return;
      if (!mobileMenuOpen) {
        if (edgeWidthRef.current === null) {
          const edgeWidth = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--touch-target-min'),
          );
          edgeWidthRef.current = Number.isFinite(edgeWidth) ? edgeWidth : 44;
        }
        if (event.clientX > edgeWidthRef.current) return;
      }

      pointerStartRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now(),
        startProgress: mobileMenuOpen ? 1 : 0,
        sidebarWidth: Math.max(1, sidebarRef.current?.getBoundingClientRect().width ?? 0),
        dragging: false,
      };
    },
    [isDesktop, mobileMenuOpen],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pointer = pointerStartRef.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - pointer.startX;
      const deltaY = event.clientY - pointer.startY;
      if (!pointer.dragging) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          pointerStartRef.current = null;
          return;
        }
        if (Math.abs(deltaX) < 8) return;
        pointer.dragging = true;
        const workspace = event.currentTarget.querySelector<HTMLElement>('.app-shell__workspace');
        const visibleProgress = workspace
          ? workspace.getBoundingClientRect().left / pointer.sidebarWidth
          : pointer.startProgress;
        pointer.startProgress = Math.max(0, Math.min(1, visibleProgress - deltaX / pointer.sidebarWidth));
        event.currentTarget.dataset.sidebarDragging = 'true';
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      setDrawerProgress(pointer.startProgress + deltaX / pointer.sidebarWidth, pointer.sidebarWidth);
    },
    [setDrawerProgress],
  );

  const finishPointerGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
      const pointer = pointerStartRef.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;
      pointerStartRef.current = null;
      if (!pointer.dragging) return;

      delete event.currentTarget.dataset.sidebarDragging;
      if (cancelled) {
        setDrawerProgress(mobileMenuOpen ? 1 : 0);
        return;
      }

      const deltaX = event.clientX - pointer.startX;
      const elapsed = Math.max(1, performance.now() - pointer.startTime);
      const progress = pointer.startProgress + deltaX / pointer.sidebarWidth;
      const velocity = deltaX / elapsed;
      const shouldOpen = velocity > 0.5 ? true : velocity < -0.5 ? false : progress >= 0.5;
      setDrawerProgress(shouldOpen ? 1 : 0, pointer.sidebarWidth);
      setMobileMenuOpen(shouldOpen);
    },
    [mobileMenuOpen, setDrawerProgress],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      setDrawerProgress(0);
      setMobileMenuOpen(false);
    };
    mediaQuery.addEventListener('change', closeOnDesktop);
    return () => mediaQuery.removeEventListener('change', closeOnDesktop);
  }, [setDrawerProgress]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMobileMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <div
      ref={appShellRef}
      className="app-shell"
      data-sidebar-collapsed={collapsed}
      data-sidebar-open={isMobileMenuOpen}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      onPointerCancel={(event) => finishPointerGesture(event, true)}
    >
      <SessionNotice onInitialNoticeResolved={resolveSessionNotice} />
      <SkipLink targetId="app-shell-main" />
      <Sidebar
        mobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
        collapsed={isDesktop && collapsed}
        onToggleCollapsed={toggleCollapsed}
        isDesktop={isDesktop}
        sidebarRef={sidebarRef}
        onRestoreMobileFocus={restoreMobileMenuFocus}
        accountMenuOpen={accountMenuOpen}
        onAccountMenuOpenChange={handleAccountMenuOpenChange}
        onReplayTour={replayProductTour}
        tourActive={tourStepIndex !== null}
      />
      {isMobileMenuOpen && (
        <button
          type="button"
          className="app-shell__drawer-scrim"
          aria-label={language === 'en' ? 'Close navigation menu' : 'Cerrar menú de navegación'}
          data-cuelume-close=""
          onClick={closeMobileMenu}
        />
      )}
      <div className="app-shell__workspace" inert={isMobileMenuOpen}>
        <DotGrid />
        <Header
          pageTitle={pageTitle}
          isHome={location.pathname === HOME_PATH}
          isDesktop={isDesktop}
          onMobileMenuToggle={toggleMobileMenu}
          mobileMenuOpen={isMobileMenuOpen}
          mobileMenuButtonRef={mobileMenuButtonRef}
          language={language}
        />
        <div className="app-shell__main" id="app-shell-main" tabIndex={-1}>
          {/* La carga de código de una página no desmonta el shell ni muestra el splash. */}
          <RouteErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
          </RouteErrorBoundary>
        </div>
      </div>
      {profile && (
        <ProductTour
          profileId={profile.id}
          showRecognition={profile.role === 'reclutador'}
          startupOverlaysReady={sessionNoticeReady}
          replayRequest={tourReplayRequest}
          onStepChange={setTourStepIndex}
          onOpenAccountMenu={openAccountMenuForTour}
          onCloseAccountMenu={closeAccountMenuForTour}
          onPrepareAccountTarget={prepareAccountTourTarget}
          onNavigateToAccount={navigateToAccountForTour}
        />
      )}
    </div>
  );
}
