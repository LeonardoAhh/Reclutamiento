import { MoonStar, SunMedium } from 'lucide';
import { useTheme } from '@/hooks/useTheme';
import { useFeedback } from '@/hooks/useFeedback';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
}

/** Interruptor textual reutilizable para cambiar el tema de la interfaz. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { trigger } = useFeedback();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    trigger('light');
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={['theme-toggle', className].filter(Boolean).join(' ')}
      data-state={isDark ? 'dark' : 'light'}
      data-testid="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <MorphingIcon
        icon={isDark ? MoonStar : SunMedium}
        className="theme-toggle__icon"
        aria-hidden="true"
      />
      <span className="theme-toggle__label">Tema</span>
      <span className="theme-toggle__state" aria-hidden="true">
        {isDark ? 'Oscuro' : 'Claro'}
      </span>
    </button>
  );
}
