import type { Ref } from 'react';
import { MorphMenuIcon } from '@/components/ui/MorphMenuIcon';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Language } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import './Header.css';

interface HeaderProps {
  pageTitle: string;
  isHome: boolean;
  isDesktop: boolean;
  onMobileMenuToggle: () => void;
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  mobileMenuOpen?: boolean;
  language: Language;
}

export function Header({
  pageTitle,
  isHome,
  isDesktop,
  onMobileMenuToggle,
  mobileMenuOpen = false,
  mobileMenuButtonRef,
  language,
}: HeaderProps) {
  const isMobile = useIsMobile();
  const toggleLabel = mobileMenuOpen
    ? language === 'en'
      ? 'Hide menu'
      : 'Ocultar menú'
    : language === 'en'
      ? 'Sidebar'
      : 'Barra lateral';
  const sidebarToggle = (
    <button
      ref={mobileMenuButtonRef}
      type="button"
      className="app-header__sidebar-toggle"
      onClick={onMobileMenuToggle}
      data-cuelume-open={mobileMenuOpen ? undefined : ''}
      data-cuelume-close={mobileMenuOpen ? '' : undefined}
      aria-expanded={mobileMenuOpen}
      aria-controls="app-sidebar"
      aria-label={toggleLabel}
    >
      <MorphMenuIcon isOpen={mobileMenuOpen} size="var(--icon-size-md)" />
    </button>
  );

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <div className="app-header__title" id="app-header-title">
            {isHome ? (
              <span className="app-header__fallback-title">{pageTitle}</span>
            ) : (
              <h1 className="app-header__fallback-title">{pageTitle}</h1>
            )}
          </div>
          {!isDesktop &&
            (isMobile ? (
              sidebarToggle
            ) : (
              <Tooltip content={toggleLabel} side="bottom">
                {sidebarToggle}
              </Tooltip>
            ))}
        </div>
      </div>
    </header>
  );
}
