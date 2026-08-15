import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, LoaderCircle, AlertCircle } from 'lucide-react';
import { toastStore, type ToastState } from '@/lib/notify';
import './AppToaster.css';

function ToastItem({ toast }: { toast: ToastState }) {
  let IconData;
  switch (toast.type) {
    case 'success': IconData = CheckCircle2; break;
    case 'error': IconData = AlertTriangle; break;
    case 'info': IconData = Info; break;
    case 'warning': IconData = AlertCircle; break;
    case 'loading': IconData = LoaderCircle; break;
    default: IconData = Info; break;
  }
  
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`app-toaster__item app-toaster__item--${toast.type}`}
    >
      <div className={`app-toaster__icon ${toast.type === 'loading' ? 'app-toaster__icon--spin' : ''}`}>
        <IconData size={18} aria-hidden="true" />
      </div>
      <div className="app-toaster__content">
        <span className="app-toaster__title">{toast.title}</span>
        {toast.description && <span className="app-toaster__hint">{toast.description}</span>}
      </div>
    </motion.li>
  );
}

/**
 * Host de notificaciones personalizado alineado a AGENTS.md
 * Se suscribe a `toastStore` y usa `framer-motion` + `lucide-react`.
 */
export function AppToaster() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    return toastStore.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  return (
    <ul className="app-toaster" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </ul>
  );
}