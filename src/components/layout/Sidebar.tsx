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
  FileText,
  ChevronUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { sileo } from '@/lib/notify';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Tooltip } from '@/components/ui/Tooltip';
import './Sidebar.css';
import { BrandLogo } from '@/components/ui/BrandLogo';
// @ts-ignore
import Avatar from 'boring-avatars';

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
  { to: '/documentos',     label: 'Documentos',     icon: FileText },
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
  const { username, profile, signOut } = useAuth();
  const { version } = useSystemVersion();
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  /* ── Auto-colapso al navegar ─────────────────────────────────────────
     Cuando cambia la ruta (por click, URL bar o browser back), colapsamos
     el sidebar para dar más espacio al contenido. Usamos un ref para
     detectar cambio real de ruta (no reaccionamos a `collapsed`, lo que
     provocaría un loop al intentar expandir manualmente). */
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCollapse?.();
  }, [location.pathname, onCollapse]);

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
        {!collapsed && (
          <NavLink to="/" className="sidebar__brand" aria-label="Reclutamiento, ir al inicio">
            <BrandLogo showText={!collapsed} />
          </NavLink>
        )}

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
                {to === '/documentos' && (
                  <span className="sidebar__new-badge" title="¡Nuevo!">Nuevo</span>
                )}
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

      {/* Footer: Avatar Popover Minimalista */}
      <div className="sidebar__footer" ref={userMenuRef}>
        {menuOpen && (
          <div className="sidebar__popover" role="menu">
            <div className="sidebar__popover-actions">
              <button
                type="button"
                className="sidebar__popover-item sidebar__popover-item--danger"
                onClick={handleSignOut}
                disabled={signingOut}
                role="menuitem"
              >
                {signingOut
                  ? <Loader size={16} className="sidebar__spin" aria-hidden="true" />
                  : <LogOut size={16} aria-hidden="true" />}
                <span>{signingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
              </button>
              <div className="sidebar__popover-divider-vertical" />
              <ThemeToggle />
            </div>

            {version && (
              <p className="sidebar__popover-version">v{version}</p>
            )}
          </div>
        )}

        <button
          type="button"
          className="sidebar__user-trigger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Opciones de usuario"
        >
          <span className="sidebar__avatar" aria-hidden="true" title={username}>
            {/* @ts-ignore - boring-avatars no trae tipos por defecto */}
            <Avatar 
              size={40} 
              name={username} 
              variant="beam" 
              colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']} 
            />
          </span>
          {!collapsed && (
            <div className="sidebar__trigger-info">
              <span className="sidebar__trigger-name">{username.split('@')[0]}</span>
              <ChevronUp 
                size={16} 
                className={`sidebar__trigger-icon ${menuOpen ? 'sidebar__trigger-icon--open' : ''}`} 
                aria-hidden="true" 
              />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}