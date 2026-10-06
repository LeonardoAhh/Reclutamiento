import { useId } from 'react';
import { Eclipse } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import './ThemeSelect.css';

interface ThemeSelectProps {
  language?: 'es' | 'en';
  className?: string;
}

export function ThemeSelect({ language = 'es', className }: ThemeSelectProps) {
  const id = useId();
  const { resolvedTheme, storageError, setPreference } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const actionLabel = language === 'en'
    ? nextTheme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme'
    : nextTheme === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
  const storageMessage = language === 'en'
    ? 'The theme applies here, but this browser does not allow saving it.'
    : 'La elección se aplica aquí, pero este navegador no permite guardarla.';

  return (
    <div className={['theme-select', className].filter(Boolean).join(' ')}>
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
          {storageMessage}
        </p>
      )}
    </div>
  );
}
