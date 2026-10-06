import { useEffect, useRef, useState } from 'react';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import {
  SYSTEM_UPDATE_BANNER_CONFIG,
  SYSTEM_UPDATE_BANNER_ENGLISH,
} from '@/lib/constants';
import { toast } from '@/lib/notify';
import { useLanguage } from '@/contexts/LanguageContext';

const CONNECTION_NOTICE_ID = 'connection-status';
const OFFLINE_READY_NOTICE_ID = 'offline-ready';

export function PWAStatus() {
  const { language } = useLanguage();
  const copy = language === 'en' ? SYSTEM_UPDATE_BANNER_ENGLISH : SYSTEM_UPDATE_BANNER_CONFIG;
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const { offlineReadyRevision } = usePWAUpdate();
  const previousOffline = useRef(offline);
  const lastOfflineReadyRevision = useRef(0);

  useEffect(() => {
    const updateConnection = (): void => setOffline(!navigator.onLine);

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    if (offline) {
      toast.warning({
        id: CONNECTION_NOTICE_ID,
        title: copy.offlineTitle,
        description: copy.offlineHint,
        duration: Infinity,
      });
    } else if (previousOffline.current) {
      toast.success({
        id: CONNECTION_NOTICE_ID,
        title: copy.onlineTitle,
      });
    }
    previousOffline.current = offline;
  }, [copy, offline]);

  useEffect(() => {
    if (offlineReadyRevision <= lastOfflineReadyRevision.current) return;

    lastOfflineReadyRevision.current = offlineReadyRevision;
    if (offline) return;

    toast.success({
      id: OFFLINE_READY_NOTICE_ID,
      title: copy.offlineReadyTitle,
      description: copy.offlineReadyHint,
    });
  }, [copy, offline, offlineReadyRevision]);

  return null;
}
