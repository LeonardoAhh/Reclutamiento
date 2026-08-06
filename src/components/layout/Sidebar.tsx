import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronsLeft, Menu } from 'lucide';
import { useAuth } from '@/hooks/useAuth';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { Tooltip } from '@/components/ui/Tooltip';
import './Sidebar.css';
import { BrandLogo } from '@/components/ui/BrandLogo';

import { NAV_ITEMS } from './navigation';

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
};

/**
 * Sidebar de escritorio (>=1024px). Fija a la izquierda, colapsable a iconos.
 * Construida 100% con design tokens: canvas + hairline, sin sombras pesadas.
 * Nota: El menú de usuario se ha movido al Header.
 */
export function Sidebar({ collapsed, onToggleCollapse, mobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const { username } = useAuth();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  /* Cerrar menú móvil al navegar */
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);
  if (!username) return null;

  return (
    <aside
      className="sidebar"
      data-collapsed={collapsed}
      data-mobile-open={mobileMenuOpen}
      aria-label="Navegación principal"
      data-testid="app-sidebar"
    >
      {/* Top: colapsar */}
      <div className="sidebar__top">
        <button
          type="button"
          className="sidebar__item sidebar__collapse-btn"
          onClick={onToggleCollapse}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          data-testid="sidebar-collapse-toggle"
        >
          <MorphingIcon
            icon={collapsed ? Menu : ChevronsLeft}
            size={20}
            className="sidebar__item-icon"
          />
          <span className="sidebar__item-label">Colapsar</span>
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav" aria-label="Secciones">
        <ul className="sidebar__list" role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
            const isActive = end
              ? location.pathname === to
              : location.pathname.startsWith(to);

            const link = (
              <NavLink
                to={to}
                end={end}
                className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
                aria-label={label}
                data-testid={`sidebar-nav-${to.replace('/', '') || 'kpis'}`}
              >
                <Icon size={20} aria-hidden="true" className="sidebar__item-icon" />
                <span className="sidebar__item-label">{label}</span>
              </NavLink>
            );

            return (
              <li key={to}>
                {collapsed ? (
                  <Tooltip content={label} side="right" delayMs={0}>
                    {link}
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: logo del sistema */}
      <div className="sidebar__footer">
        <NavLink to="/" className="sidebar__brand" aria-label="Reclutamiento, ir al inicio">
          <BrandLogo showText={!collapsed || mobileMenuOpen} />
        </NavLink>
      </div>
    </aside>
  );
}
