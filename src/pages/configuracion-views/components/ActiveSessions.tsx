import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { listProfiles } from '@/lib/users';
import type { Profile } from '@/hooks/useAuth';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './ActiveSessions.css';

interface OnlineUser {
  user_id: string;
  username: string;
  role: string;
  online_at: string;
}

export function ActiveSessions() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const data = await listProfiles();
        if (mounted) {
          setProfiles(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching profiles', err);
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    // En lugar de suscribirnos otra vez al canal (lo que causa error en Supabase),
    // escuchamos el evento que emite useAuth.tsx
    const handlePresence = (e: CustomEvent<Set<string>>) => {
      if (mounted) {
        setOnlineUsers(e.detail);
      }
    };
    
    window.addEventListener('app_presence_update', handlePresence as EventListener);

    // Intentar leer el estado inicial si el canal ya está activo
    const existingChannel = supabase.getChannels().find(c => c.topic.includes('online-users'));
    if (existingChannel) {
      const state = existingChannel.presenceState();
      const onlineIds = new Set<string>();
      for (const id of Object.keys(state)) {
        const presences = state[id] as any[];
        for (const p of presences) {
          if (p.user_id) onlineIds.add(p.user_id);
        }
      }
      if (mounted) {
        setOnlineUsers(onlineIds);
      }
    }

    return () => {
      mounted = false;
      window.removeEventListener('app_presence_update', handlePresence as EventListener);
    };
  }, []);

  if (loading) {
    return null;
  }

  // Ordenar para que los online aparezcan arriba
  const sortedProfiles = [...profiles].sort((a, b) => {
    const aOnline = onlineUsers.has(a.id);
    const bOnline = onlineUsers.has(b.id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  return (
    <section className="active-sessions-section">
      <header className="active-sessions-header">
        <div className="active-sessions-title-wrap">
          <Activity className="active-sessions-icon" size={20} />
          <h3 className="type-heading-sm m-0">Sesiones Activas</h3>
        </div>
        {onlineUsers.size > 0 && (
          <span className="active-sessions-count">
            {onlineUsers.size} en línea
          </span>
        )}
      </header>
      
      <div className="active-sessions-list">
        {sortedProfiles.map(profile => {
          const isOnline = onlineUsers.has(profile.id);
          const lastLogin = profile.last_login_at 
            ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true, locale: es })
            : 'Nunca';

          return (
            <div key={profile.id} className="session-card">
              <div className="session-name-col">
                <span className="session-username type-body-md-bold">
                  {profile.display_name || profile.username}
                </span>
              </div>
              <div className="session-role-col">
                <span className={`role-badge role-badge--${profile.role?.toLowerCase() || 'default'}`}>
                  <span className="session-role">{profile.role}</span>
                </span>
              </div>
              
              <div className="session-status-col">
                {isOnline ? (
                  <span className="status-pill status-pill--online">
                    <span className="status-pill__dot"></span>
                    <span className="status-pill__text">En línea</span>
                  </span>
                ) : (
                  <span className="status-pill status-pill--offline">
                    <Clock size={12} className="status-pill__icon" />
                    <span className="status-pill__text">{lastLogin}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
