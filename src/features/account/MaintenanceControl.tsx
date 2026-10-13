import { useId, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useInlineConfirm } from '@/hooks/useInlineConfirm';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { toast } from '@/lib/notify';
import type { AccountCopy } from '@/pages/account-translations';

const MAINTENANCE_ERRORS_EN: Readonly<Record<string, string>> = {
  'No existe la configuración principal de mantenimiento.': 'The main maintenance configuration does not exist.',
  'No fue posible consultar el modo mantenimiento. Intenta de nuevo.': 'Could not check maintenance mode. Try again.',
  'Supabase no confirmó el cambio de mantenimiento.': 'Supabase did not confirm the maintenance mode change.',
  'No fue posible cambiar el modo mantenimiento. Intenta de nuevo.': 'Could not change maintenance mode. Try again.',
  'No fue posible escuchar cambios de mantenimiento en tiempo real.': 'Could not listen for real-time maintenance changes.',
};

interface MaintenanceControlProps {
  copy: AccountCopy;
  english: boolean;
  /** La sesión o el perfil siguen cargando. */
  sessionLoading: boolean;
}

/** Estado y cambio del modo mantenimiento con confirmación en línea. */
export function MaintenanceControl({ copy, english, sessionLoading }: MaintenanceControlProps) {
  const id = useId();
  const maintenance = useMaintenanceMode();
  const confirm = useInlineConfirm<boolean>();
  const [saving, setSaving] = useState(false);
  const unavailable = sessionLoading || maintenance.loading || Boolean(maintenance.error);
  const statusLabel = maintenance.loading
    ? copy.checking
    : maintenance.error
      ? copy.unavailable
      : maintenance.enabled ? copy.active : copy.inactive;

  async function handleAction() {
    if (unavailable || saving) return;
    const target = confirm.pending;
    if (target === null) {
      confirm.request(!maintenance.enabled);
      return;
    }
    if (target === maintenance.enabled) {
      confirm.cancel();
      return;
    }
    setSaving(true);
    try {
      const result = await maintenance.update(target);
      if (result.ok) toast.success({ title: target ? copy.maintenanceEnabled : copy.maintenanceDisabled });
      confirm.cancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="account-row account-maintenance" aria-busy={saving || maintenance.loading}>
      <div className="account-row__copy">
        <h3 className="account-row__title">{copy.maintenance}</h3>
        <p id={`${id}-description`} className="account-row__description">{copy.maintenanceDescription}</p>
      </div>
      <div className="account-maintenance__controls">
        <Badge id={`${id}-status`} className="account-maintenance__status" data-enabled={maintenance.enabled || undefined}
          aria-live="polite">
          {statusLabel}
        </Badge>
        <button
          type="button"
          className="account-maintenance__action"
          data-confirming={confirm.confirming || undefined}
          onClick={() => void handleAction()}
          {...(saving ? {} : confirm.triggerProps)}
          disabled={unavailable || saving}
          aria-busy={saving}
          aria-describedby={`${id}-description ${id}-status`}
        >
          <span className="account-maintenance__action-surface">
            {saving
              ? copy.saving
              : confirm.confirming
                ? copy.confirmMaintenance
                : maintenance.enabled ? copy.disableMaintenance : copy.enableMaintenance}
          </span>
        </button>
        {maintenance.error && (
          <button type="button" className="account-maintenance__action"
            onClick={() => void maintenance.refresh()} disabled={maintenance.loading || saving}>
            <span className="account-maintenance__action-surface">{copy.retry}</span>
          </button>
        )}
      </div>
      {maintenance.error && (
        <p className="account-maintenance__error" role="alert">
          {english ? MAINTENANCE_ERRORS_EN[maintenance.error] ?? maintenance.error : maintenance.error}
        </p>
      )}
    </div>
  );
}
