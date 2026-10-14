import { useCallback, useSyncExternalStore } from 'react';
import {
  getServerSoundSnapshot,
  getSoundSnapshot,
  playSound,
  subscribeSound,
  toggleSound,
} from '@/lib/sound';

type FeedbackType = 'light' | 'success' | 'error';

const FEEDBACK_SOUNDS = {
  light: 'tap',
  success: 'success',
  error: 'error',
} as const;

export function useFeedback() {
  const { enabled: soundEnabled, storageError: soundStorageError } = useSyncExternalStore(
    subscribeSound,
    getSoundSnapshot,
    getServerSoundSnapshot,
  );

  const trigger = useCallback((type: FeedbackType, options?: { sound?: boolean }) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'success':
            navigator.vibrate([20, 50, 30]);
            break;
          case 'error':
            navigator.vibrate([50, 50, 50, 50, 50]);
            break;
        }
      } catch {
        // El dispositivo puede no admitir vibración.
      }
    }

    if (options?.sound !== false) playSound(FEEDBACK_SOUNDS[type]);
  }, []);

  return { soundEnabled, soundStorageError, toggleSound, trigger };
}
