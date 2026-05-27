import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  LayoutDashboard,
  MoreHorizontal,
  Briefcase,
  UserMinus,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './BottomTabBar.css';

type TabItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const PRIMARY_TABS: ReadonlyArray<TabItem> = [
  { to: '/', label: 'KPIs', icon: BarChart3, end: true },
  { to: '/pipeline', label: 'Candidatos', icon: Users },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const OVERFLOW_TABS: ReadonlyArray<TabItem> = [
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/bajas', label: 'Bajas', icon: UserMinus },
];

/**
 * Bottom tab bar for mobile/PWA. Hidden on tablet/desktop where the top-nav
 * already covers navegación. Includes a "Más" tab that opens a bottom sheet
 * con los items de menor frecuencia (Vacantes / Bajas / Transporte).
 *
 * Patrones aplicados:
 *  - safe-area-inset-bottom para respetar home-indicator.
 *  - touch targets ≥44px (Apple HIG / WCAG 2.5.5).
 *  - sheet con `Esc`, click-outside, focus trap mínimo, body scroll lock.
 */
export function BottomTabBar() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const overflowActive = OVERFLOW_TABS.some(
    (t) => location.pathname === t.to || location.pathname.startsWith(`${t.to}/`)
  );

  // Cerrar sheet en cambio de ruta (después de tap en un item).
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  // Body scroll lock + Esc + focus restore.
  useEffect(() => {
    if (!sheetOpen) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSheetOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
      triggerRef.current?.focus();
    };
  }, [sheetOpen]);

  return (
    <>
      <nav
        className="bottom-tab-bar"
        aria-label="Navegación inferior"
      >
        <ul className="bottom-tab-bar__list">
          {PRIMARY_TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="bottom-tab-bar__item">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `bottom-tab-bar__link${
                    isActive ? ' bottom-tab-bar__link--active' : ''
                  }`
                }
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className="bottom-tab-bar__icon"
                />
                <span className="bottom-tab-bar__label">{label}</span>
              </NavLink>
            </li>
          ))}
          <li className="bottom-tab-bar__item">
            <button
              ref={triggerRef}
              type="button"
              className={`bottom-tab-bar__link${
                overflowActive || sheetOpen
                  ? ' bottom-tab-bar__link--active'
                  : ''
              }`}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              aria-controls="bottom-tab-more-sheet"
              onClick={() => setSheetOpen((v) => !v)}
            >
              <MoreHorizontal
                size={20}
                aria-hidden="true"
                className="bottom-tab-bar__icon"
              />
              <span className="bottom-tab-bar__label">Más</span>
            </button>
          </li>
        </ul>
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
            ref={sheetRef}
            id="bottom-tab-more-sheet"
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
          >
            <div className="bottom-sheet__handle" aria-hidden="true" />
            <header className="bottom-sheet__header">
              <h2 className="bottom-sheet__title">Más</h2>
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
              {OVERFLOW_TABS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `bottom-sheet__item${
                        isActive ? ' bottom-sheet__item--active' : ''
                      }`
                    }
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="bottom-sheet__item-icon"
                    />
                    <span className="bottom-sheet__item-label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
