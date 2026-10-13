import { PageHeading } from '@/components/layout/PageHeading';
import { AccountAdminSection } from '@/features/account/AccountAdminSection';
import { AccountPasswordSection } from '@/features/account/AccountPasswordSection';
import { AccountProfile } from '@/features/account/AccountProfile';
import { AccountPreferencesSection } from '@/features/account/AccountPreferencesSection';
import { RecognitionPreferences } from '@/features/account/RecognitionPreferences';
import { useAuth } from '@/hooks/useAuth';
import { toNaturalCase } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { accountCopy } from './account-translations';
import './AccountPage.css';

export function AccountPage() {
  const { profile, user, username, profileLoading, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = accountCopy(language);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, { preserveAcronyms: false });

  return (
    <main className="account-page container container--compact" aria-labelledby="account-page-title">
      <PageHeading id="account-page-title" className="app-page-title">{copy.title}</PageHeading>
      <div className="account-page__layout">
        <div className="account-page__aside">
          <AccountProfile copy={copy} displayName={displayName} email={user?.email} />
        </div>
        <div className="account-page__stack">
          <AccountPasswordSection copy={copy} />
          <AccountPreferencesSection copy={copy} />
          {profile.role === 'reclutador' && <RecognitionPreferences copy={copy} profileId={profile.id} />}
          {profile.role === 'admin' && (
            <AccountAdminSection copy={copy} english={language === 'en'} sessionLoading={authLoading || profileLoading} />
          )}
        </div>
      </div>
    </main>
  );
}
