import { registerSW } from 'virtual:pwa-register';
import { SYSTEM_UPDATE_BANNER_CONFIG } from '@/lib/constants';

export type PWAUpdateStatus =
  | 'idle'
  | 'available'
  | 'applying'
  | 'registration-error'
  | 'apply-error';

export interface PWAUpdateSnapshot {
  status: PWAUpdateStatus;
  offlineReadyRevision: number;
}

type Listener = () => void;

const LEGACY_AUTHENTICATED_CACHE = 'supabase-api';

let snapshot: PWAUpdateSnapshot = {
  status: 'idle',
  offlineReadyRevision: 0,
};
let registration: ServiceWorkerRegistration | undefined;
let serviceWorkerUrl: string | undefined;
let activateUpdate: (() => Promise<void>) | undefined;
let updateDeferred = false;
let updateCheckInFlight = false;
let lastUpdateCheckAt = 0;
const listeners = new Set<Listener>();

function publish(next: Partial<PWAUpdateSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribePWAUpdate(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPWAUpdateSnapshot(): PWAUpdateSnapshot {
  return snapshot;
}

async function clearLegacyAuthenticatedCache(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    await window.caches.delete(LEGACY_AUTHENTICATED_CACHE);
  } catch {
    // Limpieza idempotente: una falla de almacenamiento no bloquea la app.
  }
}

export async function checkForPWAUpdate(force = false): Promise<void> {
  if (!registration || !serviceWorkerUrl || updateCheckInFlight) return;
  if (!navigator.onLine || registration.installing) return;

  const now = Date.now();
  if (
    !force &&
    now - lastUpdateCheckAt <
      SYSTEM_UPDATE_BANNER_CONFIG.serviceWorkerCheckMinGapMs
  ) {
    return;
  }

  updateCheckInFlight = true;
  lastUpdateCheckAt = now;

  try {
    const response = await fetch(serviceWorkerUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    });

    if (response.ok) await registration.update();
  } catch {
    // Revisión en segundo plano: errores de red se resolverán después.
  } finally {
    updateCheckInFlight = false;
  }
}

export async function applyPWAUpdate(): Promise<void> {
  if (!activateUpdate || snapshot.status === 'applying') return;

  publish({ status: 'applying' });
  try {
    await activateUpdate();
  } catch {
    publish({ status: 'apply-error' });
  }
}

export function deferPWAUpdate(): void {
  updateDeferred = true;
  publish({ status: 'idle' });
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  void clearLegacyAuthenticatedCache();

  const updateSW = registerSW({
    onRegisteredSW: (swUrl, currentRegistration) => {
      serviceWorkerUrl = swUrl;
      registration = currentRegistration;
      void checkForPWAUpdate();
    },
    onNeedRefresh: () => {
      activateUpdate = () => updateSW(true);
      if (!updateDeferred) publish({ status: 'available' });
    },
    onOfflineReady: () => {
      publish({ offlineReadyRevision: snapshot.offlineReadyRevision + 1 });
    },
    onRegisterError: () => {
      publish({ status: 'registration-error' });
    },
  });

  const checkWhenActive = (): void => {
    if (document.visibilityState === 'visible') void checkForPWAUpdate();
  };

  window.addEventListener('focus', checkWhenActive);
  window.addEventListener('online', checkWhenActive);
  document.addEventListener('visibilitychange', checkWhenActive);
  window.setInterval(
    checkWhenActive,
    SYSTEM_UPDATE_BANNER_CONFIG.serviceWorkerCheckIntervalMs,
  );
}
