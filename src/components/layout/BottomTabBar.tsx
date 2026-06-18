import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Menu,
  X,
  LayoutDashboard,
  CalendarRange,
  Briefcase,
  UserMinus,
  Contact,
  Map,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
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
  { to: '/bajas', label: 'Bajas', icon: UserMinus },
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      <nav className="bottom-nav" aria-label="Navegación inferior">
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
                <Icon size={20} aria-hidden="true" className="bottom-nav__icon" />
                <span className="bottom-nav__label">{label}</span>
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
            aria-label="Menú"
            onClick={() => setSheetOpen((v) => !v)}
            data-testid="bottom-nav-menu-btn"
          >
            <Menu size={22} aria-hidden="true" className="bottom-nav__icon" />
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
