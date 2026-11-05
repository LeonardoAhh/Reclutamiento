import { useId, type Ref } from 'react';
import { ChevronRight, Eclipse, Languages, Palette, Volume2, VolumeX } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeSelect } from '@/components/ui/ThemeSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';
import { getAccountPaletteOptions } from './AccountPaletteView';

export function AccountPreferencesSection({
  copy,
  onOpenPalette,
  paletteOpen,
  palettePanelId,
  paletteTriggerRef,
}: {
  copy: AccountCopy;
  onOpenPalette: () => void;
  paletteOpen: boolean;
  palettePanelId: string;
  paletteTriggerRef: Ref<HTMLButtonElement>;
}) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { soundEnabled, soundStorageError, toggleSound } = useFeedback();
  const { palette } = useTheme();
  const paletteOptions = getAccountPaletteOptions(copy, language);

  return (
    <div className="account-appearance" data-tour="account-appearance">
      <ThemeSelect
        language={language}
        labels={{ name: copy.theme, system: copy.systemTheme, light: copy.lightTheme, dark: copy.darkTheme }}
        className="account-appearance__theme"
      >
        <Eclipse size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.theme}</span>
      </ThemeSelect>
      <button
        ref={paletteTriggerRef}
        type="button"
        className="account-appearance__control account-appearance__palette"
        aria-expanded={paletteOpen}
        aria-controls={palettePanelId}
        onClick={onOpenPalette}
      >
        <span className="theme-select__content">
          <Palette size="var(--icon-size-sm)" aria-hidden="true" />
          <span className="account-setting-row__label">{copy.palette}</span>
          <span className="account-setting-row__value">
            {paletteOptions.find((option) => option.value === palette)?.label}
          </span>
          <ChevronRight className="theme-select__chevron" aria-hidden="true" />
        </span>
      </button>
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
      {(storageError || soundStorageError) && (
        <output id={`${id}-storage`} className="account-card__note">
          {copy.preferenceStorageFailed}
        </output>
      )}
    </div>
  );
}
