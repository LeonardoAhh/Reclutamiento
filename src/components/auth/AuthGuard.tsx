import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { HOME_PATH } from '@/components/layout/navigation';
import { CAREER_JOURNEY_ENABLED, CAREER_PATH } from '@/features/career/types';
import { hasCompletedCareerJourney } from '@/features/career/completion';

/** Conserva el acceso protegido y la espera del perfil después de autenticar. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading, profileLoading } = useAuth();
  if (loading || (session && profileLoading)) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Un ingreso con credenciales abre el recorrido pendiente cuando está habilitado. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const { flash } = useLoader();
  const sawSignedOut = useRef(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) { sawSignedOut.current = true; return; }
    if (!sawSignedOut.current) { setDestination(HOME_PATH); return; }

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    // Conserva la espera existente del botón de éxito y de la transición del workspace.
    const successTimer = setTimeout(() => {
      flash({ variant: 'workspace-entry' });
      redirectTimer = setTimeout(() => setDestination(
        CAREER_JOURNEY_ENABLED && !hasCompletedCareerJourney(session.user.user_metadata) ? CAREER_PATH : HOME_PATH,
      ), 300);
    }, 800);
    return () => {
      clearTimeout(successTimer);
      if (redirectTimer !== undefined) clearTimeout(redirectTimer);
    };
  }, [session, loading, flash]);

  if (destination) return <Navigate to={destination} replace />;
  return <>{children}</>;
}
