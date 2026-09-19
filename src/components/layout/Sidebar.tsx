import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import "./Sidebar.css";
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
import { toNaturalCase } from "@/lib/utils";
import clsx from "clsx";

type SidebarProps = {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
};

export function Sidebar({
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
  const { trigger } = useFeedback();

  useEffect(() => {
    if (mobileMenuOpen) sidebarRef.current?.querySelector<HTMLButtonElement>('.sidebar__close-btn')?.focus();
  }, [mobileMenuOpen]);

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
    loader.show({ title: "Cerrando sesión…", variant: "workspace-exit" });
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
      data-mobile-open={mobileMenuOpen}
      aria-label="Navegación principal"
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      <div className="sidebar__top">
        <span className="sidebar__brand">ViñoPlastic</span>
        <button
          type="button"
          className="sidebar__close-btn"
          onClick={onCloseMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-sidebar"
          data-testid="sidebar-close-toggle"
          aria-label="Colapsar"
        >
          <MorphMenuIcon
            isOpen
            size="var(--icon-size-md)"
          />
        </button>
      </div>

      <nav className="sidebar__nav" id="sidebar-sections" aria-label="Secciones">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="sidebar__group">
            {group.title && (
              <div className="sidebar__group-title">{group.title}</div>
            )}
            <ul className="sidebar__list" role="list" aria-label={group.title || "Principal"}>
              {group.items.map((item) => {
                const { to, label, icon: Icon, badge, end } = item;
                if (item.roles && (!profile || !item.roles.some((role) => role === profile.role))) {
                  return null;
                }
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
                        mobile={Boolean(mobileMenuOpen)}
                        onNavigate={onCloseMobileMenu}
                      />
                    </li>
                  );
                }
                const isActive = end
                  ? location.pathname === to
                  : location.pathname === to || location.pathname.startsWith(`${to}/`);

                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={clsx("sidebar__item", isActive && "sidebar__item--active")}
                      aria-label={badge ? `${label}, ${badge}` : label}
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
                      {badge && <span className="sidebar__item-badge">{badge}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <UserMenuPopover
            username={username}
            displayName={toNaturalCase(profile?.display_name || username, {
              preserveAcronyms: false,
            })}
            email={user?.email}
            avatarUrl={profile?.avatar_url ?? undefined}
            mobile={Boolean(mobileMenuOpen)}
            isAdmin={profile?.role === "admin"}
            isRecruiter={profile?.role === "reclutador"}
            signingOut={signingOut}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </aside>
  );
}
