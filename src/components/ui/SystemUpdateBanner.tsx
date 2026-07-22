import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, CheckCircle2, Wrench, RefreshCw, Download } from 'lucide-react';
import type { SystemNotiLevel } from '@/hooks/useSystemVersion';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';
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
  const { info, shouldNotify, dismiss, swUpdateFn } = useSystemVersion();
  const visible = shouldNotify && !!info;
  const level = info?.nivel ?? 'info';
  const Icon = LEVEL_ICON[level];
  const requiresReload = level === 'mantenimiento';

  const [isUpdating, setIsUpdating] = useState(false);

  const handleReload = () => {
    setIsUpdating(true);
    setTimeout(() => {
      dismiss();
      if (swUpdateFn) {
        swUpdateFn();
      } else {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <AnimatePresence>
      {visible && info && (
        <div className="system-update-overlay">
          <motion.aside
            key={info.version}
            className={`system-update system-update--${level}`}
            role="alertdialog"
            aria-modal="true"
            aria-live="assertive"
            initial={{ y: 20, opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.8 }}
            data-testid="system-update-banner"
          >
            <div className="system-update__icon-wrapper">
              <span className="system-update__badge" aria-hidden="true">
                <Icon size={20} strokeWidth={2.5} />
              </span>
            </div>

            <div className="system-update__body">
              <div className="system-update__heading">
                <strong className="system-update__title">{info.titulo}</strong>
                <span className="system-update__tag">
                  {!info.titulo.toLowerCase().includes(LEVEL_LABEL[level].toLowerCase()) && `${LEVEL_LABEL[level]} · `}
                  v{info.version}
                </span>
              </div>
              {info.mensaje && (
                <p className="system-update__desc">{info.mensaje}</p>
              )}
              
              {/* Update Action Button placed below the text */}
              <div className="system-update__action-container">
                <AnimatedSubmitButton
                  isSubmitting={false}
                  isSuccess={isUpdating}
                  idleText={requiresReload ? 'Actualizar y recargar' : 'Actualizar app'}
                  successText="Actualizando..."
                  idleIcon={requiresReload ? RefreshCw : Download}
                  onClick={handleReload}
                  className={requiresReload ? 'system-update__action system-update__action--mantenimiento' : 'system-update__btn-update'}
                />
                
                <p className="system-update__hint" style={{ marginTop: 'var(--spacing-sm)', fontSize: '12px', color: 'var(--color-muted)', textAlign: 'left' }}>
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>Sugerencia:</strong> 
                  Usa Ctrl + Shift + R para forzar borrado de caché
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
