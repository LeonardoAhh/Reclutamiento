import { bind, play, setEnabled, unlock, type PlayOptions, type SoundName } from 'cuelume';

export type { SoundName } from 'cuelume';

const SOUND_STORAGE_KEY = 'reclutamiento-sound';

export interface SoundSnapshot {
  enabled: boolean;
  storageError: boolean;
}

const SERVER_SNAPSHOT: SoundSnapshot = { enabled: true, storageError: false };

function readPreference(): SoundSnapshot {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;

  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return { enabled: stored === null ? true : stored === 'true', storageError: false };
  } catch {
    return { enabled: true, storageError: true };
  }
}

let snapshot = readPreference();
const listeners = new Set<() => void>();

setEnabled(snapshot.enabled);

export function getSoundSnapshot(): SoundSnapshot {
  return snapshot;
}

export function getServerSoundSnapshot(): SoundSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function playSound(name: SoundName, options?: PlayOptions): void {
  play(name, options);
}

export function bindSoundInteractions(root: ParentNode): () => void {
  return bind(root);
}

export function toggleSound(): void {
  const enabled = !snapshot.enabled;
  setEnabled(enabled);
  if (enabled) void unlock();

  let storageError = false;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    storageError = true;
  }

  snapshot = { enabled, storageError };
  listeners.forEach((listener) => listener());
}
