import type { Ref } from "react";
import { MorphMenuIcon } from "@/components/ui/MorphMenuIcon";
import type { Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { toNaturalCase } from "@/lib/utils";
import { SidebarActionSearch } from "./SidebarActionSearch";
import { UserMenuPopover } from "./UserMenuPopover";
import "./Header.css";

interface HeaderProps {
  pageTitle: string;
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
  language: Language;
}

export function Header({ pageTitle, onMobileMenuToggle, mobileMenuOpen = false, mobileMenuButtonRef, language }: HeaderProps) {
  const { username, profile } = useAuth();

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

        <div className="app-header__title" id="app-header-title">
          <h1 className="app-header__fallback-title">{pageTitle}</h1>
        </div>

        <div className="app-header__actions">
          <SidebarActionSearch mobileMenuOpen={mobileMenuOpen} />
          {username && (
            <UserMenuPopover
              displayName={toNaturalCase(profile?.display_name || username, {
                preserveAcronyms: false,
              })}
              avatarUrl={profile?.avatar_url ?? undefined}
            />
          )}
        </div>
      </div>
    </header>
  );
}
