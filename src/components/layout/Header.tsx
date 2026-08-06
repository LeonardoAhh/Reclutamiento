import { useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { NAV_ITEMS } from "./navigation";
import "./Header.css";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps = {}) {
  const { username } = useAuth();
  const location = useLocation();

  const currentNavItem = useMemo(
    () =>
      NAV_ITEMS.find((item) => {
        if (item.end) return location.pathname === item.to;
        return location.pathname.startsWith(item.to);
      }),
    [location.pathname],
  );

  let pageTitle = currentNavItem ? currentNavItem.label : "";
  if (!pageTitle) {
    if (location.pathname.startsWith("/bajas")) pageTitle = "Downsizing";
    else if (location.pathname.startsWith("/transporte"))
      pageTitle = "Transporte";
    else if (location.pathname.startsWith("/configuracion"))
      pageTitle = "Configuración";
  }

  useEffect(() => {
    const page = pageTitle || "App";
    document.title = `${page} — Reclutamiento`;
  }, [pageTitle]);

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          {onMobileMenuToggle && (
            <button
              type="button"
              className="app-header__mobile-menu-btn"
              onClick={onMobileMenuToggle}
              aria-label="Abrir menú"
            >
              {/* Mobile menu icon handled by parent */}
            </button>
          )}

          {pageTitle && <h1 className="app-header__page-title">{pageTitle}</h1>}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sidebar footer (brand) moved to header area as requested */}
        <div className="app-header__actions">
          <NavLink
            to="/"
            className="app-header__brand-link"
            aria-label="Ir al inicio"
          >
            <BrandLogo showText={false} />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
