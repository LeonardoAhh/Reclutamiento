import { useId } from 'react';
import { Languages, Palette, SunMoon, Volume2, VolumeX } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme, type ThemePalette, type ThemePreference } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';

export function AccountPreferencesSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { soundEnabled, soundStorageError, toggleSound } = useFeedback();
  const { palette, preference, storageError: themeStorageError, setPalette, setPreference } = useTheme();
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: copy.lightTheme },
    { value: 'dark', label: copy.darkTheme },
    { value: 'system', label: copy.systemTheme },
  ];
  const paletteOptions: { value: ThemePalette; label: string }[] = [
    { value: 'original', label: copy.originalPalette },
    { value: 'ocean-saas', label: copy.oceanPalette },
    { value: 'darkmatter-remix', label: copy.goldVoidPalette },
    { value: 'sea-glass', label: copy.seaGlassPalette },
    { value: 'claude-amber', label: copy.claudeAmberPalette },
    { value: 'supabase', label: copy.supabasePalette },
  ];
  paletteOptions.sort((first, second) =>
    first.label.localeCompare(second.label, language === 'en' ? 'en' : 'es', { sensitivity: 'base' }),
  );

  return (
    <div className="account-appearance" data-tour="account-appearance">
      <div className="account-appearance__palette-block">
        <div id={`${id}-theme-label`} className="account-appearance__palette-heading">
          <SunMoon size="var(--icon-size-sm)" aria-hidden="true" />
          <span className="account-setting-row__label">{copy.theme}</span>
        </div>
        <CustomSelect
          id={`${id}-theme`}
          className="account-appearance__palette-select"
          aria-labelledby={`${id}-theme-label`}
          aria-describedby={themeStorageError ? `${id}-storage` : undefined}
          value={preference}
          options={themeOptions}
          showPlaceholderOption={false}
          onChange={(value) => {
            const selected = themeOptions.find((option) => option.value === value);
            if (selected) setPreference(selected.value);
          }}
        />
      </div>
      <div className="account-appearance__palette-block">
        <div id={`${id}-palette-label`} className="account-appearance__palette-heading">
          <Palette size="var(--icon-size-sm)" aria-hidden="true" />
          <span className="account-setting-row__label">{copy.palette}</span>
        </div>
        <CustomSelect
          id={`${id}-palette`}
          className="account-appearance__palette-select"
          aria-labelledby={`${id}-palette-label`}
          value={palette}
          options={paletteOptions}
          showPlaceholderOption={false}
          onChange={(value) => {
            const selected = paletteOptions.find((option) => option.value === value);
            if (selected) setPalette(selected.value);
          }}
        />
      </div>
      <LanguageToggle className="account-appearance__control" sound>
        <Languages size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.language}</span>
        <span className="account-setting-row__value" aria-hidden="true">
          {language === 'en' ? copy.english : copy.spanish}
        </span>
      </LanguageToggle>
      <button
        type="button"
        className="account-appearance__control"
        aria-pressed={soundEnabled}
        aria-describedby={soundStorageError ? `${id}-storage` : undefined}
        onClick={() => {
          toggleSound();
          if (!soundEnabled) playSound('toggle');
        }}
      >
        {soundEnabled ? (
          <Volume2 size="var(--icon-size-sm)" aria-hidden="true" />
        ) : (
          <VolumeX size="var(--icon-size-sm)" aria-hidden="true" />
        )}
        <span className="account-setting-row__label">{copy.sound}</span>
        <span className="account-setting-row__value" aria-hidden="true">
          {soundEnabled ? copy.soundOn : copy.soundOff}
        </span>
      </button>
      {(storageError || soundStorageError || themeStorageError) && (
        <output id={`${id}-storage`} className="account-card__note">
          {copy.preferenceStorageFailed}
        </output>
      )}
    </div>
  );
}
