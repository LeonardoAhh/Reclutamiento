import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { TransitionLoader } from '@/components/ui/TransitionLoader';

/** Tiempo de permanencia existente de flash; no es una duración de animación. */
const DEFAULT_FLASH_DURATION_MS = 850;

interface LoaderOptions {
  title?: string;
}

interface LoaderApi {
  /** Muestra el overlay hasta que se llame `hide`. Para login / logout. */
  show: (opts?: LoaderOptions) => void;
  hide: () => void;
  /** Reemplaza la carga actual y la oculta después de duration (milisegundos). */
  flash: (opts?: LoaderOptions & { duration?: number }) => void;
  visible: boolean;
}

const LoaderContext = createContext<LoaderApi | null>(null);

/**
 * Provider global del splash de carga. Renderiza TransitionLoader vía
 * portal en <body>; la entrada visual se resuelve en su CSS. Es
 * independiente de Boneyard: cada vista gestiona su carga de datos y este
 * overlay cubre únicamente transiciones de sesión y navegación.
 * Cada llamada reemplaza la anterior; no administra una cola de operaciones.
 */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoaderOptions | null>(null);
  const visible = state !== null;
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const show = useCallback(
    (opts?: LoaderOptions) => {
      clearTimer();
      setState(opts ?? {});
    },
    [clearTimer]
  );

  const hide = useCallback(() => {
    clearTimer();
    setState(null);
  }, [clearTimer]);

  const flash = useCallback(
    (opts?: LoaderOptions & { duration?: number }) => {
      const { duration = DEFAULT_FLASH_DURATION_MS, ...rest } = opts ?? {};
      clearTimer();
      setState(rest);
      timer.current = window.setTimeout(() => {
        setState(null);
        timer.current = null;
      }, duration);
    },
    [clearTimer]
  );

  // Cambiar el título actualiza el portal, no la API de los consumidores.
  const api = useMemo<LoaderApi>(
    () => ({ show, hide, flash, visible }),
    [show, hide, flash, visible]
  );

  return (
    <LoaderContext.Provider value={api}>
      {children}
      {createPortal(
        state !== null ? <TransitionLoader title={state.title} /> : null,
        document.body
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader(): LoaderApi {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error('useLoader debe usarse dentro de <LoaderProvider>');
  }
  return ctx;
}
