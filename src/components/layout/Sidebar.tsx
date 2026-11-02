import { useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { MorphMenuIcon } from '@/components/ui/MorphMenuIcon';
import { FoldHorizontal, UnfoldHorizontal } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedNavigation } from './navigation';
import { SidebarBrand } from './SidebarBrand';
import { SidebarGroup } from './SidebarGroup';
import { SidebarAccountMenu } from './SidebarAccountMenu';
import { SidebarQuickActions, type SidebarQuickActionsControls } from './SidebarQuickActions';
import './Sidebar.css';
import './SidebarNavigation.css';

type SidebarProps = {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  collapsed?: boolean;
  onToggleCollapsed: () => void;
  isDesktop: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  onRestoreMobileFocus: () => void;
};

export function Sidebar({
  mobileMenuOpen = false,
  onCloseMobileMenu,
  collapsed = false,
  onToggleCollapsed,
  isDesktop,
  sidebarRef,
  onRestoreMobileFocus,
}: SidebarProps) {
  const { username, profile } = useAuth();
  const { members } = useTeamDirectory();
  const { language } = useLanguage();
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const wasMobileMenuOpen = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [brandRevealed, setBrandRevealed] = useState(false);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);

  useEffect(() => {
    if (isDesktop) {
      wasMobileMenuOpen.current = false;
      return;
    }
    if (mobileMenuOpen) {
      closeButtonRef.current?.focus();
      wasMobileMenuOpen.current = true;
    } else if (wasMobileMenuOpen.current) {
      wasMobileMenuOpen.current = false;
      onRestoreMobileFocus();
    }
  }, [isDesktop, mobileMenuOpen, onRestoreMobileFocus]);

  if (!username) return null;
  const collapseLabel = collapsed
    ? language === 'en'
      ? 'Show sidebar'
      : 'Mostrar barra lateral'
    : language === 'en'
      ? 'Collapse'
      : 'Contraer';
  const desktopToggle = (
    <button
      type="button"
      className="sidebar__desktop-toggle"
      data-cuelume-toggle=""
      onClick={onToggleCollapsed}
      aria-expanded={!collapsed}
      aria-controls="app-sidebar"
      aria-label={collapseLabel}
    >
      {collapsed ? <UnfoldHorizontal aria-hidden="true" /> : <FoldHorizontal aria-hidden="true" />}
    </button>
  );
  const content = (quickActions: SidebarQuickActionsControls) => (
    <>
      <div className="sidebar__top">
        <SidebarBrand animate={!brandRevealed} onReveal={() => setBrandRevealed(true)} />
        {isDesktop ? (
          <Tooltip content={collapseLabel} side="right">
            {desktopToggle}
          </Tooltip>
        ) : (
          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar__close-btn"
            data-cuelume-close=""
            onClick={onCloseMobileMenu}
            data-testid="sidebar-close-toggle"
            aria-label={language === 'en' ? 'Close menu' : 'Cerrar menú'}
          >
            <MorphMenuIcon isOpen size="var(--icon-size-md)" />
          </button>
        )}
      </div>
      <nav className="sidebar__nav" id="sidebar-sections" aria-label={language === 'en' ? 'Sections' : 'Secciones'}>
        {getLocalizedNavigation(language).map((section) => (
          <SidebarGroup
            key={section.id}
            section={section}
            role={profile?.role}
            collapsed={collapsed}
            onNavigate={onCloseMobileMenu}
          />
        ))}
      </nav>
      <footer className="sidebar__footer">
        <SidebarAccountMenu
          username={username}
          displayName={profile?.display_name}
          avatarUrl={profile?.avatar_url}
          role={profile?.role}
          collapsed={collapsed}
          mobile={!isDesktop}
          quickActions={profile ? quickActions : undefined}
        />
      </footer>
    </>
  );

  return (
    <SidebarQuickActions profile={profile} members={members}>
      {(quickActions) =>
        <aside
          ref={sidebarRef}
          className="sidebar"
          id="app-sidebar"
          data-testid="app-sidebar"
          aria-label={language === 'en' ? 'Main navigation' : 'Navegación principal'}
          aria-hidden={!isDesktop && !mobileMenuOpen}
          inert={!isDesktop && !mobileMenuOpen}
        >
          {content(quickActions)}
        </aside>
      }
    </SidebarQuickActions>
  );
}
