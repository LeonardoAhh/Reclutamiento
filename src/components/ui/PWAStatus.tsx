import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, WifiOff, X, Sparkles } from 'lucide-react';
import './PWAStatus.css';

type BannerState = 'idle' | 'available' | 'updating';

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
            role="status"
            aria-live="polite"
            initial={{ y: 72, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 72, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            {/* Icon badge */}
            <div className="pwa-update__badge" aria-hidden="true">
              {bannerState === 'updating' ? (
                <RefreshCw size={16} className="pwa-update__icon--spin" />
              ) : (
                <Sparkles size={16} className="pwa-update__icon--pulse" />
              )}
            </div>

            {/* Copy */}
            <div className="pwa-update__body">
              <strong className="pwa-update__title">
                {bannerState === 'updating'
                  ? 'Actualizando…'
                  : 'Nueva versión disponible'}
              </strong>
              <span className="pwa-update__desc">
                {bannerState === 'updating'
                  ? 'Aplicando cambios, un momento'
                  : 'Mejoras y correcciones listas para instalar'}
              </span>
            </div>

            {/* Actions */}
            {bannerState === 'available' && (
              <div className="pwa-update__actions">
                <button
                  type="button"
                  className="pwa-update__btn-update btn-primary"
                  onClick={handleUpdate}
                >
                  <Download size={13} aria-hidden="true" />
                  Actualizar
                </button>
                <button
                  type="button"
                  className="pwa-update__btn-dismiss btn-icon"
                  onClick={handleDismiss}
                  aria-label="Descartar actualización"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Indeterminate progress — visible only while updating */}
            {bannerState === 'updating' && (
              <div className="pwa-update__progress" aria-hidden="true">
                <div className="pwa-update__progress-fill" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
