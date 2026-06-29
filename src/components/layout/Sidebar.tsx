import { useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  LayoutDashboard,
  Briefcase,
  CalendarRange,
  Contact,
  Map,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Loader,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './Sidebar.css';
import { BrandLogo } from '@/components/ui/BrandLogo';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/** Navegación plana (sin grupos): orden por frecuencia de uso esperada. */
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/',               label: 'KPIs',           icon: BarChart3,       end: true },
  { to: '/reporte-diario', label: 'Reporte Diario', icon: CalendarRange },
  { to: '/pipeline',       label: 'Candidatos',     icon: Users },
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/vacantes',       label: 'Vacantes',       icon: Briefcase },
  { to: '/empleados',      label: 'Empleados',      icon: Contact },
  { to: '/rutas',          label: 'Rutas',          icon: Map },
  { to: '/toulouse',       label: 'Toulouse-Piéron', icon: ClipboardCheck },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

/**
 * Sidebar de escritorio (≥1024px). Fija a la izquierda, colapsable a iconos.
 * Construida 100% con design tokens (Ollama): canvas + hairline, sin sombras.
 * Footer: tema, sesión activa y cerrar sesión.
 */
export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { username, signOut } = useAuth();
  const { show, hide } = useLoader();
  const { version } = useSystemVersion();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    const displayName = username ? username.split('@')[0].toUpperCase() : '';
    show({ tone: 'logout', title: displayName });
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      window.setTimeout(hide, 4000);
    }
  }, [signingOut, signOut, show, hide, username]);

  if (!username) return null;

  return (
    <aside
      className="sidebar"
      data-collapsed={collapsed}
      aria-label="Navegación principal"
      data-testid="app-sidebar"
    >
      {/* Top: marca + colapsar */}
      <div className="sidebar__top">
        <NavLink to="/" className="sidebar__brand" aria-label="Reclutamiento, ir al inicio">
        <BrandLogo showText={!collapsed} />
        </NavLink>

        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapse}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          data-testid="sidebar-collapse-toggle"
        >
          {collapsed
            ? <PanelLeftOpen size={18} aria-hidden="true" />
            : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav" aria-label="Secciones">
        <ul className="sidebar__list" role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar__item${isActive ? ' sidebar__item--active' : ''}`
                }
                title={collapsed ? label : undefined}
                aria-label={label}
                data-testid={`sidebar-nav-${to.replace('/', '') || 'kpis'}`}
              >
                <Icon size={20} aria-hidden="true" className="sidebar__item-icon" />
                <span className="sidebar__item-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

{/* Footer: tarjeta de usuario + tema + logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          {!collapsed && (
            <>
              <div className="sidebar__session">
                <p className="sidebar__session-label">Sesión activa</p>
                <p className="sidebar__session-name" title={username}>{username}</p>
              </div>
              <span className="sidebar__user-theme">
                <ThemeToggle />
              </span>
            </>
          )}
        </div>

        {collapsed && (
          <div className="sidebar__footer-row">
            <ThemeToggle />
          </div>
        )}

        <button
          type="button"
          className="sidebar__logout"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Cerrar sesión' : undefined}
          aria-label="Cerrar sesión"
          data-testid="sidebar-signout"
        >
          {signingOut
            ? <Loader size={18} className="sidebar__spin" aria-hidden="true" />
            : <LogOut size={18} aria-hidden="true" />}
          <span className="sidebar__item-label">
            {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </span>
        </button>

        {version && (
          <p
            className="sidebar__version"
            title={`Versión del sistema ${version}`}
            data-testid="sidebar-version"
          >
            {collapsed ? `v${version}` : `Sistema · v${version}`}
          </p>
        )}
      </div>
    </aside>
  );
}