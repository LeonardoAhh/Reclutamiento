import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/notify";
import {
  createDailyWorkActivity,
  fetchDailyWorkActivities,
  fetchDailyWorkRecruiters,
  updateDailyWorkActivity,
  uploadDailyWorkFiles,
} from "./api";
import type {
  DailyWorkActivity,
  DailyWorkActivityDraft,
  DailyWorkRecruiter,
} from "./types";

interface UseDailyWorkLogOptions {
  userId?: string;
  role?: string;
  workDate: string;
  recruiterId: string;
}

export function useDailyWorkLog({
  userId,
  role,
  workDate,
  recruiterId,
}: UseDailyWorkLogOptions) {
  const [activities, setActivities] = useState<DailyWorkActivity[]>([]);
  const [recruiters, setRecruiters] = useState<DailyWorkRecruiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadActivities = useCallback(async () => {
    if (!userId || (role !== "admin" && role !== "reclutador")) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rows = await fetchDailyWorkActivities(
        workDate,
        role === "admin" ? recruiterId || undefined : userId,
      );
      if (requestId === requestIdRef.current) setActivities(rows);
    } catch {
      if (requestId === requestIdRef.current) {
        setErrorMessage("No pudimos cargar la bitácora. Inténtalo nuevamente.");
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [recruiterId, role, userId, workDate]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (role !== "admin") {
      setRecruiters([]);
      return;
    }

    let cancelled = false;
    fetchDailyWorkRecruiters()
      .then((rows) => {
        if (!cancelled) setRecruiters(rows);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error({
            title: "No pudimos cargar la lista de reclutadores.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const saveActivity = useCallback(
    async (draft: DailyWorkActivityDraft): Promise<boolean> => {
      if (!userId || role !== "reclutador" || isSaving) return false;

      setIsSaving(true);
      try {
        const input = {
          workDate: draft.workDate,
          description: draft.description,
          startTime: draft.startTime,
          endTime: draft.endTime,
        };
        let activityId = draft.id;
        if (activityId) {
          await updateDailyWorkActivity(activityId, input);
        } else {
          activityId = await createDailyWorkActivity(userId, input);
        }

        const uploads = await uploadDailyWorkFiles(
          activityId,
          userId,
          draft.files,
        );

        if (uploads.failedFileNames.length > 0) {
          toast.warning({
            title: draft.id
              ? "Actividad actualizada con adjuntos pendientes"
              : "Actividad guardada con adjuntos pendientes",
            description: `${uploads.failedFileNames.length} archivo(s) no pudieron subirse. Puedes volver a intentarlo al editar.`,
          });
        } else {
          toast.success({
            title: draft.id ? "Actividad actualizada" : "Actividad registrada",
          });
        }

        if (draft.workDate === workDate) await loadActivities();
        return true;
      } catch {
        toast.error({
          title: draft.id
            ? "No pudimos actualizar la actividad."
            : "No pudimos registrar la actividad.",
          description: "Conservamos la información para que vuelvas a intentarlo.",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    }, [isSaving, loadActivities, role, userId, workDate],
  );

  return {
    activities,
    recruiters,
    isLoading,
    isSaving,
    errorMessage,
    refresh: loadActivities,
    saveActivity,
  };
}
