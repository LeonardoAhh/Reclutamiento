import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import './ThemeSelect.css';

interface ThemeSelectProps {
  language?: 'es' | 'en';
  labels: { name: string; system: string; light: string; dark: string };
  className?: string;
  children?: ReactNode;
}

export function ThemeSelect({ language = 'es', labels, className, children }: ThemeSelectProps) {
  const id = useId();
  const { preference, storageError, setPreference } = useTheme();
  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: labels.system },
    { value: 'light', label: labels.light },
    { value: 'dark', label: labels.dark },
  ];
  const currentLabel = options.find((option) => option.value === preference)?.label;
  const storageMessage = language === 'en'
    ? 'The theme applies here, but this browser does not allow saving it.'
    : 'La elección se aplica aquí, pero este navegador no permite guardarla.';

  return (
    <div className={['theme-select', className].filter(Boolean).join(' ')}>
      <CustomSelect
        value={preference}
        options={options}
        showPlaceholderOption={false}
        aria-label={labels.name}
        aria-describedby={storageError ? `${id}-storage` : undefined}
        onChange={(value) => {
          if (value === 'system' || value === 'light' || value === 'dark') setPreference(value);
        }}
        customTrigger={
          <span className="theme-select__content">
            {children}
            <span className="account-setting-row__value">{currentLabel}</span>
            <ChevronDown className="theme-select__chevron" aria-hidden="true" />
          </span>
        }
      />
      {storageError && (
        <p id={`${id}-storage`} className="theme-select__notice" role="status">
          {storageMessage}
        </p>
      )}
    </div>
  );
}
