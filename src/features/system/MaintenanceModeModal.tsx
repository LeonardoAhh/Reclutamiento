import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/notify";
import "./SystemModals.css";

interface MaintenanceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaintenanceModeModal({
  isOpen,
  onClose,
}: MaintenanceModeModalProps) {
  const { profile, profileLoading, loading: authLoading } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    error: maintenanceError,
    refresh: refreshMaintenance,
    update: updateMaintenance,
  } = useMaintenanceMode();
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === "admin";
  const loading = authLoading || profileLoading || maintenanceLoading;
  const configurationUnavailable = Boolean(maintenanceError) && !maintenanceLoading;

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleConfirm = async () => {
    if (!isAdmin || saving || loading || configurationUnavailable) return;

    setSaving(true);
    const nextValue = !isMaintenance;
    const result = await updateMaintenance(nextValue);
    setSaving(false);

    if (!result.ok) {
      toast.error({ title: result.message });
      return;
    }

    toast.success({
      title: nextValue ? "Mantenimiento activado" : "Mantenimiento desactivado",
    });
    onClose();
  };

  if (!isAdmin) return null;

  return (
    <Modal
      isOpen={isOpen}
      title="Modo mantenimiento"
      icon={<ShieldAlert aria-hidden="true" />}
      onClose={handleClose}
      size="xs"
      fullscreenMobile={false}
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={isMaintenance ? "btn-secondary" : "btn-primary"}
            onClick={() => void handleConfirm()}
            disabled={saving || loading || configurationUnavailable}
            aria-busy={saving}
          >
            {saving
              ? "Guardando…"
              : configurationUnavailable
                ? "No disponible"
                : loading
                  ? "Consultando…"
                  : isMaintenance
                    ? "Desactivar"
                    : "Activar"}
          </button>
        </>
      }
    >
      <div className="modal-body maintenance-mode-modal__body">
        <div className="maintenance-mode-modal__status">
          <span className="type-body-sm">Estado actual</span>
          <Badge variant={isMaintenance ? "amber" : "default"}>
            {loading ? "Consultando…" : isMaintenance ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <p className="maintenance-mode-modal__copy type-body-sm text-muted">
          {isMaintenance
            ? "Se restaurará el acceso normal al sistema."
            : "Solo para administradores."}
        </p>

        {maintenanceError && (
          <div className="maintenance-mode-modal__error-group">
            <p className="maintenance-mode-modal__error type-body-sm" role="alert">
              {maintenanceError}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void refreshMaintenance()}
              disabled={maintenanceLoading || saving}
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
