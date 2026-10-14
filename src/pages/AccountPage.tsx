import { useId } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { ACCOUNT_PATH, LOGOUT_PATH } from '@/components/layout/navigation';
import { AccountAdminSection } from '@/features/account/AccountAdminSection';
import { AccountPasswordSection } from '@/features/account/AccountPasswordSection';
import { AccountProfile } from '@/features/account/AccountProfile';
import { AccountPreferencesSection } from '@/features/account/AccountPreferencesSection';
import { RecognitionPreferences } from '@/features/account/RecognitionPreferences';
import { AccountSection } from '@/features/account/AccountSection';
import { useAuth } from '@/hooks/useAuth';
import { toNaturalCase } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { accountCopy } from './account-translations';
import './AccountPage.css';

export function AccountPage() {
  const settingsId = useId();
  const { profile, user, username, profileLoading, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = accountCopy(language);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, { preserveAcronyms: false });

  return (
    <main className="account-page container" aria-labelledby="account-page-title">
      <PageHeading id="account-page-title" className="app-page-title">{copy.title}</PageHeading>
      <div className="account-page__layout" data-admin={profile.role === 'admin' || undefined}>
        <div className="account-page__aside">
          <AccountProfile copy={copy} displayName={displayName} email={user?.email} />
          <AccountSection id={settingsId} title={copy.settings} className="account-settings">
            <AccountPasswordSection copy={copy} />
            <AccountPreferencesSection copy={copy} />
          </AccountSection>
          {profile.role === 'reclutador' && <RecognitionPreferences copy={copy} profileId={profile.id} />}
        </div>
        <div className="account-page__stack">
          {profile.role === 'admin' && (
            <AccountAdminSection copy={copy} english={language === 'en'} sessionLoading={authLoading || profileLoading} />
          )}
        </div>
      </div>
      <Link className="account-signout" to={LOGOUT_PATH} state={{ returnTo: ACCOUNT_PATH }}>
        <LogOut size="var(--icon-size-sm)" aria-hidden="true" />{copy.signOut}
      </Link>
    </main>
  );
}
