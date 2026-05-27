import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, WifiOff, X, Sparkles } from 'lucide-react';
import './PWAStatus.css';

type BannerState = 'idle' | 'available' | 'updating';

/**
 * PWA status banners:
 *  – `need-refresh`: new service-worker waiting → prominent update banner
 *    with animated entrance, progress state, and session-aware dismiss.
 *  – `offline`: navigator.onLine === false → sticky top banner.
 */
export function PWAStatus() {
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);
  const [bannerState, setBannerState] = useState<BannerState>('idle');
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    function onNeedRefresh(e: Event) {
      const detail = (e as CustomEvent<{ update: () => void }>).detail;
      setUpdateFn(() => detail.update);
      setBannerState('available');
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

  const handleUpdate = useCallback(() => {
    if (!updateFn) return;
    setBannerState('updating');
    updateFn();
  }, [updateFn]);

  const handleDismiss = useCallback(() => {
    setBannerState('idle');
    setUpdateFn(null);
  }, []);

  return (
    <>
      {/* ── Offline banner ── */}
      <AnimatePresence>
        {offline && (
          <motion.div
            className="pwa-banner pwa-banner--offline"
            role="status"
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <WifiOff size={16} aria-hidden="true" className="pwa-banner__icon" />
            <span className="pwa-banner__text">
              Sin conexión — mostrando datos en caché
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Update banner ── */}
      <AnimatePresence>
        {bannerState !== 'idle' && (
          <motion.div
            className="pwa-banner pwa-banner--update"
            role="status"
            aria-live="polite"
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <div className="pwa-banner__icon-wrap">
              {bannerState === 'updating' ? (
                <RefreshCw
                  size={20}
                  aria-hidden="true"
                  className="pwa-banner__icon pwa-banner__icon--spin"
                />
              ) : (
                <Sparkles
                  size={20}
                  aria-hidden="true"
                  className="pwa-banner__icon pwa-banner__icon--pulse"
                />
              )}
            </div>

            <div className="pwa-banner__body">
              <strong className="pwa-banner__title">
                {bannerState === 'updating'
                  ? 'Actualizando…'
                  : 'Nueva versión disponible'}
              </strong>
              <span className="pwa-banner__desc">
                {bannerState === 'updating'
                  ? 'Aplicando cambios, un momento'
                  : 'Mejoras y correcciones listas para instalar'}
              </span>
            </div>

            <div className="pwa-banner__actions">
              {bannerState === 'available' && (
                <>
                  <button
                    type="button"
                    className="pwa-banner__btn pwa-banner__btn--primary"
                    onClick={handleUpdate}
                  >
                    <Download size={14} aria-hidden="true" />
                    Actualizar
                  </button>
                  <button
                    type="button"
                    className="pwa-banner__dismiss"
                    onClick={handleDismiss}
                    aria-label="Descartar actualización"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {bannerState === 'updating' && (
              <div className="pwa-banner__progress" aria-hidden="true">
                <div className="pwa-banner__progress-bar" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
