import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
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

export function AccountPaletteView({
  copy,
  actionsTarget,
  focusReady,
  onBack,
}: {
  copy: AccountCopy;
  actionsTarget: HTMLElement | null;
  focusReady: boolean;
  onBack: () => void;
}) {
  const id = useId();
  const selectedRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { palette, resolvedTheme, setPalette } = useTheme();
  const options = getAccountPaletteOptions(copy, language);

  useEffect(() => {
    if (focusReady) selectedRef.current?.focus({ preventScroll: true });
  }, [focusReady]);

  return (
    <>
      <fieldset className="account-palette-options">
        <legend className="sr-only">{copy.palette}</legend>
        {options.map((option) => (
          <label key={option.value} className="account-palette-option">
            <input
              ref={palette === option.value ? selectedRef : undefined}
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
            <span
              className="account-palette-swatch"
              data-palette-preview=""
              data-color-palette={option.value}
              data-color-scheme={resolvedTheme}
              aria-hidden="true"
            >
              <span className="account-palette-swatch__canvas" />
              <span className="account-palette-swatch__primary" />
              <span className="account-palette-swatch__ink" />
            </span>
            {palette === option.value && (
              <CircleCheckBig className="account-palette-option__check" aria-hidden="true" />
            )}
          </label>
        ))}
      </fieldset>
      {actionsTarget &&
        createPortal(
          <button type="button" className="password-change-form__action" onClick={onBack}>
            {copy.back}
          </button>,
          actionsTarget,
        )}
    </>
  );
}
