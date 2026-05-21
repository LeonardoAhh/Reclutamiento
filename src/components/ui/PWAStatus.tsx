import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import './PWAStatus.css';

/**
 * Surfaces two PWA-level statuses to the user without interrupting them:
 *  - `need-refresh`: emitted by `pwa.ts` when a new service-worker is waiting.
 *    Shows a non-blocking toast with an "Actualizar" CTA. The user decides
 *    when to apply the update — we never reload mid-form.
 *  - `offline`: `navigator.onLine === false`. Shows a sticky banner so the
 *    user understands cached data may be stale.
 */
export function PWAStatus() {
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    function onNeedRefresh(e: Event) {
      const detail = (e as CustomEvent<{ update: () => void }>).detail;
      setUpdateFn(() => detail.update);
    }
    function onOnline() {
      setOffline(false);
    }
    function onOffline() {
      setOffline(true);
    }
    window.addEventListener('pwa:need-refresh', onNeedRefresh);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('pwa:need-refresh', onNeedRefresh);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <>
      {offline && (
        <div className="pwa-status pwa-status--offline" role="status">
          <WifiOff size={14} aria-hidden="true" />
          <span>Sin conexión — mostrando últimos datos en caché.</span>
        </div>
      )}
      {updateFn && (
        <div className="pwa-status pwa-status--update" role="status">
          <RefreshCw size={14} aria-hidden="true" />
          <span>Hay una nueva versión disponible.</span>
          <button
            type="button"
            className="btn-text pwa-status__action"
            onClick={() => updateFn()}
          >
            Actualizar
          </button>
          <button
            type="button"
            className="pwa-status__dismiss"
            onClick={() => setUpdateFn(null)}
            aria-label="Descartar"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
