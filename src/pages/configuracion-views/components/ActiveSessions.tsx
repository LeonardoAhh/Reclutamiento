import { useEffect, useMemo, useState } from "react";
import { listProfiles, ROLE_LABEL } from "@/lib/users";
import { subscribeOnlineUserIds } from "@/lib/presence";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/hooks/useAuth";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import { Activity, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { RoleBadge, Badge } from "@/components/ui/Badge";
import "./ActiveSessions.css";

function formatLastAccess(value: string | null | undefined) {
  if (!value) return "Sin acceso";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Desconocido";

  // Prevenir tiempos en el futuro por desajustes de reloj entre cliente y servidor
  const now = Date.now();
  const safeDate = date.getTime() > now ? new Date(now) : date;

  let distance = formatDistanceToNow(safeDate, { addSuffix: true, locale: es });
  distance = distance.replace(/alrededor de |casi |más de /g, "");
  return distance.charAt(0).toUpperCase() + distance.slice(1);
}
export function ActiveSessions() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    async function fetchData() {
      try {
        const data = await listProfiles();
        if (mounted) setProfiles(data);
      } catch (err) {
        console.warn("Error fetching profiles", err);
        if (mounted) setError("No fue posible cargar la lista de usuarios.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchData();
    const unsubscribe = subscribeOnlineUserIds((userIds) => {
      if (mounted) setOnlineUsers(userIds);
    });

    // Suscripción en tiempo real a los cambios en profiles (last_login_at, roles, etc.)
    const channel = supabase
      .channel('active-sessions-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (mounted) {
            if (payload.eventType === 'UPDATE') {
              setProfiles((prev) =>
                prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
              );
            } else if (payload.eventType === 'INSERT') {
              setProfiles((prev) => [...prev, payload.new as Profile]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [reloadKey]);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => {
        const aOnline = onlineUsers.has(a.id);
        const bOnline = onlineUsers.has(b.id);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        return (a.display_name || a.username).localeCompare(
          b.display_name || b.username,
          "es",
        );
      }),
    [profiles, onlineUsers],
  );

  const onlineCount = useMemo(
    () => profiles.filter((profile) => onlineUsers.has(profile.id)).length,
    [profiles, onlineUsers],
  );

  if (loading) {
    return (
      <section className="active-sessions-section" aria-busy="true">
        <p
          className="active-sessions-state type-body-sm text-muted"
          role="status"
        >
          Cargando sesiones…
        </p>
      </section>
    );
  }

  return (
    <section className="active-sessions-section">
      <header className="active-sessions-header">
        <div className="active-sessions-title-wrap">
          <Activity className="active-sessions-icon" aria-hidden="true" />
          <div>
            <h3 className="type-heading-sm m-0">Actividad de usuarios</h3>
            <p className="active-sessions-caption type-caption-sm text-muted"></p>
          </div>
        </div>
        {onlineCount > 0 && (
          <Badge variant="success">{onlineCount} en línea</Badge>
        )}
      </header>

      <ul className="active-sessions-list">
        {error && (
          <li className="active-sessions-state" role="alert">
            <p className="type-body-sm text-muted">{error}</p>
            <ButtonUtility
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Reintentar
            </ButtonUtility>
          </li>
        )}
        {!error && sortedProfiles.length === 0 && (
          <li className="active-sessions-state type-body-sm text-muted">
            No hay perfiles disponibles.
          </li>
        )}
        {!error && sortedProfiles.length > 0 && (
          <li className="active-sessions-list-header type-caption-sm text-muted" aria-hidden="true">
            <div className="header-name-col">Nombre</div>
            <div className="header-role-col">Rol</div>
            <div className="header-status-col">Estado</div>
          </li>
        )}
        {sortedProfiles.map((profile) => {
          const isOnline = onlineUsers.has(profile.id);
          const lastAccess = formatLastAccess(profile.last_login_at);
          const roleLabel = ROLE_LABEL[profile.role] ?? profile.role;

          return (
            <li key={profile.id} className="session-card">
              <div className="session-name-col">
                <span className="session-username type-body-md-bold">
                  {profile.display_name || profile.username}
                </span>
              </div>
              <div className="session-role-col">
                <RoleBadge role={profile.role || "default"} label={roleLabel} />
              </div>

              <div className="session-status-col">
                {isOnline ? (
                  <Badge variant="success">En línea</Badge>
                ) : (
                  <Badge variant="default">
                    <Clock size={12} aria-hidden="true" />
                    {lastAccess}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
