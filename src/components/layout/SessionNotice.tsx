import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notify";

const SESSION_NOTICE_ID = "pending-activities";

export function SessionNotice() {
  const { profile } = useAuth();
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // 1. Carga inicial (solo 1 vez por sesión)
    if (!sessionStorage.getItem("notified_activities")) {
      const checkTasks = async () => {
        let query = supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente");

        // Solo notificar si se crearon actividades DESPUÉS de la última vez que revisó
        const lastVisit = localStorage.getItem("last_activities_visit");
        if (lastVisit) {
          query = query.gt("created_at", lastVisit);
        }

        if (profile.role === "reclutador") {
          query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
        }

        const { count } = await query;

        if (count && count > 0) {
          setTaskCount(count);
        } else {
          sessionStorage.setItem("notified_activities", "true");
        }
      };

      checkTasks();
    }

    // 2. Soporte en tiempo real para nuevas asignaciones
    const channel = supabase
      .channel("realtime_activities_notice")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          const newAct = payload.new as any;

          if (profile.role === "reclutador") {
            // Si la actividad no es para el reclutador ni es para todo el equipo, ignoramos
            if (
              newAct.asignado_a !== profile.id &&
              newAct.asignado_a !== null
            ) {
              return;
            }
          }

          if (newAct.estado === "pendiente") {
            setTaskCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  useEffect(() => {
    if (taskCount <= 0) return;

    toast.info({
      id: SESSION_NOTICE_ID,
      title: `${taskCount} ${
        taskCount === 1 ? "actividad pendiente" : "actividades pendientes"
      }`,
    });
    sessionStorage.setItem("notified_activities", "true");
  }, [taskCount]);

  return null;
}
