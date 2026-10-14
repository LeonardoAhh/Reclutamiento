import { useId } from 'react';
import { Eclipse, Languages, Volume2, VolumeX } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeSelect } from '@/components/ui/ThemeSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { useFeedback } from '@/hooks/useFeedback';
import { playSound } from '@/lib/sound';
import type { AccountCopy } from '@/pages/account-translations';

export function AccountPreferencesSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { resolvedTheme } = useTheme();
  const { soundEnabled, soundStorageError, toggleSound } = useFeedback();

  return (
    <div className="account-appearance">
      <ThemeSelect language={language} className="account-appearance__theme" sound>
        <Eclipse size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.theme}</span>
        <span className="account-setting-row__value" aria-hidden="true">{resolvedTheme === 'dark' ? copy.darkTheme : copy.lightTheme}</span>
      </ThemeSelect>
      <LanguageToggle className="account-appearance__control" sound>
        <Languages size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.language}</span>
        <span className="account-setting-row__value" aria-hidden="true">{language === 'en' ? copy.english : copy.spanish}</span>
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
        {soundEnabled
          ? <Volume2 size="var(--icon-size-sm)" aria-hidden="true" />
          : <VolumeX size="var(--icon-size-sm)" aria-hidden="true" />}
        <span className="account-setting-row__label">{copy.sound}</span>
        <span className="account-setting-row__value" aria-hidden="true">
          {soundEnabled ? copy.soundOn : copy.soundOff}
        </span>
      </button>
      {(storageError || soundStorageError) && <p id={`${id}-storage`} className="account-card__note" role="status">{copy.preferenceStorageFailed}</p>}
    </div>
  );
}
