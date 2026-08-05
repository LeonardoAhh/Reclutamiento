import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, LoaderCircle, AlertCircle } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { toastStore, type ToastState } from '@/lib/notify';
import './AppToaster.css';

function ToastItem({ toast }: { toast: ToastState }) {
  let iconData;
  switch (toast.type) {
    case 'success': iconData = CheckCircle2; break;
    case 'error': iconData = AlertTriangle; break;
    case 'info': iconData = Info; break;
    case 'warning': iconData = AlertCircle; break;
    case 'loading': iconData = LoaderCircle; break;
    default: iconData = Info; break;
  }
  
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`app-toaster__item app-toaster__item--${toast.type}`}
    >
      <div className={`app-toaster__icon ${toast.type === 'loading' ? 'app-toaster__icon--spin' : ''}`}>
        <MorphingIcon icon={iconData} size={18} aria-hidden="true" />
      </div>
      <div className="app-toaster__content">
        <span className="app-toaster__title">{toast.title}</span>
        {toast.hint && <span className="app-toaster__hint">{toast.hint}</span>}
      </div>
    </motion.li>
  );
}

/**
 * Host de notificaciones personalizado.
 * Se suscribe a `toastStore` y usa `framer-motion` + `Morphicons` para animar estados.
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
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </ul>
  );
}