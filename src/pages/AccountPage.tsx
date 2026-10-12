import { useState } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { TEAM_PATH } from '@/components/layout/navigation';
import { Avatar } from "@/components/ui/Avatar";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { Badge } from "@/components/ui/Badge";
import { RecognitionPreferencesModal } from "@/components/ui/RecognitionPreferencesModal";
import { ChangePasswordModal } from "@/features/account/ChangePasswordModal";
import { UserActivityPanel } from "@/features/system/UserActivityPanel";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { toast } from "@/lib/notify";
import { toNaturalCase } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { accountCopy } from "./account-translations";
import "./AccountPage.css";

function translateMaintenanceError(message: string, english: boolean) {
  if (!english) return message;
  const messages: Readonly<Record<string, string>> = {
    "No existe la configuración principal de mantenimiento.": "The main maintenance configuration does not exist.",
    "No fue posible consultar el modo mantenimiento. Intenta de nuevo.": "Could not check maintenance mode. Try again.",
    "Supabase no confirmó el cambio de mantenimiento.": "Supabase did not confirm the maintenance mode change.",
    "No fue posible cambiar el modo mantenimiento. Intenta de nuevo.": "Could not change maintenance mode. Try again.",
    "No fue posible escuchar cambios de mantenimiento en tiempo real.": "Could not listen for real-time maintenance changes.",
  };
  return messages[message] ?? message;
}
type AccountDialog = "avatar" | "password" | "recognition" | null;

export function AccountPage() {
  const { profile, user, username, profileLoading, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = accountCopy(language);
  const maintenance = useMaintenanceMode();
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [pendingMaintenance, setPendingMaintenance] = useState<boolean | null>(null);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const maintenanceUnavailable = authLoading || profileLoading || maintenance.loading || Boolean(maintenance.error);

  const handleMaintenanceAction = async () => {
    if (profile?.role !== "admin" || maintenanceUnavailable || savingMaintenance) return;
    if (pendingMaintenance === null) {
      setPendingMaintenance(!maintenance.enabled);
      return;
    }
    if (pendingMaintenance === maintenance.enabled) {
      setPendingMaintenance(null);
      return;
    }

    setSavingMaintenance(true);
    try {
      const result = await maintenance.update(pendingMaintenance);
      if (result.ok) {
        toast.success({
          title: language === "en"
            ? pendingMaintenance ? "Maintenance mode enabled" : "Maintenance mode disabled"
            : pendingMaintenance ? "Mantenimiento activado" : "Mantenimiento desactivado",
        });
      }
      setPendingMaintenance(null);
    } finally {
      setSavingMaintenance(false);
    }
  };

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
              <div className="account-page__row account-page__row--status account-page__row--maintenance">
                <span className="account-page__row-title">{copy.maintenance}</span>
                <span id="account-maintenance-description" className="account-page__row-description">{copy.maintenanceDescription}</span>
                <div className="account-page__maintenance-controls">
                  <Badge id="account-maintenance-status" className="account-page__status" aria-live="polite">
                    {maintenanceLabel}
                  </Badge>
                  <button
                    type="button"
                    className="account-page__maintenance-action"
                    data-confirming={pendingMaintenance !== null}
                    onClick={() => void handleMaintenanceAction()}
                    onBlur={() => {
                      if (!savingMaintenance) setPendingMaintenance(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setPendingMaintenance(null);
                    }}
                    disabled={maintenanceUnavailable || savingMaintenance}
                    aria-busy={savingMaintenance}
                    aria-describedby="account-maintenance-description account-maintenance-status"
                  >
                    <span className="account-page__maintenance-action-surface">
                      {savingMaintenance
                        ? copy.saving
                        : pendingMaintenance !== null
                          ? copy.confirmMaintenance
                          : maintenance.enabled ? copy.disableMaintenance : copy.enableMaintenance}
                    </span>
                  </button>
                  {maintenance.error && (
                    <button
                      type="button"
                      className="account-page__maintenance-action"
                      onClick={() => void maintenance.refresh()}
                      disabled={maintenance.loading || savingMaintenance}
                    >
                      <span className="account-page__maintenance-action-surface">{copy.retry}</span>
                    </button>
                  )}
                </div>
                {maintenance.error && (
                  <p className="account-page__maintenance-error" role="alert">
                    {translateMaintenanceError(maintenance.error, language === "en")}
                  </p>
                )}
              </div>
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

    </main>
  );
}
