import { RemindersPanel } from "@/components/ui/RemindersPanel";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import "./Header.css";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ onMobileMenuToggle, mobileMenuOpen = false }: HeaderProps = {}) {
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
              aria-controls="app-sidebar"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <MorphMenuIcon
                isOpen={mobileMenuOpen}
                size="var(--icon-size-md)"
              />
            </button>
          )}
        </div>

        <div className="app-header__spacer" />

        <div className="app-header__actions">
          <RemindersPanel />
        </div>
      </div>
    </header>
  );
}
