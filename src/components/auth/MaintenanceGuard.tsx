import { type ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { LogOut, ShieldCheck } from 'lucide-react';
import './MaintenanceGuard.css';
import { useOfflineAccess } from '@/features/data-update/offline/hooks';

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { profile, profileLoading, loading: authLoading, signOut, user } = useAuth();
  const offline = useOfflineAccess(user?.id);
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    error: maintenanceError,
    hasConfirmedState,
    refresh: refreshMaintenance,
  } = useMaintenanceMode();
  const isAdmin = profile?.role === 'admin';
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const handleCheck = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setHasChecked(false);
    try {
      await refreshMaintenance({ silent: true });
      setHasChecked(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (offline.account) return <>{children}</>;

  if (authLoading || maintenanceLoading || ((!hasConfirmedState || isMaintenance) && profileLoading)) {
    return null;
  }

  if ((hasConfirmedState && !isMaintenance) || isAdmin) {
    return <>{children}</>;
  }

  return (
    <main className="maintenance-overlay" aria-labelledby="maintenance-title">
      <section className="maintenance-card">
        <div className="maintenance-icon-wrap" aria-hidden="true">
          <ShieldCheck className="maintenance-icon" />
        </div>

        <div className="maintenance-content">
          <h1 id="maintenance-title" className="maintenance-title type-heading-lg">
            {hasConfirmedState ? 'Sistema en mantenimiento' : 'No se pudo verificar el acceso'}
          </h1>
          <p className="type-body-md maintenance-text">
            Puedes comprobar si ya está disponible.
          </p>
        </div>

        <div className="maintenance-actions">
          <button
            onClick={handleCheck}
            className="btn-primary maintenance-button"
            type="button"
            disabled={isChecking}
            aria-busy={isChecking}
            aria-describedby="maintenance-status"
          >
            {isChecking ? 'Comprobando…' : 'Comprobar disponibilidad'}
          </button>
          <button
            onClick={signOut}
            className="btn-secondary maintenance-button"
            type="button"
            disabled={isChecking}
          >
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
        <p id="maintenance-status" className="type-body-sm maintenance-text" role="status" aria-atomic="true">
          {isChecking
            ? 'Comprobando disponibilidad…'
            : maintenanceError
              ? 'No se pudo consultar el estado. Intenta de nuevo.'
              : hasChecked && isMaintenance
                ? 'El mantenimiento continúa activo.'
                : ''}
        </p>
      </section>
    </main>
  );
}
