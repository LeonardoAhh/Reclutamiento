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
    <main className="account-page container container--compact" aria-labelledby="account-page-title">
      <header className="account-page__header">
        <h1 id="account-page-title" className="app-page-title">Cuenta</h1>
      </header>

      <div className="account-page__content">
        <section className="account-page__section" aria-labelledby="account-profile-title">
          <h2 id="account-profile-title" className="account-page__section-title">Mi cuenta</h2>
          <div className="account-page__identity">
            <div className="account-page__avatar">
              <Avatar name={displayName} src={profile.avatar_url} />
            </div>
            <div className="account-page__identity-copy">
              <strong className="account-page__name">{displayName}</strong>
              {user?.email && <span className="account-page__email">{user.email}</span>}
            </div>
            <button type="button" className="btn-secondary" onClick={() => setDialog("avatar")}>
              Cambiar foto
            </button>
          </div>

          <div className="account-page__panel">
            <div className="account-page__row">
              <div className="account-page__row-copy">
                <h3>Contraseña</h3>
                <p>Actualiza la contraseña de acceso a tu cuenta.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setDialog("password")}>
                Cambiar contraseña
              </button>
            </div>

            {isRecruiter && (
              <div className="account-page__row">
                <div className="account-page__row-copy">
                  <h3>Reconocimientos</h3>
                  <p>Configura cuándo quieres ver tus avances y logros.</p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setDialog("recognition")}>
                  Configurar
                </button>
              </div>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="account-page__section" aria-labelledby="account-admin-title">
            <h2 id="account-admin-title" className="account-page__section-title">Administración</h2>
            <div className="account-page__panel">
              <div className="account-page__row">
                <div className="account-page__row-copy">
                  <h3>Modo mantenimiento</h3>
                  <p>Controla el acceso general al sistema.</p>
                </div>
                <div className="account-page__row-actions">
                  <Badge className="account-page__status" variant={maintenance.enabled ? "amber" : "default"} aria-live="polite">
                    {maintenanceLabel}
                  </Badge>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDialog("maintenance")}
                    disabled={maintenance.loading}
                  >
                    Administrar
                  </button>
                </div>
              </div>
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
