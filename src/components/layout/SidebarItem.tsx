import { useEffect, useRef, useState } from 'react';
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
  const { to, label, icon: Icon, end } = item;
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelTruncated, setLabelTruncated] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const showTooltip = collapsed || labelTruncated;

  useEffect(() => {
    const labelElement = labelRef.current;
    if (!labelElement || collapsed) return;

    let active = true;
    const update = () => {
      if (active) setLabelTruncated(labelElement.scrollWidth > labelElement.clientWidth);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(labelElement);
    void document.fonts.ready.then(update);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [collapsed, label]);

  const isActive = end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const link = (
    <NavLink
      to={to}
      end={end}
      className={clsx('sidebar__item', isActive && 'sidebar__item--active')}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        )
          onNavigate?.();
      }}
      data-testid={`sidebar-nav-${to.replace('/', '') || 'kpis'}`}
      data-cuelume-navigate=""
      onPointerEnter={() => preloadRoute(to)}
      onFocus={() => preloadRoute(to)}
    >
      <Icon aria-hidden="true" className="sidebar__item-icon" />
      <span ref={labelRef} className="sidebar__item-label">
        {label}
      </span>
    </NavLink>
  );

  return (
    <li>
      <Tooltip
        content={label}
        side="right"
        open={tooltipOpen && showTooltip}
        onOpenChange={(open) => setTooltipOpen(open && showTooltip)}
      >
        {link}
      </Tooltip>
    </li>
  );
}
