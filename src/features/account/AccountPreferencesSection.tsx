import { useId } from 'react';
import { ChevronRight, Languages, Palette, Volume2, VolumeX } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountPaletteView, getAccountPaletteOptions } from './AccountPaletteView';

export function AccountPreferencesSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { soundEnabled, soundStorageError, toggleSound } = useFeedback();
  const { palette } = useTheme();
  const paletteOptions = getAccountPaletteOptions(copy, language);

  return (
    <div className="account-appearance" data-tour="account-appearance">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="account-appearance__control account-appearance__palette">
            <Palette size="var(--icon-size-sm)" aria-hidden="true" />
            <span className="account-setting-row__label">{copy.palette}</span>
            <span className="account-setting-row__value">
              {paletteOptions.find((option) => option.value === palette)?.label}
            </span>
            <ChevronRight className="account-appearance__palette-chevron" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="account-palette-popover" aria-label={copy.palette}>
          <AccountPaletteView copy={copy} />
        </PopoverContent>
      </Popover>
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
