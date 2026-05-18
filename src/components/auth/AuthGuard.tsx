import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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
    return (
      <div className="auth-splash" role="status" aria-live="polite">
        <span className="auth-splash__dot" aria-hidden="true" />
        <span className="auth-splash__dot" aria-hidden="true" />
        <span className="auth-splash__dot" aria-hidden="true" />
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}

/**
 * Espejo de AuthGuard para la ruta de login: si ya hay session, redirige al
 * dashboard. Evita que un usuario logueado vea el form de login.
 */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (loading) {
    return (
      <div className="auth-splash" role="status" aria-live="polite">
        <span className="auth-splash__dot" aria-hidden="true" />
        <span className="auth-splash__dot" aria-hidden="true" />
        <span className="auth-splash__dot" aria-hidden="true" />
      </div>
    );
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
