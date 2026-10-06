import { useId } from 'react';
import { Eclipse } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import './ThemeSelect.css';

export function ThemeSelect() {
  const id = useId();
  const { resolvedTheme, storageError, setPreference } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const actionLabel = nextTheme === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';

  return (
    <div className="theme-select">
      <button
        type="button"
        className="theme-select__trigger"
        data-mode={resolvedTheme}
        aria-label={actionLabel}
        title={actionLabel}
        aria-describedby={storageError ? `${id}-storage` : undefined}
        onClick={() => setPreference(nextTheme)}
      >
        <Eclipse aria-hidden="true" />
      </button>
      {storageError && (
        <p id={`${id}-storage`} className="theme-select__notice" role="status">
          La elección se aplica aquí, pero este navegador no permite guardarla.
        </p>
      )}
    </div>
  );
}
