import type { Ref } from "react";
import { RemindersPanel } from "@/components/ui/RemindersPanel";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import "./Header.css";

interface HeaderProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ collapsed = false, onToggleCollapse, onMobileMenuToggle, mobileMenuOpen = false, mobileMenuButtonRef }: HeaderProps = {}) {
  return (
    <header className="app-header" id="main-header">
      {onToggleCollapse && (
        <div className="app-header__sidebar-control">
          <button
            type="button"
            className="app-header__collapse-btn"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            aria-label={collapsed ? "Mostrar menú" : "Ocultar menú"}
            data-testid="sidebar-collapse-toggle"
          >
            <MorphMenuIcon isOpen={!collapsed} size="var(--icon-size-control)" />
            {!collapsed && <span>Ocultar menú</span>}
          </button>
        </div>
      )}
      <div className="app-header__inner">
        <div className="app-header__left">
          {onMobileMenuToggle && (
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="app-header__mobile-menu-btn"
              onClick={onMobileMenuToggle}
              aria-expanded={mobileMenuOpen}
              aria-controls="app-sidebar"
              aria-label={mobileMenuOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <MorphMenuIcon
                isOpen={mobileMenuOpen}
                size="var(--icon-size-md)"
              />
            </button>
          )}
        </div>

        <div className="app-header__actions">
          <RemindersPanel />
        </div>
      </div>
    </header>
  );
}
