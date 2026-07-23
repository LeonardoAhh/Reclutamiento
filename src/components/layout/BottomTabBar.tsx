import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReporteDiario } from '@/hooks/useReporteDiario';
import { parseReporteJSON, isIncidence } from '@/components/reporte-diario/helpers';
import { sileo } from '@/lib/notify';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './BottomTabBar.css';
import { motion, useReducedMotion } from 'framer-motion';

import { NAV_ITEMS } from './navigation';

const PRIMARY_TABS = NAV_ITEMS.filter((t) => t.mobilePriority);
const MENU_TABS = NAV_ITEMS.filter((t) => !t.mobilePriority);

/**
 * Navbar inferior minimalista para móvil/tablet (≤1023px). Centrada, flotante.
 * 2 accesos principales (KPIs, Candidatos) + botón "Menú" que despliega un
 * bottom-sheet con el resto de páginas, la sesión activa y cerrar sesión.
 *
 * Patrones: safe-area-inset, touch targets ≥44px, Esc / click-outside,
 * body scroll-lock, focus trap dentro del sheet y restauración de foco
 * al trigger al cerrar.
 */
export function BottomTabBar() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { username, signOut } = useAuth();
  const { fetchSummaries } = useReporteDiario();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showReporteBadge, setShowReporteBadge] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  // Cierre automático al cambiar a viewport de PC (>=1024px) para evitar el bug P0
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setSheetOpen(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Scroll-lock + foco inicial en el diálogo + focus trap (Tab) + Esc + restaurar foco.
  useEffect(() => {
    if (!sheetOpen) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';

    const focusables = (): HTMLElement[] => {
      const sheet = sheetRef.current;
      if (!sheet) return [];
      return Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    // a11y: al abrir un role="dialog" el foco debe entrar al diálogo.
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSheetOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const sheet = sheetRef.current;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!(active && sheet && sheet.contains(active));
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
      requestAnimationFrame(() => triggerRef.current?.focus());
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
    try {
      sileo.info({ title: 'Cerrando sesión…' });
      await signOut();
    } finally {
      setSigningOut(false);
      setSheetOpen(false);
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
                      <motion.span
                        layoutId="bottom-nav-pill"
                        className="bottom-nav__pill"
                        aria-hidden="true"
                        transition={{ type: shouldReduceMotion ? false : 'spring', stiffness: 420, damping: 34 }}
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

      <div
        className="bottom-sheet-overlay"
        data-open={sheetOpen || undefined}
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
          ref={sheetRef}
        >
          <header className="bottom-sheet__header">
            <div className="bottom-sheet__session">
              <p className="bottom-sheet__session-label">Sesión activa</p>
              <p className="bottom-sheet__session-name" title={username}>{username}</p>
            </div>
            <div className="bottom-sheet__header-actions">
              <button
                type="button"
                className="bottom-sheet__close"
                onClick={() => setSheetOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="bottom-sheet__content">
            <ul className="bottom-sheet__list">
              {MENU_TABS.map(({ to, label, icon: Icon }) => {
                return (
                  <li key={to} className="bottom-sheet__list-item-wrapper">
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `bottom-sheet__list-item${isActive ? ' bottom-sheet__list-item--active' : ''}`
                      }
                      data-testid={`bottom-nav-sheet-${to.replace('/', '')}`}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="bottom-sheet__list-icon-wrapper">
                            <Icon size={22} aria-hidden="true" className="bottom-sheet__list-icon" />
                            {to === '/documentos' && (
                              <span className="bottom-sheet__list-badge">N</span>
                            )}
                          </div>
                          <span className="bottom-sheet__list-label">
                            {label}
                          </span>
                          <ChevronRight size={18} aria-hidden="true" className="bottom-sheet__list-chevron" />
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bottom-sheet__footer">
            <div className="bottom-sheet__footer-actions">
              <ThemeToggle />
              <button
                type="button"
                className="bottom-sheet__signout"
                onClick={handleSignOut}
                disabled={signingOut}
                data-testid="bottom-nav-signout"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={20} aria-hidden="true" className="bottom-sheet__signout-icon" />
                <span className="bottom-sheet__signout-label">
                  {signingOut ? 'Saliendo…' : 'Salir'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
