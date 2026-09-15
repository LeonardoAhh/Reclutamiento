import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { FLOATING_SURFACE_HOVER_CLOSE_DELAY_MS } from '@/lib/floatingSurface';
import type { NavItem } from './navigation';
import './SidebarSectionNav.css';

export interface SidebarSectionNavProps {
  item: NavItem;
  mobile: boolean;
  onNavigate?: () => void;
  isActive: boolean;
  groups: ReadonlyArray<{
    id: string;
    title?: string;
    items: ReadonlyArray<{
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
  item, mobile, onNavigate, isActive, groups,
}: SidebarSectionNavProps) {
  const [open, setOpen] = useState(false);
  const mobileNavigationRef = useRef(false);
  const openedByHoverRef = useRef(false);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const contentId = useId();
  const titleId = useId();
  const Icon = item.icon;
  const DisclosureIcon = mobile ? ChevronDown : ChevronRight;

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current === null) return;
    window.clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  };

  useEffect(() => clearHoverCloseTimer, []);

  const handleOpenChange = (nextOpen: boolean) => {
    clearHoverCloseTimer();
    openedByHoverRef.current = false;
    setOpen(nextOpen);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (mobile || event.pointerType !== 'mouse') return;
    clearHoverCloseTimer();
    if (open) return;
    openedByHoverRef.current = true;
    setOpen(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (mobile || event.pointerType !== 'mouse' || !openedByHoverRef.current) return;
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      openedByHoverRef.current = false;
      setOpen(false);
      hoverCloseTimerRef.current = null;
    }, FLOATING_SURFACE_HOVER_CLOSE_DELAY_MS);
  };

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
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`sidebar__item sidebar-section__trigger${isActive ? ' sidebar__item--active' : ''}`}
            aria-label={`Vistas de ${item.label}`}
            aria-expanded={open}
            aria-controls={contentId}
            data-testid={`sidebar-nav-${item.to.replace(/\//g, '')}`}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={(event) => {
              if (!openedByHoverRef.current) return;
              event.preventDefault();
              clearHoverCloseTimer();
              openedByHoverRef.current = false;
            }}
          >
            <Icon className="sidebar__item-icon" aria-hidden="true" />
            <span className="sidebar__item-label">{item.label}</span>
            <DisclosureIcon className="sidebar-section__disclosure-icon" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={contentId}
          side={mobile ? 'bottom' : 'right'}
          align="start"
          className="sidebar-section__popover"
          aria-labelledby={titleId}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            if (!mobileNavigationRef.current) return;
            event.preventDefault();
            mobileNavigationRef.current = false;
          }}
        >
          <PopoverHeader className="sidebar-section__popover-header">
            <PopoverTitle id={titleId}>{item.label}</PopoverTitle>
          </PopoverHeader>
          <nav aria-label={`Navegación de ${item.label}`}>
            {groups.map((group) => (
              <div key={group.id} className="sidebar-section__group">
                {group.title && (
                  <h3 className="sidebar-section__group-title">
                    {group.title}
                  </h3>
                )}
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
