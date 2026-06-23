import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { LoaderOverlay, type LoaderTone } from '@/components/ui/LoaderOverlay';

interface LoaderOptions {
  title?: string;
  hint?: string;
  tone?: LoaderTone;
}

interface LoaderApi {
  /** Muestra el overlay hasta que se llame `hide`. Para login / logout. */
  show: (opts?: LoaderOptions) => void;
  hide: () => void;
  /** Muestra el overlay por una duración fija y se oculta solo. Para transiciones. */
  flash: (opts?: LoaderOptions & { duration?: number }) => void;
  visible: boolean;
}

const LoaderContext = createContext<LoaderApi | null>(null);

/**
 * Provider global del splash de carga. Renderiza un único <LoaderOverlay> vía
 * portal en <body>, con entrada/salida coordinada por AnimatePresence. Es
 * independiente del Skeleton: el Skeleton vive dentro de cada página mientras
 * carga su data; este overlay cubre transiciones de sesión y navegación.
 */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoaderOptions | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

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
      const { duration = 850, ...rest } = opts ?? {};
      clearTimer();
      setState(rest);
      timer.current = window.setTimeout(() => {
        setState(null);
        timer.current = null;
      }, duration);
    },
    [clearTimer]
  );

  const api = useMemo<LoaderApi>(
    () => ({ show, hide, flash, visible: state !== null }),
    [show, hide, flash, state]
  );

  return (
    <LoaderContext.Provider value={api}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state !== null && (
            <LoaderOverlay
              key="app-loader"
              title={state.title}
              hint={state.hint}
              tone={state.tone}
            />
          )}
        </AnimatePresence>,
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
