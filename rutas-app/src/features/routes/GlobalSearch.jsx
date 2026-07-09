import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

const normalizar = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function GlobalSearch({ rutas, query, onQueryChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const boxRef = useRef(null);
  const activeRef = useRef(null);
  const inputRef = useRef(null);

  const q = normalizar(query.trim());
  const results = q
    ? rutas
        .flatMap((r) =>
          r.paradas
            .filter(
              (p) =>
                normalizar(p.colonia).includes(q) ||
                normalizar(p.referencia).includes(q)
            )
            .map((p) => ({ routeId: r.id, parada: p }))
        )
        .slice(0, 30)
    : [];

  const showDropdown = open && q.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/') return;
      const el = document.activeElement;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (showDropdown && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, showDropdown]);

  const choose = (res) => {
    onSelect(res.routeId, res.parada.no);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (query) onQueryChange('');
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      if (showDropdown && results[activeIndex]) {
        e.preventDefault();
        choose(results[activeIndex]);
      }
    }
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <label htmlFor="busqueda-global" className="sr-only">
        Buscar parada en todas las rutas
      </label>
      <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="size-4 shrink-0 text-ash" aria-hidden="true" />
        <input
          id="busqueda-global"
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-listbox"
          aria-activedescendant={
            showDropdown && results[activeIndex]
              ? `option-${results[activeIndex].routeId}-${results[activeIndex].parada.no}`
              : undefined
          }
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar parada en todas las rutas..."
          data-testid="global-search-input"
          className="w-full bg-transparent text-body-sm text-ink placeholder:text-ash focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              setOpen(false);
            }}
            aria-label="Limpiar búsqueda"
            data-testid="global-search-clear"
            className="shrink-0 rounded-full p-0.5 text-mute hover:bg-surface-card"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-auto rounded-lg border border-hairline bg-surface p-1 shadow-soft"
          data-testid="global-search-results"
          role="listbox"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-caption-md text-mute">
              Sin resultados para “{query.trim()}”.
            </p>
          ) : (
            results.map((res, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={`${res.routeId}-${res.parada.no}`}
                  ref={active ? activeRef : null}
                  id={`option-${res.routeId}-${res.parada.no}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(res)}
                  data-testid={`search-result-${res.routeId}-${res.parada.no}`}
                  className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left ${
                    active ? 'bg-surface-card' : ''
                  }`}
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-caption-md font-semibold text-primary">
                    {res.routeId}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body-sm font-semibold text-ink">
                      {res.parada.colonia}
                    </span>
                    <span className="block truncate text-caption-md text-mute">
                      {res.parada.referencia}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
