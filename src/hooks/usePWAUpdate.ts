import { useSyncExternalStore } from 'react';
import {
  getPWAUpdateSnapshot,
  subscribePWAUpdate,
} from '@/pwa';

export function usePWAUpdate() {
  return useSyncExternalStore(
    subscribePWAUpdate,
    getPWAUpdateSnapshot,
    getPWAUpdateSnapshot,
  );
}
