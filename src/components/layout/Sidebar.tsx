import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import "./Sidebar.css";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { useFeedback } from "@/hooks/useFeedback";
import { useLoader } from "@/hooks/useLoader";

import { ACTIVIDADES_PATH, NAV_GROUPS } from "./navigation";
import { UserMenuPopover } from "./UserMenuPopover";
import { PlantillaNavItem } from "./PlantillaNavItem";
import { ConfiguracionNavItem } from "./ConfiguracionNavItem";
import { ActividadesNavItem } from "./ActividadesNavItem";
import { PLANTILLA_PATH } from "@/lib/plantillaNavigation";
import { CONFIGURACION_PATH } from "@/lib/configuracionNavigation";
import { toast } from "@/lib/notify";

type SidebarProps = {
  collapsed: boolean;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
};

/**
 * Navegación compartida: deslizable en móvil y colapsable en escritorio.
 * El pie contiene las opciones de usuario; las secciones delegan sus submenús.
 */
export function Sidebar({
  collapsed,
  mobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const { username, user, profile, signOut } = useAuth();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const sidebarRef = useRef<HTMLElement>(null);
  const signOutPendingRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const loader = useLoader();
  const { version } = useSystemVersion();
  const { trigger } = useFeedback();
  const isCollapsed = collapsed && !mobileMenuOpen;

  useEffect(() => {
    if (mobileMenuOpen) sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [mobileMenuOpen]);

  /* Cerrar menú móvil al navegar */
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);
  const handleSignOut = useCallback(async () => {
    if (signOutPendingRef.current) return;
    signOutPendingRef.current = true;
    setSigningOut(true);
    trigger("light");
    loader.show({ title: "Cerrando sesión..." });
    try {
      await signOut();
      trigger("success");
    } catch {
      toast.error({ title: "No se pudo cerrar sesión. Inténtalo de nuevo." });
    } finally {
      loader.hide();
      signOutPendingRef.current = false;
      setSigningOut(false);
    }
  }, [signOut, trigger, loader]);

  if (!username) return null;

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      data-collapsed={isCollapsed}
      data-mobile-open={mobileMenuOpen}
      aria-label="Navegación principal"
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      {/* El cierre móvil permanece accesible dentro del panel desplegado. */}
      <div className="sidebar__top">
        <button
          type="button"
          className="sidebar__item sidebar__collapse-btn"
          onClick={onCloseMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="sidebar-sections"
          aria-label="Ocultar menú"
        >
          <MorphMenuIcon
            isOpen
            size="var(--icon-size-md)"
            className="sidebar__item-icon"
          />
          <span className="sidebar__item-label">Ocultar menú</span>
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav" id="sidebar-sections" aria-label="Secciones">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="sidebar__group">
            {group.title && (
              <div className="sidebar__group-title">{group.title}</div>
            )}
            <ul className="sidebar__list" role="list" aria-label={group.title || "Principal"}>
              {group.items.map((item) => {
                const { to, label, icon: Icon, end } = item;
                if (
                  to === PLANTILLA_PATH ||
                  to === CONFIGURACION_PATH ||
                  to === ACTIVIDADES_PATH
                ) {
                  const SectionNavItem = to === PLANTILLA_PATH
                    ? PlantillaNavItem
                    : to === CONFIGURACION_PATH
                      ? ConfiguracionNavItem
                      : ActividadesNavItem;
                  return (
                    <li key={to}>
                      <SectionNavItem
                        item={item}
                        collapsed={false}
                        mobile={Boolean(mobileMenuOpen)}
                        onNavigate={onCloseMobileMenu}
                      />
                    </li>
                  );
                }
                const isActive = end
                  ? location.pathname === to
                  : location.pathname === to || location.pathname.startsWith(`${to}/`);

                const link = (
                  <NavLink
                    to={to}
                    end={end}
                    className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                    aria-label={label}
                    onClick={(event) => {
                      if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                        onCloseMobileMenu?.();
                      }
                    }}
                    data-testid={`sidebar-nav-${to.replace("/", "") || "kpis"}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="sidebar__item-icon"
                    />
                    <span className="sidebar__item-label">{label}</span>
                  </NavLink>
                );

                return (
                  <li key={to}>
                    {link}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Opciones de cuenta; los permisos se resuelven en el menú compartido. */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <UserMenuPopover
            username={username}
            email={user?.email}
            avatarUrl={profile?.avatar_url ?? undefined}
            collapsed={false}
            mobile={Boolean(mobileMenuOpen)}
            isAdmin={profile?.role === "admin"}
            isRecruiter={profile?.role === "reclutador"}
            version={version}
            signingOut={signingOut}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </aside>
  );
}
