import { useId } from 'react';
import { CircleCheckBig } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useTheme, type ThemePalette } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';
import './AccountPalettePicker.css';

export function getAccountPaletteOptions(copy: AccountCopy, language: Language) {
  const options: { value: ThemePalette; label: string }[] = [
    { value: 'original', label: copy.originalPalette },
    { value: 'ocean-saas', label: copy.oceanPalette },
    { value: 'darkmatter-remix', label: copy.goldVoidPalette },
    { value: 'sea-glass', label: copy.seaGlassPalette },
    { value: 'claude-amber', label: copy.claudeAmberPalette },
    { value: 'supabase', label: copy.supabasePalette },
  ];

  return options.sort((first, second) =>
    first.label.localeCompare(second.label, language === 'en' ? 'en' : 'es', { sensitivity: 'base' }),
  );
}

export function AccountPaletteView({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language } = useLanguage();
  const { palette, setPalette } = useTheme();
  const options = getAccountPaletteOptions(copy, language);

  return (
    <fieldset className="account-palette-options">
      <legend className="sr-only">{copy.palette}</legend>
      {options.map((option) => (
        <label key={option.value} className="account-palette-option">
          <input
            className="sr-only"
            type="radio"
            name={`${id}-palette`}
            value={option.value}
            checked={palette === option.value}
            onChange={() => {
              if (palette !== option.value) playSound('select');
              setPalette(option.value);
            }}
          />
          <span className="account-palette-option__title">{option.label}</span>
          {palette === option.value && <CircleCheckBig className="account-palette-option__check" aria-hidden="true" />}
        </label>
      ))}
    </fieldset>
  );
}
