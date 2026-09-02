import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react';
import { Search as SearchIconData, X as XIconData } from 'lucide';

import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './SearchField.css';

interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label: string;
  onClear?: () => void;
  clearLabel?: string;
}

/**
 * Campo de búsqueda visual compartido. El consumidor conserva la búsqueda,
 * los resultados y los atajos; esta primitiva solo unifica presentación y foco.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      id,
      label,
      value,
      onClear,
      clearLabel = 'Limpiar búsqueda',
      className = '',
      inputMode = 'search',
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasValue = typeof value === 'string' && value.length > 0;

    const handleClear = () => {
      onClear?.();
      document.getElementById(inputId)?.focus();
    };

    return (
      <div className={`search-field ${className}`.trim()}>
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>

        <span className="search-field__icon" aria-hidden="true">
          <MorphingIcon
            icon={SearchIconData}
            size="var(--icon-size-sm)"
          />
        </span>

        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          type="search"
          inputMode={inputMode}
          value={value}
          className="search-field__input"
        />

        {onClear && hasValue && (
          <button
            type="button"
            className="search-field__icon search-field__clear"
            onClick={handleClear}
            aria-label={clearLabel}
          >
            <MorphingIcon
              icon={XIconData}
              size="var(--icon-size-sm)"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);
