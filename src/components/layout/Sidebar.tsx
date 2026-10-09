import { Fragment, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { preloadRoute } from "@/lib/routePages";
import { useAuth } from "@/hooks/useAuth";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut } from "lucide-react";
import { useSignOut } from "@/features/account/useSignOut";
import "./Sidebar.css";

import { getLocalizedNavigation } from "./navigation";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarQuickActions } from "./SidebarQuickActions";
import clsx from "clsx";
import { useTeamDirectory } from "@/features/team/TeamProvider";

type SidebarProps = {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
};

export function Sidebar({
  mobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const { username, profile } = useAuth();
  const { members } = useTeamDirectory();
  const { language } = useLanguage();
  const location = useLocation();
  const navSections = getLocalizedNavigation(language);
  const prevPathRef = useRef(location.pathname);
  const sidebarRef = useRef<HTMLElement>(null);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const logoutTriggerRef = useRef<HTMLButtonElement>(null);
  const logoutCancelRef = useRef<HTMLButtonElement>(null);
  const { handleSignOut, isLoading: signOutLoading } = useSignOut();

  useEffect(() => {
    if (mobileMenuOpen) sidebarRef.current?.querySelector<HTMLButtonElement>('.sidebar__close-btn')?.focus();
  }, [mobileMenuOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!mobileMenuOpen || !sidebar) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    sidebar.addEventListener("keydown", handleTab);
    return () => sidebar.removeEventListener("keydown", handleTab);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);

  useEffect(() => {
    if (logoutConfirmationOpen) logoutCancelRef.current?.focus();
  }, [logoutConfirmationOpen]);

  const cancelLogout = () => {
    setLogoutConfirmationOpen(false);
    window.requestAnimationFrame(() => logoutTriggerRef.current?.focus());
  };

  if (!username) return null;

  const linkedMember = members.find((member) => member.profile_id === profile?.id);
  const position = linkedMember?.job_title.trim() || (
    profile?.role === "admin"
      ? language === "en" ? "Administrator" : "Administrador"
      : language === "en" ? "Recruiter" : "Reclutador"
  );

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      data-mobile-open={mobileMenuOpen}
      aria-label={language === "en" ? "Main navigation" : "Navegación principal"}
      aria-modal={mobileMenuOpen || undefined}
      role={mobileMenuOpen ? "dialog" : undefined}
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      <div className="sidebar__top">
        <SidebarBrand title={position} />
        <button
          type="button"
          className="sidebar__close-btn"
          onClick={onCloseMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-sidebar"
          data-testid="sidebar-close-toggle"
          aria-label={language === "en" ? "Collapse" : "Colapsar"}
        >
          <MorphMenuIcon
            isOpen
            size="var(--icon-size-md)"
          />
        </button>
      </div>

      <nav className="sidebar__nav" id="sidebar-sections" aria-label={language === "en" ? "Sections" : "Secciones"}>
        {navSections.map((section) => {
          const sectionTitleId = `sidebar-section-${section.label.toLowerCase()}`;
          return (
            <Fragment key={section.label}>
              <h2 id={sectionTitleId} className="sr-only">
                {section.label}
              </h2>
              <ul className="sidebar__list" role="list" aria-labelledby={sectionTitleId}>
                {section.items.map((item) => {
                  const { to, label, icon: Icon, badge, end } = item;
                  if (item.roles && (!profile || !item.roles.some((role) => role === profile.role))) {
                    return null;
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
                        onPointerEnter={() => preloadRoute(to)}
                        onFocus={() => preloadRoute(to)}
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
            </Fragment>
          );
        })}
      </nav>
      {profile && <SidebarQuickActions profile={profile} members={members} />}
      <footer className="sidebar__footer">
        <button
          ref={logoutTriggerRef}
          type="button"
          className="sidebar__logout-trigger"
          onClick={() => setLogoutConfirmationOpen(true)}
          aria-expanded={logoutConfirmationOpen}
          aria-controls="sidebar-logout-confirmation"
          hidden={logoutConfirmationOpen}
        >
          <LogOut aria-hidden="true" />
          <span>{language === "en" ? "Sign out" : "Cerrar sesión"}</span>
        </button>
        <div
          id="sidebar-logout-confirmation"
          className="sidebar__logout-confirmation"
          role="group"
          aria-label={language === "en" ? "Confirm sign out" : "Confirmar cierre de sesión"}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelLogout();
          }}
          hidden={!logoutConfirmationOpen}
        >
          <button
            ref={logoutCancelRef}
            type="button"
            className="btn-secondary btn-sm"
            onClick={cancelLogout}
            disabled={signOutLoading}
          >
            {language === "en" ? "Cancel" : "Cancelar"}
          </button>
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => void handleSignOut()}
            disabled={signOutLoading}
            aria-busy={signOutLoading}
          >
            {signOutLoading
              ? language === "en" ? "Signing out…" : "Cerrando sesión…"
              : language === "en" ? "Sign out" : "Cerrar sesión"}
          </button>
        </div>
      </footer>
    </aside>
  );
}
