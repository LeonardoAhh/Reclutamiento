import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info as InfoData, CheckCircle2 as CheckCircle2Data, Wrench as WrenchData, X as XData, Download as DownloadIconData, RefreshCw as RefreshCwIconData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import type { SystemNotiLevel } from '@/hooks/useSystemVersion';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';
import './SystemUpdateBanner.css';

import type { IconInput } from 'morphicons/react';

const LEVEL_ICON: Record<SystemNotiLevel, IconInput> = {
  info: InfoData,
  success: CheckCircle2Data,
  mantenimiento: WrenchData,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && info && (
        <div className={`system-update-overlay ${requiresReload ? 'system-update-overlay--blocking' : ''}`}>
          <motion.aside
            key={info.version}
            className={`system-update system-update--${level}`}
            role="alertdialog"
            aria-modal="true"
            aria-live="assertive"
            initial={{ y: 100, opacity: 0, scale: 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.8 }}
            data-testid="system-update-banner"
          >
            <div className="system-update__icon-wrapper">
              <span className="system-update__badge" aria-hidden="true">
                <MorphingIcon icon={Icon} size={20} />
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

              {/* Update Action Button placed below the text */}
              <div className="system-update__action-container">
                <AnimatedSubmitButton
                  isSubmitting={false}
                  isSuccess={isUpdating}
                  idleText={requiresReload ? 'Actualizar y recargar' : 'Actualizar sistema'}
                  successText="Actualizando..."
                  idleIcon={requiresReload ? RefreshCwIconData : DownloadIconData}
                  onClick={handleReload}
                  className="btn-primary"
                  iconOnly={true}
                />
              </div>
            </div>

            <button
              className="system-update__close"
              onClick={dismiss}
              aria-label="Cerrar aviso"
            >
              <MorphingIcon icon={XData} size={20} aria-hidden="true" />
            </button>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
