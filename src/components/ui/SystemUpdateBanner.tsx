import { AnimatePresence, motion } from 'framer-motion';
import { Info, CheckCircle2, Wrench, X, RefreshCw } from 'lucide-react';
import type { SystemNotiLevel } from '@/hooks/useSystemVersion';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import './SystemUpdateBanner.css';

const LEVEL_ICON: Record<SystemNotiLevel, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  mantenimiento: Wrench,
};

const LEVEL_LABEL: Record<SystemNotiLevel, string> = {
  info: 'Información',
  success: 'Actualización',
  mantenimiento: 'Mantenimiento',
};

/**
 * Aviso global de actualización del sistema, alimentado por `version.json`.
 * - Reaparece cuando cambia la versión; se puede cerrar (persistente por device).
 * - Niveles con color semántico (info / success / mantenimiento).
 * - Mobile-first: barra inferior full-width que respeta safe-area; en pantallas
 *   grandes se vuelve una tarjeta flotante. Cero valores hardcodeados (tokens).
 */
export function SystemUpdateBanner() {
  const { info, shouldNotify, dismiss } = useSystemVersion();
  const visible = shouldNotify && !!info;
  const level = info?.nivel ?? 'info';
  const Icon = LEVEL_ICON[level];
  const requiresReload = level === 'mantenimiento';

  const handleReload = () => {
    dismiss();
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {visible && info && (
        <motion.aside
          key={info.version}
          className={`system-update system-update--${level}`}
          role="status"
          aria-live="polite"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          data-testid="system-update-banner"
        >
          <span className="system-update__badge" aria-hidden="true">
            <Icon size={18} />
          </span>

          <div className="system-update__body">
            <div className="system-update__heading">
              <strong className="system-update__title">{info.titulo}</strong>
              <span className="system-update__tag">
                {LEVEL_LABEL[level]} · v{info.version}
              </span>
            </div>
            {info.mensaje && (
              <p className="system-update__desc">{info.mensaje}</p>
            )}
          </div>

          {requiresReload ? (
            <button
              type="button"
              className="system-update__action"
              onClick={handleReload}
              data-testid="system-update-reload"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Actualizar y recargar
            </button>
          ) : (
            <button
              type="button"
              className="system-update__close"
              onClick={dismiss}
              aria-label="Entendido, cerrar aviso"
              data-testid="system-update-dismiss"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
