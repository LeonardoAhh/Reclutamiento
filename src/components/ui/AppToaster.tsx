import { useSyncExternalStore } from 'react';
import {
  BadgeCheck,
  BadgeInfo,
  CircleDashed,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-react';
import { toastStore, type ToastState } from '@/lib/notify';
import './AppToaster.css';

function ToastItem({ toast }: { toast: ToastState }) {
  let IconData;
  switch (toast.type) {
    case 'success': IconData = BadgeCheck; break;
    case 'error': IconData = OctagonAlert; break;
    case 'info': IconData = BadgeInfo; break;
    case 'warning': IconData = TriangleAlert; break;
    case 'loading': IconData = CircleDashed; break;
    default: IconData = BadgeInfo; break;
  }
  
  return (
    <li
      className={`app-toaster__item app-toaster__item--${toast.type}`}
      aria-busy={toast.type === 'loading'}
    >
      <div
        className={`app-toaster__icon ${toast.type === 'loading' ? 'app-toaster__icon--spin' : ''}`}
      >
        <IconData aria-hidden="true" />
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
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </ol>
  );
}
