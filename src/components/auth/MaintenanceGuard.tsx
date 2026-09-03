import { type ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import './MaintenanceGuard.css';

const MINIMUM_CHECK_DURATION_MS = 900;
const RESULT_VISIBILITY_DURATION_MS = 2000;

export function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { profile, profileLoading, loading: authLoading, signOut } = useAuth();
  const {
    enabled: isMaintenance,
    loading: maintenanceLoading,
    refresh: refreshMaintenance,
  } = useMaintenanceMode();
  const isAdmin = profile?.role === 'admin';
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'idle' | 'unavailable'>('idle');

  const handleCheck = async () => {
    setIsChecking(true);
    setCheckResult('idle');
    await Promise.all([
      refreshMaintenance({ silent: true }),
      new Promise(resolve => setTimeout(resolve, MINIMUM_CHECK_DURATION_MS)),
    ]);
    setIsChecking(false);
    // Si el componente sigue montado, el mantenimiento continúa activo
    setCheckResult('unavailable');
    setTimeout(() => setCheckResult('idle'), RESULT_VISIBILITY_DURATION_MS);
  };

  if (authLoading || maintenanceLoading || (isMaintenance && profileLoading)) {
    return null;
  }

  if (!isMaintenance || isAdmin) {
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
            Volvemos en breve
          </h1>
          <p className="type-body-md maintenance-text">
            Sistema en mantenimiento. Regresamos pronto.
          </p>
        </div>

        <div className="maintenance-actions">
          <button
            onClick={handleCheck}
            className="btn-primary maintenance-button"
            type="button"
            disabled={isChecking || checkResult === 'unavailable'}
          >
            {isChecking ? (
              <span className="maintenance-dots" aria-label="Comprobando">
                <span className="maintenance-dot" />
                <span className="maintenance-dot" />
                <span className="maintenance-dot" />
                <span className="maintenance-dots__label">Comprobando</span>
              </span>
            ) : checkResult === 'unavailable' ? (
              <>
                <X size="var(--icon-size-sm)" aria-hidden="true" />
                Aún no disponible
              </>
            ) : (
              'Comprobar disponibilidad'
            )}
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
      </section>
    </main>
  );
}
