import type { Ref } from "react";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import type { Language } from "@/contexts/LanguageContext";
import "./Header.css";

interface HeaderProps {
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
  language: Language;
}

export function Header({ onMobileMenuToggle, mobileMenuOpen = false, mobileMenuButtonRef, language }: HeaderProps) {
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
              aria-label={language === "en"
                ? mobileMenuOpen ? "Hide menu" : "Show menu"
                : mobileMenuOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <MorphMenuIcon
                isOpen={mobileMenuOpen}
                size="var(--icon-size-md)"
              />
            </button>
          )}
        </div>

        <div className="app-header__actions">
        </div>
      </div>
    </header>
  );
}
