import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";
import { ACTIVIDADES_PATH } from "./navigation";

const SESSION_NOTICE_ID = "pending-activities";

export function SessionNotice({ onInitialNoticeResolved }: { onInitialNoticeResolved: () => void }) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const viewingActivities = pathname === ACTIVIDADES_PATH;
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    if (viewingActivities) {
      setTaskCount(0);
      toast.dismiss(SESSION_NOTICE_ID);
      sessionStorage.setItem("notified_activities", "true");
      onInitialNoticeResolved();
      return;
    }

    let active = true;

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

        const { count, error } = await query;
        if (!active) return;

        if (error) {
          console.error(error);
          onInitialNoticeResolved();
          return;
        }
        if (count && count > 0) {
          setTaskCount(count);
        } else {
          sessionStorage.setItem("notified_activities", "true");
          onInitialNoticeResolved();
        }
      };

      void checkTasks().catch((error: unknown) => {
        if (!active) return;
        console.error(error);
        onInitialNoticeResolved();
      });
    } else {
      onInitialNoticeResolved();
    }

    // 2. Soporte en tiempo real para nuevas asignaciones
    const channel = supabase
      .channel("realtime_activities_notice")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          if (!active) return;
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
      active = false;
      supabase.removeChannel(channel);
    };
  }, [onInitialNoticeResolved, profile, viewingActivities]);

  useEffect(() => {
    if (viewingActivities || taskCount <= 0) return;

    toast.info({
      id: SESSION_NOTICE_ID,
      title: language === 'en'
        ? `${taskCount} pending ${taskCount === 1 ? 'activity' : 'activities'}`
        : `${taskCount} ${taskCount === 1 ? 'actividad pendiente' : 'actividades pendientes'}`,
    });
    sessionStorage.setItem("notified_activities", "true");
    onInitialNoticeResolved();
  }, [onInitialNoticeResolved, taskCount, viewingActivities, language]);

  return null;
}
