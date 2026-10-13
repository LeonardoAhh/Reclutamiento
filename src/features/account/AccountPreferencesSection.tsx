import { useId } from 'react';
import { Eclipse } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeSelect } from '@/components/ui/ThemeSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import type { AccountCopy } from '@/pages/account-translations';
import { AccountSection } from './AccountSection';

export function AccountPreferencesSection({ copy }: { copy: AccountCopy }) {
  const id = useId();
  const { language, storageError } = useLanguage();
  const { resolvedTheme } = useTheme();

  return (
    <AccountSection id={id} title={copy.appearanceAndLanguage}>
      <div className="account-appearance">
        <ThemeSelect language={language} className="account-appearance__theme">
          <span className="account-row__copy">
            <span className="account-row__title">{copy.theme}</span>
            <span className="account-row__description">{resolvedTheme === 'dark' ? copy.darkTheme : copy.lightTheme}</span>
          </span>
          <Eclipse size="var(--icon-size-md)" aria-hidden="true" />
        </ThemeSelect>
        <LanguageToggle className="account-appearance__control">
          <span className="account-row__copy">
            <span className="account-row__title">{copy.language}</span>
            <span className="account-row__description">{language === 'en' ? copy.english : copy.spanish}</span>
          </span>
          <span aria-hidden="true">{language.toUpperCase()}</span>
        </LanguageToggle>
      </div>
      {storageError && <p className="account-card__note" role="status">{copy.preferenceStorageFailed}</p>}
    </AccountSection>
  );
}
