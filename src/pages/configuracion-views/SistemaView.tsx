import { useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { sileo } from '@/lib/notify';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActiveSessions } from './components/ActiveSessions';
import './SistemaView.css';

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

  const isAdmin = profile?.role === 'admin';
  const loading = authLoading || profileLoading || maintenanceLoading;
  const configurationUnavailable = Boolean(maintenanceError) && !maintenanceLoading;

  const confirmMaintenanceChange = async () => {
    setSaving(true);
    const nextValue = !isMaintenance;
    const result = await updateMaintenance(nextValue);
    setSaving(false);

    if (!result.ok) {
      sileo.error({ title: result.message });
      return;
    }

    setShowConfirmation(false);
    sileo.success({
      title: nextValue ? 'Mantenimiento activado' : 'Mantenimiento desactivado',
    });
  };

  if (authLoading || profileLoading) {
    return (
      <section className="config-page__content" aria-busy="true">
        <header className="config-page__header">
          <Skeleton variant="text" width="var(--skeleton-title-width)" height="var(--type-heading-lg-size)" />
        </header>
        <Skeleton variant="rect" width="100%" height="var(--skeleton-card-height)" radius="var(--rounded-lg)" />
        <span className="sr-only" role="status">Cargando configuración del sistema…</span>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="config-page__content" aria-labelledby="sistema-title">
        <header className="config-page__header">
          <h2 id="sistema-title" className="config-page__title">Sistema</h2>
        </header>
        <div className="sistema-permission-state" role="status">
          <ShieldAlert aria-hidden="true" />
          <p className="type-body-md text-muted">Esta sección está disponible solo para administradores.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="config-page__content" aria-labelledby="sistema-title">
      <header className="config-page__header">
        <h2 id="sistema-title" className="config-page__title">Sistema</h2>
      </header>

      <div className="sistema-grid">
        <section className="sistema-view-section" aria-labelledby="maintenance-title">
          <header className="sistema-section-header">
            <div className="sistema-icon-wrap" aria-hidden="true">
              <ShieldAlert className="sistema-icon" />
            </div>
            <div>
              <h3 id="maintenance-title" className="type-heading-sm">Modo mantenimiento</h3>
              <span className={`sistema-status${isMaintenance ? ' is-active' : ''}`}>
                <span className="sistema-status__dot" aria-hidden="true" />
                {isMaintenance ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </header>

          <div className="sistema-content">
            <p className="type-body-sm text-muted">
              Al activarlo, los administradores conservan acceso y el resto de usuarios verá la página de mantenimiento.
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
              className={`type-button ${isMaintenance ? 'btn-secondary' : 'btn-primary'} sistema-maintenance-action`}
            >
              {configurationUnavailable
                ? 'Configuración no disponible'
                : loading
                  ? 'Consultando estado…'
                  : isMaintenance
                    ? 'Desactivar mantenimiento'
                    : 'Activar mantenimiento'}
            </button>
          </div>
        </section>

        <ActiveSessions />
      </div>

      <Modal
        isOpen={showConfirmation}
        title={isMaintenance ? 'Desactivar mantenimiento' : 'Activar mantenimiento'}
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
              className={isMaintenance ? 'btn-secondary' : 'btn-primary'}
              onClick={confirmMaintenanceChange}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="modal-body sistema-confirmation-copy">
          <Activity aria-hidden="true" />
          <p className="type-body-md text-charcoal">
            {isMaintenance
              ? 'El acceso normal se restaurará para todos los usuarios conectados.'
              : 'Los usuarios no administradores pasarán inmediatamente a la página de mantenimiento.'}
          </p>
        </div>
      </Modal>
    </section>
  );
}
