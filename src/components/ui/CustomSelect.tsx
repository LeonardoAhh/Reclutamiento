import { useState, useRef, useEffect, useCallback } from 'react';
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
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

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

  useEffect(() => {
    if (!isOpen) return;

    recompute();

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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${className}`} ref={rootRef}>
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
            <div className="custom-select-list">
              {placeholder && (
                <button
                  type="button"
                  className={`custom-select-option ${value === '' ? 'is-selected' : ''}`}
                  onClick={() => handleSelect('')}
                  role="option"
                  aria-selected={value === ''}
                >
                  <span className="custom-select-option-label">{placeholder}</span>
                  {value === '' && <Check size={16} className="custom-select-check" />}
                </button>
              )}

              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`custom-select-option ${value === opt.value ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={value === opt.value}
                >
                  <span className="custom-select-option-label">{opt.label}</span>
                  {value === opt.value && <Check size={16} className="custom-select-check" />}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
