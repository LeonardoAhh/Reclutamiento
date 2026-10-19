import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ClipboardCheck, Columns3, LayoutGrid, Network } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { KANBAN_PATH } from '@/features/kanban/types';
import { PERFORMANCE_EVALUATIONS_2027_PATH } from '@/features/performance-evaluations-2027/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { preloadRoute } from '@/lib/routePages';
import { playSound } from '@/lib/sound';
import { ORGANIZATION_CHART_PATH } from './navigation';
import './SidebarActionSearch.css';

interface SidebarActionSearchProps {
  mobileMenuOpen: boolean;
  quickActions?: {
    canReviewRequests: boolean;
    openLeavePolicy: (focusTarget: HTMLElement) => void;
  };
}

const ORGANIZATION_ACTION = {
  id: 'org-chart', path: ORGANIZATION_CHART_PATH, icon: Network,
  es: 'Organigrama', en: 'Org chart',
} as const;

const EVALUATION_ACTION = {
  id: 'performance-evaluations-2027',
  path: PERFORMANCE_EVALUATIONS_2027_PATH,
  icon: ClipboardCheck,
  es: 'Evaluaciones 2027',
  en: '2027 evaluations',
} as const;

export function SidebarActionSearch({ mobileMenuOpen, quickActions }: SidebarActionSearchProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionRefs = useRef<Array<HTMLButtonElement | HTMLAnchorElement | null>>([]);
  const openingLeavePolicyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const actions = [
    ...(quickActions ? [{
      id: 'requests' as const, icon: CalendarDays,
      es: quickActions.canReviewRequests ? 'Gestionar' : 'Solicitar',
      en: quickActions.canReviewRequests ? 'Requests' : 'Leave',
    }] : []),
    EVALUATION_ACTION,
    ORGANIZATION_ACTION,
    { id: 'kanban' as const, path: KANBAN_PATH, icon: Columns3, es: 'Kanban', en: 'Kanban' },
  ];

  useEffect(() => {
    if (mobileMenuOpen) setOpen(false);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) return;
    const openQuickAccess = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      triggerRef.current?.focus();
      if (!open) playSound('open');
      setOpen(true);
    };
    window.addEventListener('keydown', openQuickAccess);
    return () => window.removeEventListener('keydown', openQuickAccess);
  }, [mobileMenuOpen, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen !== open) playSound(nextOpen ? 'open' : 'close');
    setOpen(nextOpen);
  }

  function runAction(action: (typeof actions)[number]) {
    if (action.id === 'requests' && quickActions && !quickActions.canReviewRequests) {
      const focusTarget = triggerRef.current;
      if (!focusTarget) return;
      openingLeavePolicyRef.current = true;
      playSound('open');
      setOpen(false);
      quickActions.openLeavePolicy(focusTarget);
      return;
    }
    playSound('navigate');
    setOpen(false);
    if (action.id === 'requests') {
      navigate(LEAVE_REQUESTS_PATH);
    } else if (action.id === 'kanban') {
      navigate(KANBAN_PATH);
    } else if (action.id === 'org-chart') {
      navigate(ORGANIZATION_CHART_PATH);
    } else {
      navigate(action.path);
    }
  }

  function handleActionKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + actions.length) % actions.length;
      actionRefs.current[next]?.focus();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="sidebar-action-search__trigger"
          ref={triggerRef}
          aria-label={language === 'en' ? 'Quick access' : 'Accesos rápidos'}
          aria-keyshortcuts="Alt+K"
        >
          <span className="sidebar-action-search__trigger-surface">
            <LayoutGrid size="var(--icon-size-sm)" aria-hidden="true" />
            <span className="sidebar-action-search__trigger-label" aria-hidden="true">
              {language === 'en' ? 'Shortcuts' : 'Accesos'}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="sidebar-action-search"
        aria-label={language === 'en' ? 'Quick access' : 'Accesos rápidos'}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          actionRefs.current[0]?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (openingLeavePolicyRef.current) {
            event.preventDefault();
            openingLeavePolicyRef.current = false;
          }
        }}
      >
        <div className="sidebar-action-search__results">
          <ul className="sidebar-action-search__list" aria-label={language === 'en' ? 'Available actions' : 'Acciones disponibles'}>
            {actions.map((action, index) => {
              const Icon = action.icon;
              if (action.id === 'kanban' || action.id === 'performance-evaluations-2027') return (
                <li key={action.id}>
                  <Link to={action.path} className="sidebar-action-search__action"
                    ref={(node) => { actionRefs.current[index] = node; }}
                    onClick={() => { playSound('navigate'); setOpen(false); }}
                    onKeyDown={(event) => handleActionKeyDown(event, index)}
                    onPointerEnter={() => preloadRoute(action.path)}
                    onFocus={() => preloadRoute(action.path)}>
                    <Icon size="var(--icon-size-md)" aria-hidden="true" />
                    <span>{language === 'en' ? action.en : action.es}</span>
                  </Link>
                </li>
              );
              return (
                <li key={action.id}>
                  <button
                    ref={(node) => { actionRefs.current[index] = node; }}
                    type="button"
                    className="sidebar-action-search__action"
                    onClick={() => runAction(action)}
                    onKeyDown={(event) => handleActionKeyDown(event, index)}
                    onPointerEnter={() => {
                      if (action.id === 'org-chart') preloadRoute(ORGANIZATION_CHART_PATH);
                      if (action.id === 'requests' && quickActions?.canReviewRequests) preloadRoute(LEAVE_REQUESTS_PATH);
                    }}
                    onFocus={() => {
                      if (action.id === 'org-chart') preloadRoute(ORGANIZATION_CHART_PATH);
                      if (action.id === 'requests' && quickActions?.canReviewRequests) preloadRoute(LEAVE_REQUESTS_PATH);
                    }}
                  >
                    <Icon size="var(--icon-size-md)" aria-hidden="true" />
                    <span>{language === 'en' ? action.en : action.es}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
