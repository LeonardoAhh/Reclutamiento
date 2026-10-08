import { Fragment, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import "./Sidebar.css";

import { APP_BRAND_NAME, getLocalizedNavigation } from "./navigation";
import { SidebarBrand } from "./SidebarBrand";
import { UserMenuPopover } from "./UserMenuPopover";
import { SidebarActionSearch } from "./SidebarActionSearch";
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
  const { username, user, profile } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navSections = getLocalizedNavigation(language);
  const prevPathRef = useRef(location.pathname);
  const sidebarRef = useRef<HTMLElement>(null);

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

  if (!username) return null;

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
        <SidebarBrand name={APP_BRAND_NAME} />
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

      <SidebarActionSearch mobileMenuOpen={mobileMenuOpen} onNavigate={onCloseMobileMenu} />

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

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <UserMenuPopover
            displayName={toNaturalCase(profile?.display_name || username, {
              preserveAcronyms: false,
            })}
            email={user?.email}
            avatarUrl={profile?.avatar_url ?? undefined}
            mobile={Boolean(mobileMenuOpen)}
            onNavigate={onCloseMobileMenu}
          />
        </div>
      </div>
    </aside>
  );
}
