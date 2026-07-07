import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, WifiOff, X, CheckCircle2 } from 'lucide-react';
import './PWAStatus.css';

type BannerState = 'idle' | 'available' | 'updating';

interface VersionData {
  version: string;
  fecha: string;
  nivel: string;
  titulo: string;
  mensaje: string;
  notificar: boolean;
}

/**
 * PWA status banners
 *
 * - `need-refresh`: new service-worker waiting → update banner (bottom card)
 *   with animated entrance, indeterminate progress and session-aware dismiss.
 * - `offline`: navigator.onLine === false → sticky top bar.
 *
 * Tokens consumed: --color-*, --spacing-*, --rounded-*, --type-*, --font-*,
 * --shadow-focus, --transition-fast, --tab-bar-height, --safe-area-*.
 * Zero hardcoded colours or sizes.
 */
export function PWAStatus() {
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const [bannerState, setBannerState] = useState<BannerState>('idle');
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    function onNeedRefresh(e: Event) {
      const detail = (e as CustomEvent<{ update: () => void }>).detail;
      setUpdateFn(() => detail.update);
      setBannerState('available');
      
      // Obtener la información de la nueva versión evadiendo el caché
      fetch(`/version.json?t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setVersionData(data);
        })
        .catch(console.error);
    }
    
    // Si queremos probar el banner en local, podemos simular la llamada 
    // y descomentar esto para ver el estado leyendo version.json:
    /*
    fetch(`/version.json?t=${Date.now()}`).then(res => res.json()).then(data => {
      setVersionData(data);
      setBannerState('available');
    });
    */

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

  const handleUpdate = useCallback(() => {
    if (!updateFn) {
      // Si no hay función real (ej. estamos probando UI), recargamos
      window.location.reload();
      return;
    }
    setBannerState('updating');
    updateFn();
  }, [updateFn]);

  const handleDismiss = useCallback(() => {
    setBannerState('idle');
    setUpdateFn(null);
  }, []);

  return (
    <>
      {/* ── Offline bar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {offline && (
          <motion.div
            className="pwa-offline"
            role="status"
            aria-live="assertive"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <WifiOff size={14} aria-hidden="true" className="pwa-offline__icon" />
            <span>Sin conexión — mostrando datos en caché</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Update card ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {bannerState !== 'idle' && (
          <motion.div
            className="pwa-update"
            role="alertdialog"
            aria-live="polite"
            initial={{ y: 72, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 72, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            {/* Icon badge */}
            <div className="pwa-update__icon-wrapper" aria-hidden="true">
              {bannerState === 'updating' ? (
                <RefreshCw size={22} className="pwa-update__icon--spin pwa-update__icon-success" />
              ) : (
                <CheckCircle2 size={22} className="pwa-update__icon-success" />
              )}
            </div>

            {/* Content */}
            <div className="pwa-update__body">
              <div className="pwa-update__header">
                <strong className="pwa-update__title">
                  {bannerState === 'updating'
                    ? 'Actualizando…'
                    : (versionData?.titulo || 'Nueva versión disponible')}
                </strong>
                <button
                  type="button"
                  className="pwa-update__btn-dismiss"
                  onClick={handleDismiss}
                  aria-label="Cerrar"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <span className="pwa-update__version">
                Actualización · v{versionData?.version || '1.0.0'}
              </span>
              
              <span className="pwa-update__desc">
                {bannerState === 'updating'
                  ? 'Aplicando cambios, un momento...'
                  : (versionData?.mensaje || 'Mejoras y correcciones listas para instalar')}
              </span>

              {/* Action Button */}
              {bannerState === 'available' && (
                <button
                  type="button"
                  className="pwa-update__btn-update"
                  onClick={handleUpdate}
                >
                  Actualizar app
                </button>
              )}
              
              {/* Indeterminate progress — visible only while updating */}
              {bannerState === 'updating' && (
                <div className="pwa-update__progress" aria-hidden="true">
                  <div className="pwa-update__progress-fill" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
