import { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide";
import { useAuth } from "@/hooks/useAuth";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { Tooltip } from "@/components/ui/Tooltip";
import "./Sidebar.css";
import { useSystemVersion } from "@/hooks/useSystemVersion";
import { useFeedback } from "@/hooks/useFeedback";
import { useLoader } from "@/hooks/useLoader";

import { NAV_GROUPS } from "./navigation";
import { UserMenuPopover } from "./UserMenuPopover";

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
export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileMenuOpen,
  onCloseMobileMenu,
}: SidebarProps) {
  const { username, user, profile, signOut } = useAuth();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [signingOut, setSigningOut] = useState(false);
  const loader = useLoader();
  const { version } = useSystemVersion();
  const { trigger } = useFeedback();

  /* Cerrar menú móvil al navegar */
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);
  if (!username) return null;

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    trigger("light");
    loader.flash({
      title: "Cerrando sesión...",
      duration: 2500,
    });
    try {
      trigger("success");
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }, [signingOut, signOut, trigger, loader]);

  return (
    <aside
      className="sidebar"
      data-collapsed={collapsed && !mobileMenuOpen}
      data-mobile-open={mobileMenuOpen}
      aria-label="Navegación principal"
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      {/* Top: colapsar */}
      <div className="sidebar__top">
        <button
          type="button"
          className="sidebar__item sidebar__collapse-btn"
          onClick={() => {
            if (mobileMenuOpen && onCloseMobileMenu) {
              onCloseMobileMenu();
            } else {
              onToggleCollapse();
            }
          }}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          data-testid="sidebar-collapse-toggle"
        >
          <MorphingIcon
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            size="var(--icon-size-md)"
            className="sidebar__item-icon"
            aria-hidden="true"
          />
          <span className="sidebar__item-label">Colapsar</span>
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar__nav" aria-label="Secciones">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="sidebar__group">
            {group.title && !collapsed && (
              <div className="sidebar__group-title">{group.title}</div>
            )}
            <ul className="sidebar__list" role="list" aria-label={group.title || "Principal"}>
              {group.items.map(({ to, label, icon: Icon, end }) => {
                const isActive = end
                  ? location.pathname === to
                  : location.pathname.startsWith(to);

                const link = (
                  <NavLink
                    to={to}
                    end={end}
                    className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                    aria-label={label}
                    data-testid={`sidebar-nav-${to.replace("/", "") || "kpis"}`}
                  >
                    <Icon
                      size={20}
                      aria-hidden="true"
                      className="sidebar__item-icon"
                    />
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
          </div>
        ))}
      </nav>

      {/* Footer: user avatar + menu (moved from header) */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <UserMenuPopover
            username={username}
            email={user?.email}
            avatarUrl={profile?.avatar_url ?? undefined}
            collapsed={collapsed && !mobileMenuOpen}
            mobile={Boolean(mobileMenuOpen)}
            isAdmin={profile?.role === "admin"}
            version={version}
            signingOut={signingOut}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </aside>
  );
}
