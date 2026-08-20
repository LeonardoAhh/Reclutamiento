import { type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';

/**
 * Bloquea el acceso a rutas protegidas. Si no hay session activa, redirige a
 * `/login` recordando la URL original en `location.state.from` para que el
 * login pueda regresar al usuario después de autenticar.
 *
 * Mientras `loading` (primera carga de la session desde Supabase) muestra un
 * splash mínimo para evitar el "flash" de login → contenido.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!session) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}

import { useState, useEffect } from 'react';

/**
 * Espejo de AuthGuard para la ruta de login: si ya hay session, redirige al
 * dashboard. Evita que un usuario logueado vea el form de login.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const loader = useLoader();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Damos un pequeño ciclo para marcar que la carga inicial terminó
      requestAnimationFrame(() => setIsInitialLoad(false));
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (session) {
      if (isInitialLoad) {
        setShouldRedirect(true);
      } else {
        // Si no es la carga inicial, significa que el usuario acaba de iniciar sesión.
        // Damos gracia para que la animación del botón verde se complete.
        const timer = setTimeout(() => {
          loader.flash({ duration: 3000 }); // Launch transition loader
          // Wait briefly for the loader to fade in and cover the screen before redirecting
          setTimeout(() => setShouldRedirect(true), 300);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [session, loading, isInitialLoad, loader]);

  const from = (location.state as { from?: string } | null)?.from ?? '/reporte-diario';

  if (shouldRedirect) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
