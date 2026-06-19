import { useState, useRef, useEffect } from 'react';
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
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Altura máxima del dropdown (debe coincidir con el max-height del CSS)
  const DROPDOWN_MAX_HEIGHT = 250;

  // Calcula si el dropdown debe abrir hacia arriba para no salirse del
  // viewport ni empujar el contenido. Lo recomputamos en cada apertura,
  // resize y scroll mientras está abierto.
  const recomputeDropDirection = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    // Solo flipea si abajo no cabe Y arriba hay más espacio.
    setDropUp(spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow);
  };

  useEffect(() => {
    if (!isOpen) return;

    recomputeDropDirection();

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => recomputeDropDirection();

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
  }, [isOpen]);

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

      {isOpen && (
        <div
          className={`custom-select-dropdown${dropUp ? ' custom-select-dropdown--up' : ''}`}
          role="listbox"
        >
          <div className="custom-select-list">
            {placeholder && (
              <button
                type="button"
                className={`custom-select-option ${value === '' ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
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
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={value === opt.value}
              >
                <span className="custom-select-option-label">{opt.label}</span>
                {value === opt.value && <Check size={16} className="custom-select-check" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
