import { useState } from "react";
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
import "./AccountPage.css";

type AccountDialog = "avatar" | "password" | "recognition" | "maintenance" | null;

export function AccountPage() {
  const { profile, user, username } = useAuth();
  const maintenance = useMaintenanceMode();
  const [dialog, setDialog] = useState<AccountDialog>(null);

  if (!profile) return null;

  const displayName = toNaturalCase(profile.display_name || username, {
    preserveAcronyms: false,
  });
  const isAdmin = profile.role === "admin";
  const isRecruiter = profile.role === "reclutador";
  const maintenanceLabel = maintenance.loading
    ? "Consultando…"
    : maintenance.error
      ? "No disponible"
      : maintenance.enabled
        ? "Activo"
        : "Inactivo";

  const closeDialog = () => setDialog(null);

  return (
    <main className="account-page container container--compact" aria-labelledby="account-profile-title">
      <div className="account-page__content">
        <section className="account-page__section account-page__section--profile" aria-labelledby="account-profile-title">
          <h1 id="account-profile-title" className="app-page-title">Mi cuenta</h1>
          <button
            type="button"
            className="account-page__identity"
            aria-label={`Cambiar foto de perfil de ${displayName}`}
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
              aria-label="Cambiar contraseña"
              aria-describedby="account-password-description"
              onClick={() => setDialog("password")}
            >
              <span className="account-page__row-copy">
                <span className="account-page__row-title">Contraseña</span>
                <span id="account-password-description" className="account-page__row-description">Actualiza la contraseña de acceso a tu cuenta.</span>
              </span>
            </button>

            {isRecruiter && (
              <button
                type="button"
                className="account-page__row"
                aria-label="Configurar reconocimientos"
                aria-describedby="account-recognition-description"
                onClick={() => setDialog("recognition")}
              >
                <span className="account-page__row-copy">
                  <span className="account-page__row-title">Reconocimientos</span>
                  <span id="account-recognition-description" className="account-page__row-description">Configura cuándo quieres ver tus avances y logros.</span>
                </span>
              </button>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="account-page__section" aria-labelledby="account-admin-title">
            <h2 id="account-admin-title" className="account-page__section-title">Administración</h2>
            <div className="account-page__panel">
              <button
                type="button"
                className="account-page__row account-page__row--status"
                aria-label="Administrar modo mantenimiento"
                aria-describedby="account-maintenance-description account-maintenance-status"
                onClick={() => setDialog("maintenance")}
                disabled={maintenance.loading}
              >
                <span className="account-page__row-title">Modo mantenimiento</span>
                <Badge id="account-maintenance-status" className="account-page__status" variant={maintenance.enabled ? "amber" : "default"} aria-live="polite">
                  {maintenanceLabel}
                </Badge>
                <span id="account-maintenance-description" className="account-page__row-description">Controla el acceso general al sistema.</span>
              </button>
            </div>
            <div className="account-page__activity">
              <h3>Actividad de usuarios</h3>
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
