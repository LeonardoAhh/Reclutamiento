import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  Contact,
  LayoutDashboard,
  LogOut,
  Map,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import './UserMenu.css';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Coincidencia exacta (sólo para la raíz "/"). */
  exact?: boolean;
};

/**
 * Navegación consolidada: la barra inferior desapareció, todos los accesos
 * viven aquí. Orden por frecuencia esperada de uso en sesión típica.
 */
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/',          label: 'KPIs',       icon: BarChart3,       exact: true },
  { to: '/pipeline',  label: 'Candidatos', icon: Users },
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/vacantes',  label: 'Vacantes',   icon: Briefcase },
  { to: '/empleados', label: 'Empleados',  icon: Contact },
  { to: '/rutas',     label: 'Rutas',      icon: Map },
];

/**
 * Dropdown de sesión. Trigger: avatar inicial + chevron.
 * Se cierra con click fuera o Escape; el foco regresa al trigger para
 * mantener el flujo de teclado.
 *
 * Tras unificar la navegación: contiene también todas las rutas que
 * antes vivían en el BottomTabBar (KPIs, Candidates, Dashboard, etc.).
 * La ruta activa se marca con `aria-current="page"` + estilo distintivo.
 */
export function UserMenu() {
  const { username, signOut } = useAuth();
  const { show, hide } = useLoader();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen]             = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* close como ref para que handleSignOut no necesite redeclararse
     cuando cambia el estado open. */
  const closeRef = useRef(() => {
    setOpen(false);
    triggerRef.current?.focus();
  });

  /* ── Cierre por click fuera y Escape ─────── */
  useEffect(() => {
    if (!open) return;

    const close = closeRef.current;

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* Cerrar al cambiar de ruta (después de tap en un item). */
  useEffect(() => {
    closeRef.current();
  // Sólo cuando cambia el pathname, no en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);

    const displayName = username ? username.split('@')[0].toUpperCase() : '';
    show({ tone: 'logout', title: displayName });

    try {
      await signOut();
    } finally {
      setSigningOut(false);
      closeRef.current();
      // El overlay motivacional de logout dura 7 segundos.
      window.setTimeout(hide, 7000);
    }
  }, [signingOut, signOut, show, hide, username]);

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.exact) return location.pathname === item.to;
      return (
        location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`)
      );
    },
    [location.pathname],
  );

  const activeLabel = useMemo(
    () => NAV_ITEMS.find(isActive)?.label,
    [isActive],
  );

  if (!username) return null;

  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="user-menu" ref={rootRef}>

      {/* ── Trigger ──────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Sesión de ${username}${activeLabel ? `, ${activeLabel}` : ''}`}
        title={username}
        data-testid="user-menu-trigger"
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {initial}
        </span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`user-menu__chevron${open ? ' user-menu__chevron--open' : ''}`}
        />
      </button>

      {/* ── Dropdown ─────────────────────────── */}
      {open && (
        <div
          className="user-menu__dropdown"
          role="menu"
          aria-label="Menú principal"
          data-testid="user-menu-dropdown"
        >
          <div className="user-menu__header">
            <p className="user-menu__label">Sesión activa</p>
            <p className="user-menu__name" title={username}>
              {username}
            </p>
          </div>

          <div className="user-menu__divider" role="separator" />

          {/* ── Sección Navegación (Solo móvil) ─────────── */}
          <div className="user-menu__nav-group">
            <p className="user-menu__section-label" aria-hidden="true">
              Navegación
            </p>
            <ul className="user-menu__list" role="none">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.to} role="none">
                    <button
                      type="button"
                      className={`user-menu__item${active ? ' user-menu__item--active' : ''}`}
                      onClick={() => navigate(item.to)}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      data-testid={`user-menu-nav-${item.to.replace('/', '') || 'kpis'}`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span className="user-menu__item-label">{item.label}</span>
                      {active && (
                        <span className="user-menu__item-dot" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="user-menu__divider" role="separator" />
          </div>

          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            onClick={handleSignOut}
            disabled={signingOut}
            role="menuitem"
            data-testid="user-menu-signout"
          >
            <LogOut size={14} aria-hidden="true" />
            <span className="user-menu__item-label">
              {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
