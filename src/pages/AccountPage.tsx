import { useState } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { TEAM_PATH } from '@/components/layout/navigation';
import { Avatar } from "@/components/ui/Avatar";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { Badge } from "@/components/ui/Badge";
import { RecognitionPreferencesModal } from "@/components/ui/RecognitionPreferencesModal";
import { ChangePasswordModal } from "@/features/account/ChangePasswordModal";
import { MaintenanceModeModal } from "@/features/system/MaintenanceModeModal";
import { UserActivityPanel } from "@/features/system/UserActivityPanel";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { toNaturalCase } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { accountCopy } from "./account-translations";
import "./AccountPage.css";

type AccountDialog = "avatar" | "password" | "recognition" | "maintenance" | null;

export function AccountPage() {
  const { profile, user, username } = useAuth();
  const { language } = useLanguage();
  const copy = accountCopy(language);
  const maintenance = useMaintenanceMode();
  const [dialog, setDialog] = useState<AccountDialog>(null);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const isAdmin = profile.role === "admin";
  const isRecruiter = profile.role === "reclutador";
  const maintenanceLabel = maintenance.loading
    ? copy.checking
    : maintenance.error
      ? copy.unavailable
      : maintenance.enabled
        ? copy.active
        : copy.inactive;

  const closeDialog = () => setDialog(null);

  return (
    <main className="account-page container container--compact" aria-labelledby="account-profile-title">
      <div className="account-page__content">
        <section className="account-page__section account-page__section--profile" aria-labelledby="account-profile-title">
          <PageHeading id="account-profile-title" className="app-page-title">{copy.title}</PageHeading>
          <button
            type="button"
            className="account-page__identity"
            aria-label={copy.changeAvatar(displayName)}
            aria-describedby={user?.email ? "account-profile-email" : undefined}
            onClick={() => setDialog("avatar")}
          >
            <span className="account-page__avatar">
              <Avatar name={displayName} src={profile.avatar_url} />
            </span>
            <span className="account-page__identity-copy">
              <strong className="account-page__name">{displayName}</strong>
              {user?.email && <span id="account-profile-email" className="account-page__email">{user.email}</span>}
            </span>
          </button>

          <div className="account-page__panel">
            <button
              type="button"
              className="account-page__row"
              aria-label={copy.changePassword}
              aria-describedby="account-password-description"
              onClick={() => setDialog("password")}
            >
              <span className="account-page__row-copy">
                <span className="account-page__row-title">{copy.password}</span>
                <span id="account-password-description" className="account-page__row-description">{copy.passwordDescription}</span>
              </span>
            </button>

            {isRecruiter && (
              <button
                type="button"
                className="account-page__row"
                aria-label={copy.recognition}
                aria-describedby="account-recognition-description"
                onClick={() => setDialog("recognition")}
              >
                <span className="account-page__row-copy">
                  <span className="account-page__row-title">{copy.recognition}</span>
                  <span id="account-recognition-description" className="account-page__row-description">{copy.recognitionDescription}</span>
                </span>
              </button>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="account-page__section" aria-labelledby="account-admin-title">
            <h2 id="account-admin-title" className="account-page__section-title">{copy.administration}</h2>
            <div className="account-page__panel">
              <Link to={TEAM_PATH} className="account-page__row account-page__row-link">
                <span className="account-page__row-copy">
                  <span className="account-page__row-title">{copy.team}</span>
                  <span className="account-page__row-description">{copy.teamDescription}</span>
                </span>
              </Link>
              <button
                type="button"
                className="account-page__row account-page__row--status"
                aria-label={copy.maintenance}
                aria-describedby="account-maintenance-description account-maintenance-status"
                onClick={() => setDialog("maintenance")}
                disabled={maintenance.loading}
              >
                <span className="account-page__row-title">{copy.maintenance}</span>
                <Badge id="account-maintenance-status" className="account-page__status" aria-live="polite">
                  {maintenanceLabel}
                </Badge>
                <span id="account-maintenance-description" className="account-page__row-description">{copy.maintenanceDescription}</span>
              </button>
            </div>
            <div className="account-page__activity">
              <h3>{copy.userActivity}</h3>
              <UserActivityPanel />
            </div>
          </section>
        )}
      </div>

      <AvatarUploadModal isOpen={dialog === "avatar"} onClose={closeDialog} />
      <ChangePasswordModal isOpen={dialog === "password"} onClose={closeDialog} />
      {dialog === "recognition" && (
        <RecognitionPreferencesModal isOpen onClose={closeDialog} />
      )}
      {dialog === "maintenance" && (
        <MaintenanceModeModal isOpen onClose={closeDialog} />
      )}
    </main>
  );
}
