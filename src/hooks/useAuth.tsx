import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(true);

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

  // Carga el profile cuando hay session.
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, role, created_at, last_login_at')
          .eq('id', session!.user.id)
          .single();
        if (cancelled) return;
        if (error) {
          console.warn('Profile fetch error:', error.message);
          setProfile(null);
          return;
        }
        setProfile(data as Profile);
      } catch (err) {
        console.warn('Profile fetch threw:', err);
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

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
      username,
      loading,
      signIn,
      signOut,
    };
  }, [session, profile, loading, signIn, signOut]);

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
