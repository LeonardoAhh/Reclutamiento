import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import type { Profile } from "@/hooks/useAuth";
import { subscribeOnlineUserIds } from "@/lib/presence";
import { supabase } from "@/lib/supabase";
import { listProfiles } from "@/lib/users";
import "./UserActivityPanel.css";

function formatLastAccess(value: string | null | undefined) {
  if (!value) return "Sin acceso";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Desconocido";

  const now = Date.now();
  const safeDate = date.getTime() > now ? new Date(now) : date;
  const distance = formatDistanceToNow(safeDate, {
    addSuffix: true,
    locale: es,
  }).replace(/alrededor de |casi |más de /g, "");

  return distance.charAt(0).toUpperCase() + distance.slice(1);
}

export function UserActivityPanel() {
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
      } catch (caught) {
        console.warn("Error fetching profiles", caught);
        if (mounted) setError("No fue posible cargar la lista de usuarios.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchData();
    const unsubscribe = subscribeOnlineUserIds((userIds) => {
      if (mounted) setOnlineUsers(userIds);
    });

    const channel = supabase
      .channel("active-sessions-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === "UPDATE") {
            setProfiles((current) =>
              current.map((profile) =>
                profile.id === payload.new.id
                  ? { ...profile, ...payload.new }
                  : profile,
              ),
            );
          } else if (payload.eventType === "INSERT") {
            setProfiles((current) => [...current, payload.new as Profile]);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [reloadKey]);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((first, second) => {
        const firstOnline = onlineUsers.has(first.id);
        const secondOnline = onlineUsers.has(second.id);
        if (firstOnline !== secondOnline) return firstOnline ? -1 : 1;
        return (first.display_name || first.username).localeCompare(
          second.display_name || second.username,
          "es",
        );
      }),
    [profiles, onlineUsers],
  );

  if (loading) {
    return (
      <div className="user-activity-panel__state" aria-busy="true">
        <p className="type-body-sm text-muted" role="status">
          Cargando actividad…
        </p>
      </div>
    );
  }

  return (
    <section className="user-activity-panel" aria-label="Actividad de usuarios">
      <ul className="user-activity-panel__list">
        {error && (
          <li className="user-activity-panel__state" role="alert">
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
          <li className="user-activity-panel__state type-body-sm text-muted">
            No hay perfiles disponibles.
          </li>
        )}

        {sortedProfiles.map((profile) => {
          const isOnline = onlineUsers.has(profile.id);

          return (
            <li key={profile.id} className="user-activity-panel__card">
              <span className="user-activity-panel__name type-body-md-bold">
                {profile.display_name || profile.username}
              </span>
              <span
                className={`user-activity-panel__status type-body-sm${
                  isOnline ? " user-activity-panel__status--online" : ""
                }`}
              >
                {isOnline ? (
                  <>
                    <span
                      className="user-activity-panel__online-dot"
                      aria-hidden="true"
                    />
                    En línea
                  </>
                ) : (
                  <>
                    <Clock
                      className="user-activity-panel__status-icon"
                      aria-hidden="true"
                    />
                    {formatLastAccess(profile.last_login_at)}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
