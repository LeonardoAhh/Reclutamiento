import { useId, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Ellipsis, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import type { NavItem } from './navigation';
import './SidebarSectionNav.css';

export interface SidebarSectionNavProps {
  item: NavItem;
  collapsed: boolean;
  mobile: boolean;
  onNavigate?: () => void;
  href: string;
  isActive: boolean;
  isCurrent: boolean;
  groups: Array<{
    id: string;
    title?: string;
    items: Array<{ id: string; label: string; icon: LucideIcon; href: string; isCurrent: boolean }>;
  }>;
}

export function SidebarSectionNav({
  item, collapsed, mobile, onNavigate, href, isActive, isCurrent, groups,
}: SidebarSectionNavProps) {
  const [open, setOpen] = useState(false);
  const mobileNavigationRef = useRef(false);
  const contentId = useId();
  const Icon = item.icon;

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    mobileNavigationRef.current = mobile;
    setOpen(false);
    onNavigate?.();
    if (mobile) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>('.app-header__mobile-menu-btn')?.focus();
      });
    }
  };

  return (
    <div className="sidebar-section">
      {!collapsed && (
        <Link
          to={href}
          className={`sidebar__item sidebar-section__link${isActive ? ' sidebar__item--active' : ''}`}
          aria-current={isActive && isCurrent ? 'page' : undefined}
          onClick={handleNavigate}
          data-testid={`sidebar-nav-${item.to.replace(/\//g, '')}`}
        >
          <Icon className="sidebar__item-icon sidebar-section__entry-icon" aria-hidden="true" />
          <span className="sidebar__item-label">{item.label}</span>
        </Link>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`sidebar-section__trigger${collapsed ? ' sidebar-section__trigger--collapsed' : ''}${isActive ? ' sidebar-section__trigger--active' : ''}`}
            aria-label={`Vistas de ${item.label}`}
            aria-expanded={open}
            aria-controls={contentId}
          >
            {collapsed
              ? <Icon className="sidebar-section__entry-icon" aria-hidden="true" />
              : <Ellipsis className="sidebar-section__options-icon" aria-hidden="true" />}
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={contentId}
          side={mobile ? 'bottom' : 'right'}
          align="start"
          className="sidebar-section__popover"
          aria-label={`Vistas de ${item.label}`}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            if (!mobileNavigationRef.current) return;
            event.preventDefault();
            mobileNavigationRef.current = false;
          }}
        >
          <nav aria-label={`Navegación de ${item.label}`}>
            {groups.map((group) => (
              <div key={group.id} className="sidebar-section__group">
                {group.title && (
                  <p className="sidebar-section__group-title type-caption-up">{group.title}</p>
                )}
                <ul className="sidebar-section__views" aria-label={group.title}>
                  {group.items.map(({ id, label, icon: ViewIcon, href: viewHref, isCurrent: current }) => (
                    <li key={id}>
                      <Link
                        to={viewHref}
                        className="sidebar-section__view type-caption-sm"
                        aria-current={isActive && current ? 'page' : undefined}
                        onClick={handleNavigate}
                      >
                        <ViewIcon className="sidebar-section__icon" aria-hidden="true" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </PopoverContent>
      </Popover>
    </div>
  );
}
