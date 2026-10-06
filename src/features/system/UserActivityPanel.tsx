import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ButtonUtility } from "@/components/ui/ButtonUtility";
import type { Profile } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscribeOnlineUserIds } from "@/lib/presence";
import { supabase } from "@/lib/supabase";
import { listProfiles } from "@/lib/users";
import "./UserActivityPanel.css";

function formatLastAccess(value: string | null | undefined, now: number, language: "es" | "en") {
  if (!value) return language === "en" ? "No access" : "Sin acceso";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "en" ? "Unknown" : "Desconocido";

  const safeDate = date.getTime() > now ? new Date(now) : date;
  const distance = formatDistanceToNow(safeDate, {
    addSuffix: true,
    locale: language === "en" ? enUS : es,
  }).replace(/alrededor de |casi |más de /g, "");

  return distance.charAt(0).toUpperCase() + distance.slice(1);
}

function formatCompactLastAccess(lastAccess: string, language: "es" | "en") {
  if (language === "en") {
    return lastAccess
      .replace(/^about /i, "")
      .replace(/ ago$/i, "")
      .replace(/^less than a minute$/i, "<1 min")
      .replace(/ minutes?$/, " min")
      .replace(/ hours?$/, " h")
      .replace(/ days?$/, " d");
  }
  if (!lastAccess.startsWith("Hace ")) return lastAccess;

  return lastAccess
    .slice(5)
    .replace("menos de un minuto", "<1 min")
    .replace(/ minutos?$/, " min")
    .replace(/ horas?$/, " h")
    .replace(/ días?$/, " d");
}

export function UserActivityPanel() {
  const { language } = useLanguage();
  const english = language === "en";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
          language === "en" ? "en" : "es",
        );
      }),
    [language, profiles, onlineUsers],
  );

  if (loading) {
    return (
      <div className="user-activity-panel__state" aria-busy="true">
        <p className="type-body-sm text-muted" role="status">
          {english ? "Loading activity…" : "Cargando actividad…"}
        </p>
      </div>
    );
  }

  return (
    <section className="user-activity-panel" aria-label={english ? "User activity" : "Actividad de usuarios"}>
      <ul className="user-activity-panel__list">
        {error && (
          <li className="user-activity-panel__state" role="alert">
            <p className="type-body-sm text-muted">
              {english && error === "No fue posible cargar la lista de usuarios."
                ? "Could not load the user list."
                : error}
            </p>
            <ButtonUtility
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              {english ? "Retry" : "Reintentar"}
            </ButtonUtility>
          </li>
        )}

        {!error && sortedProfiles.length === 0 && (
          <li className="user-activity-panel__state type-body-sm text-muted">
            {english ? "No profiles are available." : "No hay perfiles disponibles."}
          </li>
        )}

        {sortedProfiles.map((profile) => {
          const isOnline = onlineUsers.has(profile.id);
          const lastAccess = formatLastAccess(profile.last_login_at, now, language);

          return (
            <li key={profile.id} className="user-activity-panel__card">
              <span className="user-activity-panel__name type-label-sm">
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
                    {english ? "Online" : "En línea"}
                  </>
                ) : (
                  <>
                    <Clock
                      className="user-activity-panel__status-icon"
                      aria-hidden="true"
                    />
                    <span aria-hidden="true">{formatCompactLastAccess(lastAccess, language)}</span>
                    <span className="sr-only">{lastAccess}</span>
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
