import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MorphMenuIcon } from '@/components/ui/MorphMenuIcon';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedNavigation } from './navigation';
import { SidebarBrand } from './SidebarBrand';
import { SidebarGroup } from './SidebarGroup';
import { SidebarAccountMenu } from './SidebarAccountMenu';
import './Sidebar.css';

type SidebarProps = {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  collapsed?: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ mobileMenuOpen = false, onCloseMobileMenu, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const { username, profile } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mobileMenuOpen) sidebarRef.current?.querySelector<HTMLButtonElement>('.sidebar__close-btn')?.focus();
  }, [mobileMenuOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!mobileMenuOpen || !sidebar) return;
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    sidebar.addEventListener('keydown', handleTab);
    return () => sidebar.removeEventListener('keydown', handleTab);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    onCloseMobileMenu?.();
  }, [location.pathname, onCloseMobileMenu]);

  if (!username) return null;
  const desktopToggle = (
    <button type="button" className="sidebar__desktop-toggle" data-cuelume-toggle="" onClick={onToggleCollapsed}
      aria-expanded={!collapsed} aria-controls="app-sidebar"
      aria-label={collapsed
        ? language === 'en' ? 'Show sidebar' : 'Mostrar barra lateral'
        : language === 'en' ? 'Collapse sidebar' : 'Contraer barra lateral'}>
      {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
    </button>
  );
  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      data-mobile-open={mobileMenuOpen}
      aria-label={language === 'en' ? 'Main navigation' : 'Navegación principal'}
      aria-modal={mobileMenuOpen || undefined}
      role={mobileMenuOpen ? 'dialog' : undefined}
      id="app-sidebar"
      data-testid="app-sidebar"
    >
      <div className="sidebar__top">
        <SidebarBrand />
        <Tooltip content={collapsed
          ? language === 'en' ? 'Show sidebar' : 'Mostrar barra lateral'
          : language === 'en' ? 'Collapse sidebar' : 'Contraer barra lateral'} side="right">
          {desktopToggle}
        </Tooltip>
        <button type="button" className="sidebar__close-btn" data-cuelume-close="" onClick={onCloseMobileMenu}
          aria-expanded={mobileMenuOpen} aria-controls="app-sidebar"
          data-testid="sidebar-close-toggle"
          aria-label={language === 'en' ? 'Close menu' : 'Cerrar menú'}>
          <MorphMenuIcon isOpen size="var(--icon-size-md)" />
        </button>
      </div>
      <nav className="sidebar__nav" id="sidebar-sections" aria-label={language === 'en' ? 'Sections' : 'Secciones'}>
        {getLocalizedNavigation(language).map((section) => (
          <SidebarGroup key={section.id} section={section} role={profile?.role} collapsed={collapsed && !mobileMenuOpen}
            onNavigate={onCloseMobileMenu} />
        ))}
      </nav>
      <footer className="sidebar__footer">
        <SidebarAccountMenu username={username} displayName={profile?.display_name} avatarUrl={profile?.avatar_url}
          role={profile?.role} collapsed={collapsed && !mobileMenuOpen} />
      </footer>
    </aside>
  );
}
