import { useId, useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';
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

/** Estado y cambio del modo mantenimiento desde un select. */
export function MaintenanceControl({ copy, english, sessionLoading }: MaintenanceControlProps) {
  const id = useId();
  const maintenance = useMaintenanceMode();
  const [saving, setSaving] = useState(false);
  const unavailable = sessionLoading || maintenance.loading || Boolean(maintenance.error);
  const statusLabel = saving
    ? copy.saving
    : maintenance.loading
      ? copy.checking
      : maintenance.error
        ? copy.unavailable
        : maintenance.enabled ? copy.active : copy.inactive;

  async function handleAction(target: boolean) {
    if (unavailable || saving || target === maintenance.enabled) return;
    setSaving(true);
    try {
      const result = await maintenance.update(target);
      if (result.ok) {
        playSound('toggle');
        toast.success({ title: target ? copy.maintenanceEnabled : copy.maintenanceDisabled });
      } else {
        playSound('error');
      }
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
        <span id={`${id}-status`} className="sr-only" aria-live="polite">{statusLabel}</span>
        <CustomSelect
          id={id}
          className="account-maintenance__select"
          aria-label={copy.maintenance}
          aria-describedby={`${id}-description ${id}-status`}
          value={maintenance.enabled ? "active" : "inactive"}
          options={[
            { value: "inactive", label: copy.inactive },
            { value: "active", label: copy.active },
          ]}
          showPlaceholderOption={false}
          disabled={unavailable || saving}
          onChange={(value) => void handleAction(value === "active")}
        />
        {maintenance.error && (
          <button type="button" className="account-maintenance__retry"
            onClick={() => { playSound('tap'); void maintenance.refresh(); }} disabled={maintenance.loading || saving}>
            {copy.retry}
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
