import type { Ref } from 'react';
import { MorphMenuIcon } from '@/components/ui/MorphMenuIcon';
import type { Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { SidebarActionSearch } from './SidebarActionSearch';
import { SidebarQuickActions } from './SidebarQuickActions';
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

export function Header({ pageTitle, isHome, isDesktop, onMobileMenuToggle,
  mobileMenuOpen = false, mobileMenuButtonRef, language }: HeaderProps) {
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const toggleLabel = mobileMenuOpen ? (language === 'en' ? 'Hide menu' : 'Ocultar menú')
    : (language === 'en' ? 'Show menu' : 'Mostrar menú');

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <div className="app-header__title" id="app-header-title">
            {isHome ? <span className="app-header__fallback-title">{pageTitle}</span>
              : <h1 className="app-header__fallback-title">{pageTitle}</h1>}
          </div>
          {!isDesktop && <button ref={mobileMenuButtonRef} type="button" className="app-header__sidebar-toggle"
            onClick={onMobileMenuToggle}
            data-cuelume-open={mobileMenuOpen ? undefined : ''}
            data-cuelume-close={mobileMenuOpen ? '' : undefined}
            aria-expanded={mobileMenuOpen}
            aria-controls="app-sidebar" aria-label={toggleLabel}>
            <MorphMenuIcon isOpen={mobileMenuOpen} size="var(--icon-size-md)" />
          </button>}
        </div>
        <div className="app-header__actions">
          <SidebarQuickActions profile={profile} members={members}>
            {(quickActions) => (
              <SidebarActionSearch mobileMenuOpen={mobileMenuOpen} role={profile?.role} quickActions={profile ? quickActions : undefined} />
            )}
          </SidebarQuickActions>
        </div>
      </div>
    </header>
  );
}
