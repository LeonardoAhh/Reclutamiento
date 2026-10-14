import { useId } from 'react';
import { Eclipse, Languages } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeSelect } from '@/components/ui/ThemeSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import type { AccountCopy } from '@/pages/account-translations';

export function AccountPreferencesSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { resolvedTheme } = useTheme();

  return (
    <div className="account-appearance">
      <ThemeSelect language={language} className="account-appearance__theme">
        <Eclipse size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.theme}</span>
        <span className="account-setting-row__value" aria-hidden="true">{resolvedTheme === 'dark' ? copy.darkTheme : copy.lightTheme}</span>
      </ThemeSelect>
      <LanguageToggle className="account-appearance__control">
        <Languages size="var(--icon-size-sm)" aria-hidden="true" />
        <span className="account-setting-row__label">{copy.language}</span>
        <span className="account-setting-row__value" aria-hidden="true">{language === 'en' ? copy.english : copy.spanish}</span>
      </LanguageToggle>
      {storageError && <p id={`${id}-storage`} className="account-card__note" role="status">{copy.preferenceStorageFailed}</p>}
    </div>
  );
}
