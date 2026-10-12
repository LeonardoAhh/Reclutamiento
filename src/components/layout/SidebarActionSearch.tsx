import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ContactRound, Network, Search, UserRoundPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchField } from '@/components/ui/SearchField';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeString } from '@/lib/utils';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { LEAVE_REQUESTS_PATH } from '@/features/leave/requests';
import { preloadRoute } from '@/lib/routePages';
import { CANDIDATES_PATH, ORGANIZATION_CHART_PATH } from './navigation';
import type { SidebarCreateAction } from '@/lib/sidebarActionNavigation';
import './SidebarActionSearch.css';

interface SidebarActionSearchProps {
  mobileMenuOpen: boolean;
  quickActions?: {
    canReviewRequests: boolean;
    openLeavePolicy: (focusTarget: HTMLElement) => void;
  };
}

const CREATE_ACTIONS = [
  { id: 'create-candidate', path: CANDIDATES_PATH, icon: UserRoundPlus, es: 'Crear candidato', en: 'Create candidate', keywords: 'candidatos candidates' },
  { id: 'create-employee', path: PLANTILLA_PATH, icon: ContactRound, es: 'Crear empleado', en: 'Create employee', keywords: 'empleados plantilla employees workforce' },
] as const satisfies ReadonlyArray<{
  id: SidebarCreateAction;
  path: string;
  icon: typeof UserRoundPlus;
  es: string;
  en: string;
  keywords: string;
}>;

const ORGANIZATION_ACTION = {
  id: 'org-chart', path: ORGANIZATION_CHART_PATH, icon: Network,
  es: 'Organigrama', en: 'Org chart', keywords: 'organigrama org chart',
} as const;

export function SidebarActionSearch({ mobileMenuOpen, quickActions }: SidebarActionSearchProps) {
  const { language } = useLanguage();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const activeInputRef = isDesktop ? desktopInputRef : inputRef;
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const actions = [
    ...CREATE_ACTIONS,
    ...(quickActions ? [{
      id: 'requests' as const, icon: CalendarDays,
      es: quickActions.canReviewRequests ? 'Gestionar' : 'Solicitar',
      en: quickActions.canReviewRequests ? 'Requests' : 'Leave',
      keywords: 'solicitudes permisos vacaciones requests leave gestionar solicitar',
    }] : []),
    ORGANIZATION_ACTION,
  ];
  const normalizedQuery = normalizeString(query);
  const results = actions.filter((action) =>
    normalizeString(`${action.es} ${action.en} ${action.keywords}`).includes(normalizedQuery),
  );

  useEffect(() => {
    if (mobileMenuOpen) setOpen(false);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) return;
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      setOpen(true);
      activeInputRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [mobileMenuOpen, activeInputRef]);

  function runAction(action: (typeof actions)[number]) {
    if (action.id === 'requests' && quickActions && !quickActions.canReviewRequests) {
      const focusTarget = isDesktop ? desktopInputRef.current : mobileTriggerRef.current;
      if (!focusTarget) return;
      setOpen(false);
      setQuery('');
      quickActions.openLeavePolicy(focusTarget);
      return;
    }
    setOpen(false);
    setQuery('');
    if (action.id === 'requests') {
      navigate(LEAVE_REQUESTS_PATH);
    } else if (action.id === 'org-chart') {
      navigate(ORGANIZATION_CHART_PATH);
    } else {
      navigate(action.path, { state: { sidebarCreateAction: action.id } });
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setOpen(true);
      actionRefs.current[0]?.focus();
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      runAction(results[0]);
    }
  }

  function handleActionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = index + (event.key === 'ArrowDown' ? 1 : -1);
      (next < 0 || next >= results.length ? activeInputRef.current : actionRefs.current[next])?.focus();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {isDesktop && (
        <PopoverAnchor asChild>
          <div className="sidebar-action-search__desktop">
            <SearchField
              ref={desktopInputRef}
              label={language === 'en' ? 'Search' : 'Buscar'}
              placeholder={language === 'en' ? 'Search' : 'Buscar'}
              value={query}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
              onKeyDown={handleInputKeyDown}
              onClear={() => { setQuery(''); setOpen(true); }}
              clearLabel={language === 'en' ? 'Clear action search' : 'Limpiar b\u00fasqueda de acciones'}
              aria-controls={listId}
              aria-expanded={open}
              aria-keyshortcuts="Alt+K"
              autoComplete="off"
            />
          </div>
        </PopoverAnchor>
      )}
      {!isDesktop && (
        <PopoverTrigger asChild>
          <button
            type="button"
            className="sidebar-action-search__trigger"
            ref={mobileTriggerRef}
            aria-label={language === 'en' ? 'Search' : 'Buscar'}
            aria-keyshortcuts="Alt+K"
          >
            <span className="sidebar-action-search__trigger-surface">
              <Search size="var(--icon-size-sm)" aria-hidden="true" />
            </span>
          </button>
        </PopoverTrigger>
      )}
      <PopoverContent
        align="end"
        className="sidebar-action-search"
        aria-label={language === 'en' ? 'Search' : 'Buscar'}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          activeInputRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (isDesktop) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isDesktop && desktopInputRef.current?.parentElement?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
      >
        {!isDesktop && (
          <div className="sidebar-action-search__field">
          <SearchField
            ref={inputRef}
            label={language === 'en' ? 'Search' : 'Buscar'}
            placeholder={language === 'en' ? 'Search' : 'Buscar'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onClear={() => { setQuery(''); setOpen(true); }}
            clearLabel={language === 'en' ? 'Clear action search' : 'Limpiar búsqueda de acciones'}
            aria-controls={listId}
            aria-expanded={open}
            aria-keyshortcuts="Alt+K"
            autoComplete="off"
          />
          {!query && (
            <span className="sidebar-action-search__shortcut" aria-hidden="true">
              <kbd>Alt</kbd><kbd>K</kbd>
            </span>
          )}
          </div>
        )}
        <div id={listId} className="sidebar-action-search__results">
          {results.length > 0 ? (
            <ul className="sidebar-action-search__list" aria-label={language === 'en' ? 'Available actions' : 'Acciones disponibles'}>
              {results.map((action, index) => {
                const Icon = action.icon;
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
          ) : (
            <p className="sidebar-action-search__empty" role="status">
              {language === 'en' ? 'No matching actions' : 'Sin acciones coincidentes'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
