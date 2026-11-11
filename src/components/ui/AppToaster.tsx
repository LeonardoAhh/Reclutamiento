import { useSyncExternalStore } from 'react';
import { ToastRow } from '@/components/ui/ToastRow';
import { useLanguage } from '@/contexts/LanguageContext';
import { toastStore } from '@/lib/notify';
import './AppToaster.css';

/** Host único de avisos: solo el más reciente permanece visible. */
export function AppToaster() {
  const { language } = useLanguage();
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );
  const visible = toasts[toasts.length - 1];

  return (
    <ol
      className={`app-toaster${visible?.presentation === 'system-update' ? ' app-toaster--system-update' : ''}`}
      aria-label={language === 'en' ? 'Notifications' : 'Notificaciones'}
    >
      {visible && <ToastRow key={visible.id} toast={visible} language={language} />}
    </ol>
  );
}
