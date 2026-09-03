import { type ReactNode, useTransition, useEffect, useState, useRef } from 'react';
import { TransitionLoader } from '@/components/ui/TransitionLoader';

interface PageLoaderProps {
  /** El loader se muestra mientras `loading` es true. */
  loading: boolean;
  /** Etiqueta accesible que describe qué se está cargando. */
  title?: string;
  children: ReactNode;
}

/**
 * Envuelve una página pesada y evita el freeze del hilo principal.
 *
 * Mientras `loading` es true se muestra un TransitionLoader.
 * Cuando `loading` pasa a false, se usa startTransition para diferir
 * el mount de `children` — React puede dividirlo en trozos y ceder
 * el hilo entre ellos (Concurrent Rendering), eliminando el freeze visible.
 *
 * Uso:
 *   <PageLoader loading={loading && employees.length === 0} title="Cargando plantilla…">
 *     <DashboardHeavyContent />
 *   </PageLoader>
 */
export function PageLoader({ loading, title = 'Cargando…', children }: PageLoaderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const firedRef = useRef(false);

  useEffect(() => {
    if (loading) {
      // Si vuelve a cargar, resetear para mostrar loader de nuevo.
      firedRef.current = false;
      setIsReady(false);
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    // Cede un frame para que el loader sea visible antes de que React
    // empiece a procesar el árbol pesado en background.
    const raf = requestAnimationFrame(() => {
      startTransition(() => {
        setIsReady(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [loading]);

  if (!isReady || isPending) {
    return <TransitionLoader title={title} />;
  }

  return <>{children}</>;
}
