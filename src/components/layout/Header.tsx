import type { Ref } from "react";
import { RemindersPanel } from "@/components/ui/RemindersPanel";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import "./Header.css";

interface HeaderProps {
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Header({ onMobileMenuToggle, mobileMenuOpen = false, mobileMenuButtonRef }: HeaderProps) {
  return (
    <header className="app-header" id="main-header">
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
