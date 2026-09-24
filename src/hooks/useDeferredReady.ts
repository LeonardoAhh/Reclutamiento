import { useEffect, useRef, useTransition, useState } from 'react';

/**
 * Evita el congelamiento del hilo principal cuando una página pesada termina
 * de cargar datos y va a montar un árbol DOM masivo.
 *
 * Patrón:
 *   - Mientras `loading` es true (datos en vuelo) → `isReady` = false.
 *   - Cuando `loading` pasa a false → iniciamos una transición React 18
 *     (startTransition) que marca `isReady = true`. Esto le dice a React
 *     que el render resultante es de baja prioridad: puede dividirlo en
 *     trozos y ceder el hilo entre ellos, eliminando el freeze visible.
 *   - Mientras la transición está pendiente → `isPending` = true, útil para
 *     mantener el TransitionLoader visible exactamente el tiempo que React
 *     necesita para terminar el mount.
 *
 * Uso:
 *   const { isReady, isPending } = useDeferredReady(loading);
 *   if (!isReady || isPending) return <TransitionLoader />;
 *   return <HeavyPage />;
 */
export function useDeferredReady(loading: boolean) {
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Evita disparar la transición más de una vez cuando `loading` ya es false
  // desde el inicio (datos en localStorage listos de inmediato).
  const transitionFiredRef = useRef(false);

  useEffect(() => {
    if (loading) {
      // Si los datos vuelven a estar cargando (ej. refetch), resetear.
      transitionFiredRef.current = false;
      return;
    }
    if (transitionFiredRef.current) return;
    transitionFiredRef.current = true;

    // Cede un frame para que el TransitionLoader sea visible antes del mount.
    const raf = requestAnimationFrame(() => {
      startTransition(() => {
        setIsReady(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [loading, startTransition]);

  return { isReady, isPending };
}
