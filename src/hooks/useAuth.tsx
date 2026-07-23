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
import type { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import { supabase, AUTH_JWT_EXPIRED_EVENT } from '@/lib/supabase';
import { extractOnlineUserIds, publishOnlineUserIds } from '@/lib/presence';
import { sileo } from '@/lib/notify';
import {
  signInWithUsername as signInLib,
  signOut as signOutLib,
  emailToUsername,
  type SignInResult,
} from '@/lib/auth';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  role: 'admin' | 'reclutador' | 'gerente' | 'auditor';
  created_at?: string;
  last_login_at?: string | null;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileLoading: boolean;
  /** Username derivado del profile o, como fallback, del email sintético. */
  username: string;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Provider único de auth. Debe montarse una sola vez, lo más arriba posible
 * en el árbol (encima del Router) para que toda la app comparta el mismo
 * estado de session/profile.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  // Ref con la session actual, accesible dentro de handlers sin re-suscribir.
  const sessionRef = useRef<Session | null>(null);
  // Evita spamear el toast de "Sesión expirada" si múltiples requests fallan.
  const expiredNotifiedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
    if (session) expiredNotifiedRef.current = false;
  }, [session]);

  // Carga inicial de la session + suscripción a cambios.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ── Sesión expirada detectada por fetch interceptor ─────────────────
     Cualquier respuesta 401/403 de Supabase con cuerpo tipo "JWT expired"
     o `PGRST303` dispara `AUTH_JWT_EXPIRED_EVENT`. Aquí **NO** intentamos
     refresh silencioso: si llegamos a este punto es porque una request
     ya se disparó con un token muerto (Supabase-JS no reintenta el
     request al refrescar → el guardado se pierde). Es más honesto cerrar
     sesión y avisar → el usuario re-loguea y vuelve a guardar sabiendo
     que su último cambio no llegó. El refresh proactivo (60s antes de
     `expires_at`) sigue cubriendo el caso normal sin fricción. */
  useEffect(() => {
    const handler = async () => {
      if (!sessionRef.current) return; // Ya cerrada o nunca abierta.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      setSession(null);
      if (!expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true;
        sileo.error({
          title: 'Sesión expirada. Vuelve a iniciar sesión.',
        });
      }
    };
    window.addEventListener(AUTH_JWT_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_JWT_EXPIRED_EVENT, handler);
  }, []);

  /* ── Refresh proactivo del JWT ────────────────────────────────────────
     Programa un refresh 60s ANTES de que expire el token. Si el refresh
     falla, cerramos sesión local con aviso → AuthGuard redirige.
     Esto evita el caso "usuario lleva 1h capturando un formulario en primer
     plano, el token expira, hace Guardar y falla en silencio". */
  useEffect(() => {
    const expiresAt = session?.expires_at;
    if (!expiresAt) return;

    const nowMs = Date.now();
    const expMs = expiresAt * 1000;
    const leadMs = 60_000; // refrescar 1 min antes
    const delay = Math.max(0, expMs - nowMs - leadMs);

    const timer = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) throw error ?? new Error('refresh failed');
        setSession(data.session);
      } catch {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setSession(null);
        if (!expiredNotifiedRef.current) {
          expiredNotifiedRef.current = true;
          sileo.error({
            title: 'Sesión expirada. Vuelve a iniciar sesión.',
          });
        }
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [session?.expires_at]);

  /* ── Revalidación de sesión al volver a la app ─────────────────────
     Los timers de auto-refresh de Supabase se CONGELAN cuando la
     pestaña/PWA queda en segundo plano. Al volver, el JWT puede haber
     expirado sin que se emitiera SIGNED_OUT → la UI queda "zombie":
     con sesión vieja, las queries fallan y no se muestra nada.
     Aquí, al recuperar foco/visibilidad/conexión: si el token ya venció
     intentamos refrescarlo; si no se puede, cerramos sesión localmente
     (con aviso) → AuthGuard redirige a /login automáticamente. */
  useEffect(() => {
    let running = false;

    const revalidate = async () => {
      if (running) return;
      if (document.visibilityState === 'hidden') return;
      running = true;
      try {
        const { data } = await supabase.auth.getSession();
        let sess = data.session;
        const expired =
          !!sess?.expires_at && sess.expires_at * 1000 <= Date.now();

        if (sess && expired) {
          const { data: refreshed, error } = await supabase.auth.refreshSession();
          sess = error ? null : refreshed.session;
          if (!sess) {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            if (!expiredNotifiedRef.current) {
              expiredNotifiedRef.current = true;
              sileo.error({
                title: 'Sesión expirada. Vuelve a iniciar sesión.',
              });
            }
          }
        }
        setSession(sess);
      } finally {
        running = false;
      }
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('online', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('online', revalidate);
    };
  }, []);

  // Carga el profile y establece presencia según el usuario.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    let cancelled = false;
    let presenceChannel: RealtimeChannel | null = null;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, role, created_at, last_login_at')
          .eq('id', session!.user.id)
          .single();
        if (cancelled) return;
        if (error) {
          const msg = (error.message || '').toLowerCase();
          const code = ((error as { code?: string }).code || '').toLowerCase();
          // Red de seguridad: si el error de profile es JWT expirado y el
          // interceptor de fetch no lo cazó por lo que sea, forzamos el
          // handler de sesión expirada.
          if (
            msg.includes('jwt expired') ||
            msg.includes('expired') ||
            code === 'pgrst301' ||
            code === 'pgrst302' ||
            code === 'pgrst303'
          ) {
            window.dispatchEvent(new CustomEvent(AUTH_JWT_EXPIRED_EVENT));
          }
          console.warn('Profile fetch error:', error.message);
          setProfile(null);
          return;
        }
        setProfile(data as Profile);

        // Iniciar presencia
        presenceChannel = supabase.channel('online-users');
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            if (!presenceChannel) return;
            publishOnlineUserIds(extractOnlineUserIds(presenceChannel.presenceState()));
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && !cancelled) {
              await presenceChannel?.track({
                user_id: data.id,
                username: data.username,
                role: data.role,
                online_at: new Date().toISOString()
              });
            }
          });

      } catch (err) {
        console.warn('Profile fetch threw:', err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [session?.user?.id]);

  const signIn = useCallback(
    (username: string, password: string) => signInLib(username, password),
    []
  );

  const signOut = useCallback(async () => {
    await signOutLib();
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const username =
      profile?.username ?? emailToUsername(session?.user?.email ?? '');
    return {
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      username,
      loading,
      signIn,
      signOut,
    };
  }, [session, profile, profileLoading, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook para consumir el estado de auth desde cualquier componente. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
