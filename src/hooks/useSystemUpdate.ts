import { useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { useSystemVersion } from '@/hooks/useSystemVersion';
import {
  SYSTEM_UPDATE_BANNER_CONFIG,
  SYSTEM_UPDATE_BANNER_ENGLISH,
} from '@/lib/constants';
import { applyPWAUpdate, checkForPWAUpdate, type PWAUpdateStatus } from '@/pwa';

/** Estados que el sistema ofrece como acción; el resto no tiene control visible. */
export type SystemUpdateState = 'hidden' | 'available' | 'applying' | 'error';

export interface SystemUpdate {
  state: SystemUpdateState;
  /** Texto del control; se escribe carácter a carácter cuando aparece. */
  label: string;
  /** Explicación del estado para el tooltip del riel plegado. */
  hint: string;
  apply: () => void;
}

const ACTIONABLE: Partial<Record<PWAUpdateStatus, SystemUpdateState>> = {
  available: 'available',
  applying: 'applying',
  'apply-error': 'error',
};

/**
 * Única fuente del estado accionable de actualización: resuelve la versión
 * remota contra el service worker y entrega estado, copy y acción. La
 * presentación vive en el control del riel; aquí no hay interfaz.
 */
export function useSystemUpdate(): SystemUpdate {
  const { language } = useLanguage();
  const copy = language === 'en' ? SYSTEM_UPDATE_BANNER_ENGLISH : SYSTEM_UPDATE_BANNER_CONFIG;
  const { info, hasRemoteUpdate } = useSystemVersion();
  const { status } = usePWAUpdate();

  useEffect(() => {
    if (hasRemoteUpdate) void checkForPWAUpdate(true);
  }, [hasRemoteUpdate, info?.version]);

  return useMemo(() => {
    const state = ACTIONABLE[status] ?? 'hidden';
    const label =
      state === 'applying'
        ? copy.preparingLabel
        : state === 'error'
          ? copy.retryLabel
          : copy.availableTitle;

    return {
      state,
      label,
      hint: state === 'error' ? copy.errorHint : label,
      apply: () => void applyPWAUpdate(),
    };
  }, [copy, status]);
}
