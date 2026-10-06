import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";
import "./SystemModals.css";

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

interface MaintenanceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaintenanceModeModal({
  isOpen,
  onClose,
}: MaintenanceModeModalProps) {
  const { language } = useLanguage();
  const english = language === "en";
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
      toast.error({ title: translateMaintenanceError(result.message, english) });
      return;
    }

    toast.success({
      title: english
        ? nextValue ? "Maintenance mode enabled" : "Maintenance mode disabled"
        : nextValue ? "Mantenimiento activado" : "Mantenimiento desactivado",
    });
    onClose();
  };

  if (!isAdmin) return null;

  return (
    <Modal
      isOpen={isOpen}
      title={english ? "Maintenance mode" : "Modo mantenimiento"}
      onClose={handleClose}
      closeLabel={english ? "Close" : "Cerrar"}
      size="xs"
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={saving}
          >
            {english ? "Cancel" : "Cancelar"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleConfirm()}
            disabled={saving || loading || configurationUnavailable}
            aria-busy={saving}
          >
            {saving
              ? english ? "Saving…" : "Guardando…"
              : configurationUnavailable
                ? english ? "Unavailable" : "No disponible"
                : loading
                  ? english ? "Checking…" : "Consultando…"
                  : isMaintenance
                    ? english ? "Disable" : "Desactivar"
                    : english ? "Enable" : "Activar"}
          </button>
        </>
      }
    >
      <div className="modal-body maintenance-mode-modal__body">
        <div className="maintenance-mode-modal__status">
          <span className="type-label-sm">{english ? "Current status" : "Estado actual"}</span>
          <Badge variant={isMaintenance ? "amber" : "default"} aria-live="polite">
            {loading
              ? english ? "Checking…" : "Consultando…"
              : configurationUnavailable
                ? english ? "Unavailable" : "No disponible"
                : isMaintenance
                  ? english ? "Active" : "Activo"
                  : english ? "Inactive" : "Inactivo"}
          </Badge>
        </div>

        <p className="maintenance-mode-modal__copy type-body-md text-muted">
          {isMaintenance
            ? english ? "Normal system access will be restored." : "Se restaurará el acceso normal al sistema."
            : english ? "Access is limited to administrators." : "Acceso solo para administradores."}
        </p>

        {maintenanceError && (
          <div className="maintenance-mode-modal__error-group">
            <p className="maintenance-mode-modal__error type-body-sm" role="alert">
              {translateMaintenanceError(maintenanceError, english)}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void refreshMaintenance()}
              disabled={maintenanceLoading || saving}
            >
              {english ? "Retry" : "Reintentar"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
