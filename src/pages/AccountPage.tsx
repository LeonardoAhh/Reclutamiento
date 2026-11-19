import { useEffect, useId, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Modal } from '@/components/ui/Modal';
import { MaintenanceControl } from '@/features/account/MaintenanceControl';
import { TeamManagement } from '@/features/team/TeamManagement';
import { AccountPasswordSection, type AccountSettingsView } from '@/features/account/AccountPasswordSection';
import { AccountPreferencesSection } from '@/features/account/AccountPreferencesSection';
import { PasswordChangeForm } from '@/features/account/PasswordChangeForm';
import { AccountProfile } from '@/features/account/AccountProfile';
import { RecognitionPreferences } from '@/features/account/RecognitionPreferences';
import { AccountSection } from '@/features/account/AccountSection';
import { useAuth } from '@/hooks/useAuth';
import { toNaturalCase } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { accountCopy } from './account-translations';
import { teamCopy } from '@/features/team/translations';
import { bindSoundInteractions } from '@/lib/sound';
import './AccountPage.css';

type AccountPanel = 'profile' | 'settings' | 'recognition' | 'administration' | 'team';
type AccountPageProps =
  | { modal: true; onClose: () => void; tourStepIndex?: number | null }
  | { modal?: false; onClose?: never; tourStepIndex?: never };

export function AccountPage({ modal = false, onClose, tourStepIndex }: AccountPageProps) {
  const settingsId = useId();
  const passwordId = useId();
  const administrationId = useId();
  const [passwordActionsTarget, setPasswordActionsTarget] = useState<HTMLDivElement | null>(null);
  const [settingsView, setSettingsView] = useState<AccountSettingsView>('settings');
  const [activePanel, setActivePanel] = useState<AccountPanel>('profile');
  const { profile, user, username, profileLoading, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = accountCopy(language);
  const profileId = profile?.id;

  useEffect(() => {
    if (profileId) return bindSoundInteractions(document);
  }, [profileId]);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, { preserveAcronyms: false });
  const settingsTitle = settingsView === 'password' ? copy.password : copy.settings;
  const settingsSection = (
    <AccountSection
      id={settingsId}
      title={settingsTitle}
      className="account-settings"
      action={<div ref={setPasswordActionsTarget} className="account-password__header-actions" />}
    >
      <AccountPasswordSection
        copy={copy}
        actionsTarget={passwordActionsTarget}
        view={settingsView}
        onViewChange={setSettingsView}
      />
    </AccountSection>
  );

  const modalSettingsSection = (
    <AccountSection id={settingsId} title={copy.settings} className="account-settings" headingLevel={3}>
      <AccountPreferencesSection copy={copy} />
    </AccountSection>
  );
  const modalPasswordSection = (
    <AccountSection id={passwordId} title={copy.password} className="account-dialog__password" headingLevel={3}>
      <PasswordChangeForm actionsTarget={null} inlineActions submitLabel={copy.changePassword} />
    </AccountSection>
  );

  const profileSection = (
    <AccountProfile copy={copy} displayName={displayName} email={user?.email} headingLevel={modal ? 3 : 2} />
  );
  const administrationSection = profile.role === 'admin' && (
    <AccountSection
      id={administrationId}
      title={copy.administration}
      className="account-admin"
      headingLevel={modal ? 3 : 2}
    >
      <MaintenanceControl copy={copy} english={language === 'en'} sessionLoading={authLoading || profileLoading} />
    </AccountSection>
  );
  const recognitionSection = profile.role === 'reclutador' && (
    <RecognitionPreferences copy={copy} profileId={profile.id} headingLevel={modal ? 3 : 2} />
  );
  const teamSection = profile.role === 'admin' && <TeamManagement headingLevel={modal ? 3 : 2} />;
  const visiblePanel =
    tourStepIndex === 3
      ? 'settings'
      : tourStepIndex === 4 && profile.role === 'reclutador'
        ? 'recognition'
        : activePanel;

  if (modal && onClose) {
    const panels: { id: AccountPanel; label: string; content: React.ReactNode }[] = [
      {
        id: 'profile',
        label: copy.title,
        content: (
          <>
            {profileSection}
            {modalPasswordSection}
          </>
        ),
      },
      { id: 'settings', label: copy.settings, content: modalSettingsSection },
      ...(profile.role === 'reclutador'
        ? [{ id: 'recognition' as const, label: copy.recognition, content: recognitionSection }]
        : []),
      ...(profile.role === 'admin'
        ? [
            { id: 'administration' as const, label: copy.administration, content: administrationSection },
            { id: 'team' as const, label: teamCopy(language).title, content: teamSection },
          ]
        : []),
    ];
    return (
      <Modal
        isOpen
        title={copy.title}
        onClose={onClose}
        size="xl"
        presentation="modal"
        className="account-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() =>
            document.querySelector<HTMLButtonElement>('[data-tour="account-trigger"]')?.focus(),
          );
        }}
      >
        <div className="account-dialog__layout">
          <nav className="account-dialog__nav" aria-label={copy.title}>
            {panels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className="account-dialog__nav-item"
                aria-current={visiblePanel === panel.id ? 'true' : undefined}
                aria-controls={`${settingsId}-${panel.id}`}
                onClick={() => setActivePanel(panel.id)}
              >
                {panel.label}
              </button>
            ))}
          </nav>
          <div className="account-dialog__content">
            {panels.map((panel) => (
              <div
                key={panel.id}
                id={`${settingsId}-${panel.id}`}
                hidden={visiblePanel !== panel.id}
                className="account-dialog__panel"
              >
                {panel.content}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <main className="account-page container" aria-labelledby="account-page-title">
      <PageHeading id="account-page-title" className="app-page-title">
        {copy.title}
      </PageHeading>
      <div className="account-page__layout">
        <div className="account-page__aside">
          {profileSection}
          {administrationSection}
          {profile.role === 'reclutador' && settingsSection}
          {recognitionSection}
        </div>
        <div className="account-page__stack">{profile.role === 'admin' && settingsSection}</div>
        {teamSection}
      </div>
    </main>
  );
}
