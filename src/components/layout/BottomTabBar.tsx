import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Menu,
  X,
  LayoutDashboard,
  CalendarRange,
  Briefcase,
  Contact,
  Map,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { useReporteDiario } from '@/hooks/useReporteDiario';
import { parseReporteJSON, isIncidence } from '@/components/reporte-diario/helpers';
import './BottomTabBar.css';

type TabItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/** Dos accesos principales, siempre visibles en la barra. */
const PRIMARY_TABS: ReadonlyArray<TabItem> = [
  { to: '/', label: 'KPIs', icon: BarChart3, end: true },
  { to: '/pipeline', label: 'Candidatos', icon: Users },
];

/** Resto de accesos, dentro del menú desplegable. */
const MENU_TABS: ReadonlyArray<TabItem> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reporte-diario', label: 'Reporte Diario', icon: CalendarRange },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/empleados', label: 'Empleados', icon: Contact },
  { to: '/rutas', label: 'Rutas', icon: Map },
];

/**
 * Navbar inferior minimalista para móvil/PWA (≤767px). Centrada, flotante.
 * 2 accesos principales (KPIs, Candidatos) + botón "Menú" que despliega un
 * bottom-sheet con el resto de páginas, la sesión activa y cerrar sesión.
 *
 * Patrones: safe-area-inset, touch targets ≥44px, Esc / click-outside,
 * body scroll-lock y restauración de foco al trigger.
 */
export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, signOut } = useAuth();
  const { show, hide } = useLoader();
  const { fetchSummaries } = useReporteDiario();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showReporteBadge, setShowReporteBadge] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /* ── Anti-salto en scroll (iOS Safari) ───────────────────────────────
     La barra del navegador se colapsa/expande al hacer scroll y cambia
     `env(safe-area-inset-bottom)`, lo que hace "saltar" la navbar fija.
     Con la VisualViewport API la pegamos al fondo VISIBLE real, así no se
     mueve de lugar. En la PWA instalada el gap es 0 (no hace nada). */
  useEffect(() => {
    const vv = window.visualViewport;
    const nav = navRef.current;
    if (!vv || !nav) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const gap = Math.max(
          0,
          document.documentElement.clientHeight - vv.height - vv.offsetTop
        );
        nav.style.transform = gap > 0.5 ? `translateY(${-gap}px)` : '';
      });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const isPath = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);
  const menuActive = MENU_TABS.some((t) => isPath(t.to));

  // Cerrar al cambiar de ruta.
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  // Scroll-lock + Esc + restaurar foco.
  useEffect(() => {
    if (!sheetOpen) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSheetOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
      triggerRef.current?.focus();
    };
  }, [sheetOpen]);

  /* ── Badge del Menú ──────────────────────────────────────────────
     Punto indicador cuando hay un reporte cargado que: (a) tiene
     incidencias para el día de hoy, o (b) aún no está guardado en
     Supabase. Se calcula desde el cache de sesión del Reporte Diario
     para mantener la navbar desacoplada de la página. */
  const recomputeBadge = useCallback(async () => {
    try {
      const cached = sessionStorage.getItem('reporteDiarioCache');
      if (!cached) {
        setShowReporteBadge(false);
        return;
      }
      const { rows } = parseReporteJSON(JSON.parse(cached));
      if (!rows.length) {
        setShowReporteBadge(false);
        return;
      }
      const mes = rows[0].mes;

      // (a) Incidencias del día de hoy (sólo si el reporte es del mes actual).
      const now = new Date();
      const todayMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let todayIncidents = 0;
      if (mes === todayMes) {
        const dayKey = String(now.getDate()).padStart(2, '0');
        for (const r of rows) {
          if (isIncidence(r.days[dayKey])) todayIncidents++;
        }
      }

      // (b) ¿Sin guardar en Supabase? (el mes no existe en los resúmenes).
      const summaries = await fetchSummaries();
      const isSaved = summaries.some((s) => s.mes === mes);

      setShowReporteBadge(todayIncidents > 0 || !isSaved);
    } catch {
      setShowReporteBadge(false);
    }
  }, [fetchSummaries]);

  // Recalcular al montar, al cambiar de ruta y cuando el reporte cambie.
  useEffect(() => {
    recomputeBadge();
  }, [recomputeBadge, location.pathname]);

  useEffect(() => {
    const handler = () => recomputeBadge();
    window.addEventListener('reporte-diario:changed', handler);
    return () => window.removeEventListener('reporte-diario:changed', handler);
  }, [recomputeBadge]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const displayName = username ? username.split('@')[0].toUpperCase() : '';
    show({ tone: 'logout', title: displayName });
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setSheetOpen(false);
      window.setTimeout(hide, 7000);
    }
  };

  if (!username) return null;

  return (
    <>
      <nav className="bottom-nav" aria-label="Navegación inferior" ref={navRef}>
        <div className="bottom-nav__group">
          <div className="bottom-nav__bar">
            {PRIMARY_TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `bottom-nav__btn${isActive ? ' bottom-nav__btn--active' : ''}`
                }
                data-testid={`bottom-nav-${to.replace('/', '') || 'kpis'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="bottom-nav__pill"
                        aria-hidden="true"
                      />
                    )}
                    <Icon size={20} aria-hidden="true" className="bottom-nav__icon" />
                    <span className="bottom-nav__label">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <button
            ref={triggerRef}
            type="button"
            className={`bottom-nav__fab${menuActive || sheetOpen ? ' bottom-nav__fab--active' : ''}`}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            aria-controls="bottom-nav-sheet"
            aria-label={showReporteBadge ? 'Menú (hay novedades)' : 'Menú'}
            onClick={() => setSheetOpen((v) => !v)}
            data-testid="bottom-nav-menu-btn"
          >
            <Menu size={22} aria-hidden="true" className="bottom-nav__icon" />
            {showReporteBadge && (
              <span className="bottom-nav__badge" aria-hidden="true" data-testid="bottom-nav-badge" />
            )}
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <div
          className="bottom-sheet-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div
            id="bottom-nav-sheet"
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="bottom-sheet__handle" aria-hidden="true" />

            <header className="bottom-sheet__header">
              <div className="bottom-sheet__session">
                <p className="bottom-sheet__session-label">Sesión activa</p>
                <p className="bottom-sheet__session-name" title={username}>{username}</p>
              </div>
              <button
                type="button"
                className="bottom-sheet__close"
                onClick={() => setSheetOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <ul className="bottom-sheet__list">
              {MENU_TABS.map(({ to, label, icon: Icon }) => {
                const active = isPath(to);
                return (
                  <li key={to}>
                    <button
                      type="button"
                      className={`bottom-sheet__item${active ? ' bottom-sheet__item--active' : ''}`}
                      onClick={() => navigate(to)}
                      aria-current={active ? 'page' : undefined}
                      data-testid={`bottom-nav-sheet-${to.replace('/', '')}`}
                    >
                      <Icon size={20} aria-hidden="true" className="bottom-sheet__item-icon" />
                      <span className="bottom-sheet__item-label">{label}</span>
                      {active && <span className="bottom-sheet__item-dot" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="bottom-sheet__divider" role="separator" />

            <div className="bottom-sheet__footer">
              <button
                type="button"
                className="bottom-sheet__item bottom-sheet__item--danger"
                onClick={handleSignOut}
                disabled={signingOut}
                data-testid="bottom-nav-signout"
              >
                <LogOut size={20} aria-hidden="true" className="bottom-sheet__item-icon" />
                <span className="bottom-sheet__item-label">
                  {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
