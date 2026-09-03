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
  isActive: boolean;
  groups: Array<{
    id: string;
    title?: string;
    items: Array<{
      id: string;
      label: string;
      icon: LucideIcon;
      href: string;
      isCurrent: boolean;
      external?: boolean;
    }>;
  }>;
}

export function SidebarSectionNav({
  item, collapsed, mobile, onNavigate, isActive, groups,
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`sidebar__item sidebar-section__trigger${isActive ? ' sidebar__item--active' : ''}`}
            aria-label={`Vistas de ${item.label}`}
            aria-expanded={open}
            aria-controls={contentId}
            data-testid={`sidebar-nav-${item.to.replace(/\//g, '')}`}
          >
            <Icon className="sidebar__item-icon sidebar-section__entry-icon" aria-hidden="true" />
            {!collapsed && (
              <>
                <span className="sidebar__item-label">{item.label}</span>
                <Ellipsis className="sidebar-section__options-icon" aria-hidden="true" />
              </>
            )}
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
                <ul className="sidebar-section__views" aria-label={group.title}>
                  {group.items.map(({
                    id,
                    label,
                    icon: ViewIcon,
                    href: viewHref,
                    isCurrent: current,
                    external,
                  }) => {
                    const content = (
                      <>
                        <ViewIcon className="sidebar-section__icon" aria-hidden="true" />
                        <span>{label}</span>
                      </>
                    );

                    return (
                      <li key={id}>
                        {external ? (
                          <a
                            href={viewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-section__view type-caption-sm"
                            aria-label={`${label} (abre en una pestaña nueva)`}
                            onClick={handleNavigate}
                          >
                            {content}
                          </a>
                        ) : (
                          <Link
                            to={viewHref}
                            className="sidebar-section__view type-caption-sm"
                            aria-current={isActive && current ? 'page' : undefined}
                            onClick={handleNavigate}
                          >
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </PopoverContent>
      </Popover>
    </div>
  );
}
