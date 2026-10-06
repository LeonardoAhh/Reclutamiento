import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { TransitionLoader } from '@/components/ui/TransitionLoader';
import { toast } from '@/lib/notify';
import { isBoneyardBuild } from '@/lib/boneyard';
import { listTeamMembers } from './api';
import { findTeamMember, type TeamMember } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import { teamCopy, translateTeamMessage } from './translations';

interface TeamDirectory {
  members: TeamMember[];
  refresh: () => Promise<void>;
  resolve: (name: string | null | undefined) => TeamMember | undefined;
}
const TeamContext = createContext<TeamDirectory | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  // La captura de esqueletos sin sesión no representa integrantes reales.
  if (isBoneyardBuild()) return <TeamContext.Provider value={{ members: [], refresh: async () => {}, resolve: () => undefined }}>{children}</TeamContext.Provider>;
  return <AuthenticatedTeamProvider>{children}</AuthenticatedTeamProvider>;
}

function AuthenticatedTeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = teamCopy(language);
  const languageRef = useRef(language);
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState('');
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    try {
      const rows = await listTeamMembers();
      if (version !== request.current) return;
      setMembers(rows);
      setError('');
    } catch (cause) {
      if (version === request.current) setError(cause instanceof Error
        ? cause.message
        : 'No se pudo cargar el equipo. Comprueba la conexión y la migración del catálogo.');
      throw cause;
    }
  }, []);

  useEffect(() => {
    setMembers(null);
    void refresh().catch(() => { /* El error se presenta con reintento. */ });
    const channel = supabase.channel(`team-directory-${user?.id ?? 'build'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recruiter_directory' }, () => {
        void refresh().catch(() => { /* El estado conserva el error visible. */ });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recruiter_aliases' }, () => {
        void refresh().catch(() => { /* El estado conserva el error visible. */ });
      }).subscribe();
    const onFocus = () => { void refresh().catch(() => { /* Se conserva el catálogo y se presenta el error. */ }); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      request.current++; void supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [user?.id, refresh]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (error && members) {
      const currentLanguage = languageRef.current;
      toast.error({
        title: currentLanguage === 'en' ? 'Could not update the team' : 'No se pudo actualizar el equipo',
        description: translateTeamMessage(error, currentLanguage),
      });
    }
  }, [error, members]);

  const value = useMemo(() => ({ members: members ?? [], refresh,
    resolve: (name: string | null | undefined) => findTeamMember(members ?? [], name),
  }), [members, refresh]);

  if (error && !members) return <main className="container container--compact">
    <h1 className="app-page-title">{copy.titleUnavailable}</h1>
    <p role="alert">{translateTeamMessage(error, language)}</p>
    <button type="button" className="btn-primary" onClick={() => void refresh().catch(() => {})}>{copy.retry}</button>
  </main>;
  if (!members) return <TransitionLoader title={copy.loadingPage} />;
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeamDirectory() {
  const value = useContext(TeamContext);
  if (!value) throw new Error('El catálogo de equipo requiere TeamProvider.');
  return value;
}
