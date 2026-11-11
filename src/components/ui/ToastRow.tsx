import { Check, CircleAlert, Info, LoaderCircle, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { BrandMarkPath } from '@/components/ui/BrandMark';
import { useTypewriterReveal } from '@/components/ui/useTypewriterReveal';
import type { Language } from '@/contexts/LanguageContext';
import { TOAST_CONFIG } from '@/lib/constants';
import { toastStore, type ToastState, type ToastType } from '@/lib/notify';

const STATUS_ICONS: Record<ToastType, LucideIcon> = {
  success: Check,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert,
  loading: LoaderCircle,
};

interface ToastRowProps {
  toast: ToastState;
  language: Language;
}

/**
 * Fila única de aviso: marca de estado, mensaje en una línea y un solo control
 * al final — la acción del aviso cuando la tiene, si no el cierre.
 */
export function ToastRow({ toast, language }: ToastRowProps) {
  const systemUpdate = toast.presentation === 'system-update';
  const StatusIcon = STATUS_ICONS[toast.type];
  const duration = toast.duration ?? TOAST_CONFIG.defaultDurationMs;
  const visibleTitle = useTypewriterReveal(toast.title, {
    durationMs: duration,
    animated: toast.type !== 'loading',
  });

  return (
    <li
      className={`app-toaster__item app-toaster__item--${toast.type}${systemUpdate ? ' app-toaster__item--system-update' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span className="app-toaster__mark" aria-hidden="true">
        {systemUpdate ? (
          <svg viewBox="0 0 1800 1800" fill="none" focusable="false">
            <BrandMarkPath />
          </svg>
        ) : (
          <StatusIcon className={toast.type === 'loading' ? 'app-toaster__spin' : undefined} />
        )}
      </span>
      <span className="app-toaster__title">
        <span className="app-toaster__title-measure" aria-hidden="true">{toast.title}</span>
        <span className="app-toaster__title-visible" aria-hidden="true">{visibleTitle}</span>
        <span className="sr-only">{toast.title}</span>
      </span>
      <button
        type="button"
        className="app-toaster__control"
        aria-label={language === 'en' ? 'Dismiss notification' : 'Cerrar notificación'}
        onClick={() => toastStore.remove(toast.id)}
      >
        <X aria-hidden="true" />
      </button>
    </li>
  );
}
