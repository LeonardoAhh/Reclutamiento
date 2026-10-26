import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Tooltip } from '@/components/ui/Tooltip';
import { preloadRoute } from '@/lib/routePages';
import type { NavItem } from './navigation';

type SidebarItemProps = {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({ item, collapsed, onNavigate }: SidebarItemProps) {
  const location = useLocation();
  const { to, label, icon: Icon, badge, end } = item;
  const isActive = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const link = (
    <NavLink
      to={to}
      end={end}
      className={clsx('sidebar__item', isActive && 'sidebar__item--active')}
      aria-current={isActive ? 'page' : undefined}
      aria-label={badge ? `${label}, ${badge}` : label}
      onClick={(event) => {
        if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onNavigate?.();
      }}
      data-testid={`sidebar-nav-${to.replace('/', '') || 'kpis'}`}
      onPointerEnter={() => preloadRoute(to)}
      onFocus={() => preloadRoute(to)}
    >
      <Icon aria-hidden="true" className="sidebar__item-icon" />
      <span className="sidebar__item-label">{label}</span>
      {badge && <span className="sidebar__item-badge">{badge}</span>}
    </NavLink>
  );

  return <li>{collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link}</li>;
}
