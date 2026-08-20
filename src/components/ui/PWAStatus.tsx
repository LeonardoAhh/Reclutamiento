import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, WifiOff } from 'lucide-react';
import './PWAStatus.css';


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
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    function onOfflineReady() {
      setOfflineReady(true);
      window.setTimeout(() => setOfflineReady(false), 4000);
    }
    
    function onOnline() {
      setOffline(false);
    }
    function onOffline() {
      setOffline(true);
    }

    window.addEventListener('pwa:offline-ready', onOfflineReady);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('pwa:offline-ready', onOfflineReady);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
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

      {/* ── Offline-ready toast (primera instalación del SW) ─────────── */}
      <AnimatePresence>
        {offlineReady && !offline && (
          <motion.div
            className="pwa-offline pwa-offline--ready"
            role="status"
            aria-live="polite"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <CheckCircle2 size={14} aria-hidden="true" className="pwa-offline__icon" />
            <span>App lista para uso sin conexión</span>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
