import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  customTrigger?: React.ReactNode;
  searchable?: boolean;
}

interface DropdownPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  up: boolean;
}

// Altura máxima del dropdown (debe coincidir con el max-height del CSS).
const DROPDOWN_MAX_HEIGHT = 250;
const GAP = 4;

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  customTrigger,
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pos, setPos] = useState<DropdownPos | null>(null);
  
  // Nuevo estado para teclado
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const typeaheadBuffer = useRef('');
  const typeaheadTimeout = useRef<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Unificamos las opciones visibles incluyendo el placeholder si aplica,
  // para que el índice de resaltado sea consistente.
  const visibleOptions = useMemo(() => {
    let opts = options;
    if (searchable && searchQuery) {
      opts = opts.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (placeholder && !searchQuery) {
      return [{ value: '', label: placeholder }, ...opts];
    }
    return opts;
  }, [options, searchable, searchQuery, placeholder]);

  // Calcula posición fija del dropdown a partir del rect del trigger. Al ser
  // `position: fixed` en un portal, ningún `overflow` de ancestros (modales,
  // tablas, wizards) lo recorta.
  const recompute = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const up = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
    setPos({
      left: rect.left,
      width: rect.width,
      up,
      ...(up
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
    });
  }, []);

  // Reset highlight cuando se abre o cambia la búsqueda
  useEffect(() => {
    if (isOpen) {
      const index = visibleOptions.findIndex(o => o.value === value);
      setHighlightedIndex(index >= 0 ? index : 0);
      recompute();
      
      // Auto-focus manual para el input de búsqueda si existe
      setTimeout(() => {
        if (searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, value, visibleOptions.length, recompute]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => recompute();

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [isOpen, recompute]);

  // Auto-scroll del item resaltado
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const list = listRef.current;
      // +1 si hay input de búsqueda (porque el input ocupa el primer hijo de la lista)
      const item = list.children[searchable ? highlightedIndex + 1 : highlightedIndex] as HTMLElement;
      if (item && item.tagName === 'BUTTON') {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const listTop = list.scrollTop;
        const listBottom = listTop + list.clientHeight;

        if (itemTop < listTop) {
          list.scrollTop = itemTop;
        } else if (itemBottom > listBottom) {
          list.scrollTop = itemBottom - list.clientHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < visibleOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleOptions.length) {
          handleSelect(visibleOptions[highlightedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        // Typeahead para selects no buscables
        if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          typeaheadBuffer.current += e.key.toLowerCase();
          
          if (typeaheadTimeout.current) clearTimeout(typeaheadTimeout.current);
          typeaheadTimeout.current = window.setTimeout(() => {
            typeaheadBuffer.current = '';
          }, 500);

          const matchIndex = visibleOptions.findIndex(o => 
            o.label.toLowerCase().startsWith(typeaheadBuffer.current)
          );
          
          if (matchIndex !== -1) {
            setHighlightedIndex(matchIndex);
          }
        }
        break;
    }
  };

  return (
    <div className={`custom-select-container ${className}`} ref={rootRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`custom-select-trigger ${customTrigger ? 'custom-select-trigger--unstyled' : ''} ${!selectedOption && !customTrigger ? 'is-placeholder' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {customTrigger ? (
          customTrigger
        ) : (
          <>
            <span className="custom-select-value">{displayValue}</span>
            <ChevronDown size={16} aria-hidden="true" className="custom-select-icon" />
          </>
        )}
      </button>

      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`custom-select-dropdown custom-select-dropdown--portal${pos.up ? ' custom-select-dropdown--up' : ''}`}
            role="listbox"
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up ? { bottom: pos.bottom } : { top: pos.top }),
            }}
          >
            <div className="custom-select-list" ref={listRef}>
              {searchable && (
                <div className="custom-select-search">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="custom-select-search-input"
                    aria-label="Buscar opciones"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                        e.preventDefault(); // Evita que el cursor se mueva en el input
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}

              {visibleOptions.length === 0 && searchable ? (
                <div className="custom-select-no-results">No se encontraron resultados</div>
              ) : (
                visibleOptions.map((opt, index) => (
                  <button
                    key={`${opt.value}-${index}`}
                    type="button"
                    className={`custom-select-option ${value === opt.value ? 'is-selected' : ''} ${highlightedIndex === index ? 'is-highlighted' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={value === opt.value}
                  >
                    <span className="custom-select-option-label">{opt.label}</span>
                    {value === opt.value && <Check size={16} className="custom-select-check" />}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
