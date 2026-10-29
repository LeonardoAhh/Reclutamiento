import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { StatusPage } from '@/components/ui/StatusPage';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/lib/notify';
import { useLoader } from '@/hooks/useLoader';
import { HOME_PATH } from '@/components/layout/navigation';
import { CAREER_JOURNEY_ENABLED, CAREER_PATH } from '@/features/career/types';
import { hasCompletedCareerJourney } from '@/features/career/completion';

/** Conserva el acceso protegido y la espera del perfil después de autenticar. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const { session, sessionExpired, profile, loading, profileLoading, signOut } = useAuth();
  if (loading || (session && profileLoading)) return null;
  if (!session) return <Navigate to={sessionExpired ? '/session-expired' : '/login'} replace />;
  if (!profile) return <StatusPage kind={navigator.onLine ? 'server' : 'offline'} standalone onRetry={() => window.location.reload()} onSignOut={() => {
    void signOut().catch(() => toast.error({ title: language === 'en' ? 'Could not sign out. Try again.' : 'No se pudo cerrar sesión. Intenta de nuevo.' }));
  }} />;
  return <>{children}</>;
}

/** Un ingreso con credenciales abre el recorrido pendiente cuando está habilitado. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading, loginTransition } = useAuth();
  const { flash } = useLoader();
  const sawSignedOut = useRef(false);
  const transitionStarted = useRef(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      sawSignedOut.current = true;
      transitionStarted.current = false;
      setDestination(null);
      return;
    }
    if (!sawSignedOut.current) { setDestination(HOME_PATH); return; }

    if (loginTransition.phase === 'verifying' || loginTransition.phase === 'verified' || loginTransition.phase === 'failed') return;
    if (transitionStarted.current) return;
    transitionStarted.current = true;
    if (loginTransition.phase === 'ready') flash({ variant: 'workspace-entry' });
    setDestination(
      CAREER_JOURNEY_ENABLED && !hasCompletedCareerJourney(session.user.user_metadata) ? CAREER_PATH : HOME_PATH,
    );
  }, [session, loading, flash, loginTransition.phase]);

  if (destination && session) return <Navigate to={destination} replace />;
  return <>{children}</>;
}
