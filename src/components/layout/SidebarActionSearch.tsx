import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ContactRound, Search, UserRoundPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchField } from '@/components/ui/SearchField';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeString } from '@/lib/utils';
import { PLANTILLA_PATH } from '@/lib/plantillaNavigation';
import { CANDIDATES_PATH } from './navigation';
import type { SidebarCreateAction } from '@/lib/sidebarActionNavigation';
import './SidebarActionSearch.css';

interface SidebarActionSearchProps {
  mobileMenuOpen: boolean;
}

const ACTIONS = [
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

export function SidebarActionSearch({ mobileMenuOpen }: SidebarActionSearchProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const normalizedQuery = normalizeString(query);
  const results = ACTIONS.filter((action) =>
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
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [mobileMenuOpen]);

  function runAction(action: (typeof ACTIONS)[number]) {
    setOpen(false);
    setQuery('');
    navigate(action.path, { state: { sidebarCreateAction: action.id } });
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
      (next < 0 || next >= results.length ? inputRef.current : actionRefs.current[next])?.focus();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="sidebar-action-search__trigger"
          aria-label={language === 'en' ? 'Search actions' : 'Buscar acciones'}
          aria-keyshortcuts="Alt+K"
        >
          <span className="sidebar-action-search__trigger-surface">
            <Search size="var(--icon-size-sm)" aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="sidebar-action-search"
        aria-label={language === 'en' ? 'Search actions' : 'Buscar acciones'}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="sidebar-action-search__field">
          <SearchField
            ref={inputRef}
            label={language === 'en' ? 'Search actions' : 'Buscar acciones'}
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
