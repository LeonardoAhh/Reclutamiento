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

const interactionCues = new Set<SoundName>();

export function playSound(name: SoundName, options?: PlayOptions): void {
  // Shared controls and legacy callbacks can handle the same interaction.
  if (interactionCues.has(name)) return;
  interactionCues.add(name);
  queueMicrotask(() => interactionCues.delete(name));
  play(name, options);
}

const interactionBindings = new WeakMap<ParentNode, { users: number; dispose: () => void }>();

export function bindSoundInteractions(root: ParentNode): () => void {
  let binding = interactionBindings.get(root);
  if (!binding) {
    binding = { users: 0, dispose: bind(root) };
    interactionBindings.set(root, binding);
  }
  const registration = binding;
  registration.users += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    registration.users -= 1;
    if (registration.users === 0) {
      registration.dispose();
      interactionBindings.delete(root);
    }
  };
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
