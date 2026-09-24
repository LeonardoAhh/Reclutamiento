import { useSyncExternalStore } from 'react';
import { SYSTEM_UPDATE_BANNER_CONFIG } from '@/lib/constants';

/** Niveles de aviso soportados (mapeados a color en el CSS del banner). */
export type SystemNotiLevel = 'info' | 'success' | 'mantenimiento';

export interface SystemVersionInfo {
  version: string;
  fecha?: string;
  nivel: SystemNotiLevel;
  titulo: string;
  mensaje: string;
  notificar: boolean;
}

const VERSION_URL = '/version.json';
const SEEN_KEY = 'system_version_seen';
const CURRENT_APP_VERSION = __APP_VERSION__;

const LEVELS: ReadonlySet<SystemNotiLevel> = new Set([
  'info',
  'success',
  'mantenimiento',
]);

function parse(raw: unknown): SystemVersionInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'string' || !r.version.trim()) return null;
  const nivel = (r.nivel as SystemNotiLevel) ?? 'info';
  return {
    version: r.version.trim(),
    fecha: typeof r.fecha === 'string' ? r.fecha : undefined,
    nivel: LEVELS.has(nivel) ? nivel : 'info',
    titulo: typeof r.titulo === 'string' ? r.titulo : 'Sistema actualizado',
    mensaje: typeof r.mensaje === 'string' ? r.mensaje : '',
    notificar: r.notificar !== false,
  };
}

interface SystemVersionSnapshot {
  version: string;
  info: SystemVersionInfo | null;
  shouldNotify: boolean;
  hasRemoteUpdate: boolean;
}

type Listener = () => void;

function readSeenVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

let info: SystemVersionInfo | null = null;
let seenVersion = readSeenVersion();
let snapshot: SystemVersionSnapshot = createSnapshot();
let inFlight = false;
let stopWatching: (() => void) | undefined;
const listeners = new Set<Listener>();

function createSnapshot(): SystemVersionSnapshot {
  const hasRemoteUpdate = info != null && info.version !== CURRENT_APP_VERSION;
  return {
    version: CURRENT_APP_VERSION,
    info,
    hasRemoteUpdate,
    shouldNotify:
      info != null &&
      !hasRemoteUpdate &&
      info.notificar &&
      info.version !== seenVersion,
  };
}

function publish(): void {
  snapshot = createSnapshot();
  listeners.forEach((listener) => listener());
}

async function fetchVersion(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) return;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) return;
    const parsed = parse(await response.json());
    if (!parsed) return;

    info = parsed;
    publish();
  } catch {
    // Avisos de versión son complementarios; una falla no bloquea la app.
  } finally {
    inFlight = false;
  }
}

function startWatching(): void {
  if (stopWatching || typeof window === 'undefined') return;

  const refreshWhenVisible = (): void => {
    if (document.visibilityState === 'visible') void fetchVersion();
  };
  const interval = window.setInterval(
    refreshWhenVisible,
    SYSTEM_UPDATE_BANNER_CONFIG.versionCheckIntervalMs,
  );

  window.addEventListener('focus', refreshWhenVisible);
  window.addEventListener('online', refreshWhenVisible);
  document.addEventListener('visibilitychange', refreshWhenVisible);
  void fetchVersion();

  stopWatching = () => {
    window.clearInterval(interval);
    window.removeEventListener('focus', refreshWhenVisible);
    window.removeEventListener('online', refreshWhenVisible);
    document.removeEventListener('visibilitychange', refreshWhenVisible);
    stopWatching = undefined;
  };
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  startWatching();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopWatching?.();
  };
}

function getSnapshot(): SystemVersionSnapshot {
  return snapshot;
}

export function dismissSystemVersion(): void {
  if (!info || info.version !== CURRENT_APP_VERSION) return;
  seenVersion = info.version;
  try {
    window.localStorage.setItem(SEEN_KEY, seenVersion);
  } catch {
    // El aviso puede cerrarse aunque almacenamiento local esté restringido.
  }
  publish();
}

export function useSystemVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
