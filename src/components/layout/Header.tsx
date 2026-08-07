import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RemindersPanel } from "@/components/ui/RemindersPanel";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import { NAV_ITEMS } from "./navigation";
import "./Header.css";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ onMobileMenuToggle, mobileMenuOpen = false }: HeaderProps = {}) {
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
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <MorphMenuIcon isOpen={mobileMenuOpen} size={24} />
            </button>
          )}

          {pageTitle && <h1 className="app-header__page-title">{pageTitle}</h1>}
        </div>

        <div style={{ flex: 1 }} />

        <div className="app-header__actions">
          <RemindersPanel />
        </div>
      </div>
    </header>
  );
}
