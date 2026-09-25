import { useEffect, useState, useSyncExternalStore } from 'react';
import { wave } from 'robot-toast/robots';
import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  toastStore,
  type ToastState,
  type ToastType,
} from '@/lib/notify';
import { TOAST_CONFIG } from '@/lib/constants';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import './AppToaster.css';

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert,
  loading: LoaderCircle,
};

function ToastItem({ toast }: { toast: ToastState }) {
  const Icon = TOAST_ICONS[toast.type];
  const compact = !toast.description && !toast.actions?.length;
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [typing, setTyping] = useState({ title: toast.title, count: 0 });
  const characters = Array.from(toast.title);
  const shouldType = toast.type !== 'loading' && !reducedMotion;
  const duration = toast.duration ?? TOAST_CONFIG.defaultDurationMs;
  const interval = Number.isFinite(duration)
    ? Math.max(1, Math.min(TOAST_CONFIG.typewriterIntervalMs, Math.floor(duration / (characters.length * 2))))
    : TOAST_CONFIG.typewriterIntervalMs;

  useEffect(() => {
    if (!shouldType || characters.length === 0) return;

    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setTyping({ title: toast.title, count });
      if (count >= characters.length) window.clearInterval(timer);
    }, interval);

    return () => window.clearInterval(timer);
  }, [toast.title, shouldType, characters.length, interval]);

  const visibleTitle = shouldType
    ? characters.slice(0, typing.title === toast.title ? typing.count : 0).join('')
    : toast.title;

  return (
    <li
      className={`app-toaster__item app-toaster__item--${toast.type}${compact ? ' app-toaster__item--compact' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      aria-busy={toast.type === 'loading'}
    >
      <div className="app-toaster__avatar" aria-hidden="true">
        <img className="app-toaster__robot" src={wave} alt="" />
        <span className={`app-toaster__icon ${toast.type === 'loading' ? 'app-toaster__icon--spin' : ''}`}>
          <Icon />
        </span>
      </div>
      <div className="app-toaster__content">
        <span className="app-toaster__title">
          <span className="app-toaster__title-measure" aria-hidden="true">{toast.title}</span>
          <span className="app-toaster__title-visible" aria-hidden="true">{visibleTitle}</span>
          <span className="sr-only">{toast.title}</span>
        </span>
        {toast.description && (
          <span className="app-toaster__hint">{toast.description}</span>
        )}
        {toast.actions && toast.actions.length > 0 && (
          <div className="app-toaster__actions">
            {toast.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`app-toaster__action app-toaster__action--${action.variant ?? 'secondary'}`}
                onClick={() => {
                  action.onClick();
                  if (action.closeOnAction !== false) {
                    toastStore.remove(toast.id);
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="app-toaster__dismiss"
        aria-label="Cerrar notificación"
        onClick={() => toastStore.remove(toast.id)}
      >
        <X aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Host único de notificaciones, accesible y limitado a tres mensajes.
 */
export function AppToaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );
  return (
    <ol
      className="app-toaster"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </ol>
  );
}
