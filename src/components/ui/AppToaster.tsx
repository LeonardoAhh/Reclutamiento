import { useSyncExternalStore } from 'react';
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
import './AppToaster.css';

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert,
  loading: LoaderCircle,
  default: Info,
};

function ToastItem({ toast }: { toast: ToastState }) {
  const Icon = TOAST_ICONS[toast.type];

  return (
    <li
      className={`app-toaster__item app-toaster__item--${toast.type}`}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-busy={toast.type === 'loading'}
    >
      <div
        className={`app-toaster__icon ${toast.type === 'loading' ? 'app-toaster__icon--spin' : ''}`}
      >
        <Icon aria-hidden="true" />
      </div>
      <div className="app-toaster__content">
        <span className="app-toaster__title">{toast.title}</span>
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
