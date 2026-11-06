import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/notify";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ActivityType } from "@/lib/types";
import { ACTIVIDADES_PATH } from "./navigation";

const SESSION_NOTICE_ID = "pending-activities";

type PendingActivityCounts = {
  vacancy: number;
  activity: number;
  responsibility: number;
};

const EMPTY_PENDING_COUNTS: PendingActivityCounts = {
  vacancy: 0,
  activity: 0,
  responsibility: 0,
};

function getPendingActivityCategory(type: ActivityType | null | undefined): keyof PendingActivityCounts {
  if (type === 'vacante') return 'vacancy';
  if (type === 'rutinaria') return 'responsibility';
  return 'activity';
}

function countPendingActivities(
  rows: readonly { tipo: ActivityType | null }[],
): PendingActivityCounts {
  return rows.reduce<PendingActivityCounts>((counts, row) => {
    counts[getPendingActivityCategory(row.tipo)] += 1;
    return counts;
  }, { ...EMPTY_PENDING_COUNTS });
}

function formatPendingActivityNotice(counts: PendingActivityCounts, english: boolean): string {
  const entries = [
    {
      count: counts.vacancy,
      spanish: counts.vacancy === 1 ? 'vacante pendiente' : 'vacantes pendientes',
      english: counts.vacancy === 1 ? 'pending vacancy' : 'pending vacancies',
    },
    {
      count: counts.activity,
      spanish: counts.activity === 1 ? 'actividad pendiente' : 'actividades pendientes',
      english: counts.activity === 1 ? 'pending activity' : 'pending activities',
    },
    {
      count: counts.responsibility,
      spanish: counts.responsibility === 1 ? 'responsabilidad pendiente' : 'responsabilidades pendientes',
      english: counts.responsibility === 1 ? 'pending responsibility' : 'pending responsibilities',
    },
  ];

  return entries
    .filter(({ count }) => count > 0)
    .map(({ count, spanish, english: englishLabel }) =>
      `${count} ${english ? englishLabel : spanish}`,
    )
    .join(' · ');
}

export function SessionNotice({ onInitialNoticeResolved }: { onInitialNoticeResolved: () => void }) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const viewingActivities = pathname === ACTIVIDADES_PATH;
  const [pendingCounts, setPendingCounts] = useState(EMPTY_PENDING_COUNTS);

  useEffect(() => {
    if (!profile) return;
    if (viewingActivities) {
      setPendingCounts(EMPTY_PENDING_COUNTS);
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
          .select("tipo")
          .eq("estado", "pendiente");

        // Solo notificar si se crearon actividades DESPUÉS de la última vez que revisó
        const lastVisit = localStorage.getItem("last_activities_visit");
        if (lastVisit) {
          query = query.gt("created_at", lastVisit);
        }

        if (profile.role === "reclutador") {
          query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
        }

        const { data, error } = await query;
        if (!active) return;

        if (error) {
          console.error(error);
          onInitialNoticeResolved();
          return;
        }
        const counts = countPendingActivities(
          (data ?? []) as Array<{ tipo: ActivityType | null }>,
        );
        if (counts.vacancy + counts.activity + counts.responsibility > 0) {
          setPendingCounts(counts);
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
          const newAct = payload.new as {
            asignado_a?: string | null;
            estado?: string;
            tipo?: ActivityType | null;
          };

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
            const category = getPendingActivityCategory(newAct.tipo);
            setPendingCounts((previous) => ({
              ...previous,
              [category]: previous[category] + 1,
            }));
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
    const taskCount = pendingCounts.vacancy + pendingCounts.activity + pendingCounts.responsibility;
    if (viewingActivities || taskCount <= 0) return;

    toast.info({
      id: SESSION_NOTICE_ID,
      title: formatPendingActivityNotice(pendingCounts, language === 'en'),
    });
    sessionStorage.setItem("notified_activities", "true");
    onInitialNoticeResolved();
  }, [onInitialNoticeResolved, pendingCounts, viewingActivities, language]);

  return null;
}
