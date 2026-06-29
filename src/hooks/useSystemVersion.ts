import { useCallback, useEffect, useRef, useState } from 'react';

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

/** Fuente de verdad editable manualmente y desplegada como asset estático. */
const VERSION_URL = '/version.json';
/** Última versión que el usuario ya vio/descartó en este dispositivo. */
const SEEN_KEY = 'system_version_seen';
/** Cada cuánto re-consultar mientras la pestaña está abierta. */
const POLL_MS = 5 * 60 * 1000;

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

/**
 * Lee `version.json` (editable a mano + redeploy), expone la versión actual y
 * decide si debe mostrarse el aviso de actualización:
 *  - se re-consulta al montar, al volver el foco/visibilidad y cada 5 min
 *  - `version.json` no entra al precache del SW, y se pide con `no-store`,
 *    por lo que siempre refleja el último deploy
 *  - el aviso reaparece SOLO cuando cambia la versión respecto a la última
 *    vista en este dispositivo (persistida en localStorage)
 */
export function useSystemVersion() {
  const [info, setInfo] = useState<SystemVersionInfo | null>(null);
  const [seenVersion, setSeenVersion] = useState<string | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(SEEN_KEY);
  });
  const inFlight = useRef(false);

  const fetchVersion = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('text/html')) return;
      const parsed = parse(await res.json());
      if (parsed) setInfo(parsed);
    } catch {
      /* silencioso: la ausencia de aviso no debe romper la app */
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchVersion();

    const onFocus = () => fetchVersion();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchVersion();
    };
    const id = window.setInterval(fetchVersion, POLL_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchVersion]);

  const dismiss = useCallback(() => {
    if (!info) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SEEN_KEY, info.version);
    }
    setSeenVersion(info.version);
  }, [info]);

  const shouldNotify =
    !!info && info.notificar && info.version !== seenVersion;

  return {
    version: info?.version ?? null,
    info,
    shouldNotify,
    dismiss,
  };
}
