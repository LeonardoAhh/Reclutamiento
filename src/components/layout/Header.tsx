import type { Ref } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  mobileMenuButtonRef?: Ref<HTMLButtonElement>;
  mobileMenuOpen?: boolean;
  language: Language;
}

export function Header({ pageTitle, isHome, isDesktop, sidebarCollapsed, onSidebarToggle,
  mobileMenuOpen = false, mobileMenuButtonRef, language }: HeaderProps) {
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const toggleLabel = isDesktop
    ? sidebarCollapsed ? (language === 'en' ? 'Expand sidebar' : 'Expandir barra lateral')
      : (language === 'en' ? 'Collapse sidebar' : 'Contraer barra lateral')
    : mobileMenuOpen ? (language === 'en' ? 'Hide menu' : 'Ocultar menú')
      : (language === 'en' ? 'Show menu' : 'Mostrar menú');

  return (
    <header className="app-header" id="main-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <div className="app-header__title" id="app-header-title">
            {isHome ? <span className="app-header__fallback-title">{pageTitle}</span>
              : <h1 className="app-header__fallback-title">{pageTitle}</h1>}
          </div>
          <button ref={mobileMenuButtonRef} type="button" className="app-header__sidebar-toggle"
            onClick={onSidebarToggle}
            aria-expanded={isDesktop ? !sidebarCollapsed : mobileMenuOpen}
            aria-controls="app-sidebar" aria-label={toggleLabel}>
            {isDesktop
              ? sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />
              : <MorphMenuIcon isOpen={mobileMenuOpen} size="var(--icon-size-md)" />}
          </button>
        </div>
        <div className="app-header__actions">
          <SidebarQuickActions profile={profile} members={members}>
            {(quickActions) => (
              <SidebarActionSearch mobileMenuOpen={mobileMenuOpen} quickActions={profile ? quickActions : undefined} />
            )}
          </SidebarQuickActions>
        </div>
      </div>
    </header>
  );
}
