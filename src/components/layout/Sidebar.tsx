import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { sileo } from '@/lib/notify';
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
  /** Forzar colapso (sin toggle). Se usa para auto-colapsar al navegar. */
  onCollapse?: () => void;
};

/**
 * Sidebar de escritorio (≥1024px). Fija a la izquierda, colapsable a iconos.
 * Al navegar entre páginas se contrae automáticamente para dar más espacio
 * al contenido; el usuario puede volver a expandir con el botón toggle.
 * Construida 100% con design tokens: canvas + hairline, sin sombras pesadas.
 */
export function Sidebar({ collapsed, onToggleCollapse, onCollapse }: SidebarProps) {
  const { username, signOut } = useAuth();
  const { version } = useSystemVersion();
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const firstNavRef = useRef(true);

  /* ── Auto-colapso al navegar ─────────────────────────────────────────
     Cuando cambia la ruta (por click, URL bar o browser back), colapsamos
     el sidebar para dar más espacio al contenido. Ignoramos el primer
     render para respetar la preferencia guardada del usuario al cargar. */
  useEffect(() => {
    if (firstNavRef.current) {
      firstNavRef.current = false;
      return;
    }
    if (!collapsed && onCollapse) {
      onCollapse();
    }
  }, [location.pathname, collapsed, onCollapse]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      sileo.success({
        title: 'Hasta pronto',
        description: username ? username.split('@')[0].toUpperCase() : '',
      });
    } finally {
      setSigningOut(false);
    }
  }, [signingOut, signOut, username]);

  /** Iniciales del usuario para el avatar. */
  const userInitials = useMemo(() => {
    if (!username) return '';
    const base = username.split('@')[0] ?? '';
    const parts = base.split(/[._\-\s]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }, [username]);

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
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="sidebar__item-active-indicator"
                        aria-hidden="true"
                        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                      />
                    )}
                    <Icon size={20} aria-hidden="true" className="sidebar__item-icon" />
                    <span className="sidebar__item-label">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

{/* Footer: tarjeta de usuario + tema + logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="sidebar__avatar" aria-hidden="true" title={username}>
            {userInitials}
          </span>
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