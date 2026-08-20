import { useState } from "react";
import { Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { toast } from "@/lib/notify";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActiveSessions } from "./components/ActiveSessions";
import "./SistemaView.css";

export function SistemaView() {
  const { profile, profileLoading, loading: authLoading } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    error: maintenanceError,
    refresh: refreshMaintenance,
    update: updateMaintenance,
  } = useMaintenanceMode();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === "admin";
  const loading = authLoading || profileLoading || maintenanceLoading;
  const configurationUnavailable =
    Boolean(maintenanceError) && !maintenanceLoading;

  const confirmMaintenanceChange = async () => {
    setSaving(true);
    const nextValue = !isMaintenance;
    const result = await updateMaintenance(nextValue);
    setSaving(false);

    if (!result.ok) {
      toast.error({ title: result.message });
      return;
    }

    setShowConfirmation(false);
    toast.success({
      title: nextValue ? "Mantenimiento activado" : "Mantenimiento desactivado",
    });
  };

  if (authLoading || profileLoading) {
    return (
      <section className="config-page" aria-busy="true">
        <Skeleton
          variant="rect"
          width="100%"
          height="var(--skeleton-card-height)"
          radius="var(--rounded-lg)"
        />
        <span className="sr-only" role="status">
          Cargando configuración del sistema…
        </span>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="config-page">
        <div className="sistema-permission-state" role="status">
          <ShieldAlert aria-hidden="true" />
          <p className="type-body-md text-muted">
            Esta sección está disponible solo para administradores.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="config-page">
      <div className="sistema-grid">
        <section
          className="sistema-view-section"
          aria-labelledby="maintenance-title"
        >
          <header className="sistema-section-header">
            <div className="sistema-icon-wrap" aria-hidden="true">
              <ShieldAlert className="sistema-icon" />
            </div>
            <div>
              <h3 id="maintenance-title" className="type-heading-sm">
                Modo mantenimiento
              </h3>
              <span
                className={`sistema-status${isMaintenance ? " is-active" : ""}`}
              >
                <span className="sistema-status__dot" aria-hidden="true" />
                {isMaintenance ? "Activo" : "Inactivo"}
              </span>
            </div>
          </header>

          <div className="sistema-content">
            <p className="type-body-sm text-muted">
              Solo los administradores tendrán acceso al sistema.
            </p>

            {maintenanceError && (
              <div className="sistema-error-group">
                <p className="sistema-error type-body-sm" role="alert">
                  {maintenanceError}
                </p>
                <button
                  type="button"
                  className="btn-secondary sistema-retry-action"
                  onClick={() => void refreshMaintenance()}
                  disabled={maintenanceLoading}
                >
                  Reintentar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              disabled={loading || configurationUnavailable}
              className={`type-button ${isMaintenance ? "btn-secondary" : "btn-primary"} sistema-maintenance-action`}
            >
              {configurationUnavailable
                ? "Configuración no disponible"
                : loading
                  ? "Consultando estado…"
                  : isMaintenance
                    ? "Desactivar"
                    : "Activar"}
            </button>
          </div>
        </section>

        <ActiveSessions />
      </div>

      <Modal
        isOpen={showConfirmation}
        title={isMaintenance ? "Desactivar" : "Activar"}
        onClose={() => !saving && setShowConfirmation(false)}
        fullscreenMobile={false}
        className="sistema-confirmation-modal"
        footerActions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={isMaintenance ? "btn-secondary" : "btn-primary"}
              onClick={confirmMaintenanceChange}
              disabled={saving}
            >
              {saving ? "Guardando…" : "Confirmar"}
            </button>
          </>
        }
      >
        <div className="modal-body sistema-confirmation-copy">
          <Activity aria-hidden="true" />
          <p className="type-body-md text-charcoal">
            {isMaintenance
              ? "Se restaurará el acceso normal."
              : "Se activará el modo mantenimiento."}
          </p>
        </div>
      </Modal>
    </section>
  );
}
