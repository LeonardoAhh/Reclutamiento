import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBajas } from "@/hooks/useBajas";
import { useCandidates } from "@/hooks/useCandidates";
import { useDismissedPositions } from "@/hooks/useDismissedPositions";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { usePositions } from "@/lib/positions";
import { calculatePositionCoverage } from "@/lib/utils";
import {
  formatIsoWeekRange,
  isInIsoWeek,
  isoWeekOf,
  localTodayIso,
} from "@/lib/dates";
import { calculateWorkforceProjection } from "@/lib/workforceProjection";
import type { Baja, Candidate, Employee } from "@/lib/types";

/**
 * Datos derivados de /overview. Conserva los cálculos existentes de la vista:
 * semanas ISO, ingresos, bajas, pipeline, cobertura y proyección de plantilla.
 */
export function useOverviewData() {
  const { language } = useLanguage();
  const en = language === "en";
  const { employees, comments, loading: employeesLoading } = useSupabaseData();
  const { candidates, loading: candidatesLoading } = useCandidates();
  const { bajas, loading: bajasLoading } = useBajas();
  const { positions, loading: positionsLoading } = usePositions();
  const { dismissedKeys } = useDismissedPositions();
  const [weekOffset, setWeekOffset] = useState(0);

  // Stale-while-revalidate: el skeleton solo cubre la primera carga sin datos;
  // las revalidaciones en segundo plano no vuelven a ocultar la página.
  const loading =
    (employeesLoading && employees.length === 0) ||
    (candidatesLoading && candidates.length === 0) ||
    (bajasLoading && bajas.length === 0) ||
    (positionsLoading && positions.length === 0);

  /* ── Semana ISO actual + semana anterior ──────────────────── */
  const currentWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return isoWeekOf(d);
  }, [weekOffset]);

  const currentWeekLabel = useMemo(
    () => formatIsoWeekRange(currentWeek, en ? "en-US" : "es-MX"),
    [currentWeek, en],
  );

  const previousWeek = useMemo(
    () =>
      isoWeekOf(new Date(currentWeek.start.getTime() - 24 * 60 * 60 * 1000)),
    [currentWeek],
  );

  const previousWeekLabel = useMemo(
    () => formatIsoWeekRange(previousWeek, en ? "en-US" : "es-MX"),
    [previousWeek, en],
  );

  const weeklyHires: Employee[] = useMemo(() => {
    const today = localTodayIso();
    return employees
      .filter(
        (e) =>
          isInIsoWeek(e.fecha_ingreso, currentWeek) &&
          String(e.fecha_ingreso).localeCompare(today) <= 0,
      )
      .sort((a, b) =>
        String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
      );
  }, [employees, currentWeek]);

  const weeklyBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, currentWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, currentWeek],
  );

  const previousWeekHires: Employee[] = useMemo(
    () =>
      employees
        .filter((e) => isInIsoWeek(e.fecha_ingreso, previousWeek))
        .sort((a, b) =>
          String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
        ),
    [employees, previousWeek],
  );

  const previousWeekBajas: Baja[] = useMemo(
    () =>
      bajas
        .filter((b) => isInIsoWeek(b.fecha_baja, previousWeek))
        .sort((a, b) => a.fecha_baja.localeCompare(b.fecha_baja)),
    [bajas, previousWeek],
  );

  const weeklyFutureHires: Employee[] = useMemo(() => {
    const today = localTodayIso();
    return employees
      .filter(
        (e) =>
          isInIsoWeek(e.fecha_ingreso, currentWeek) &&
          String(e.fecha_ingreso).localeCompare(today) > 0,
      )
      .sort((a, b) =>
        String(a.fecha_ingreso).localeCompare(String(b.fecha_ingreso)),
      );
  }, [employees, currentWeek]);

  /* ── Candidatos visibles ───────────────────────────────────── */
  const candidatesInProcess: Candidate[] = useMemo(
    () =>
      candidates.filter(
        (c) =>
          c.status === "entrega_documentos" ||
          c.status === "faltan_documentos" ||
          c.status === "feedback_pendiente",
      ),
    [candidates],
  );

  const candidatesCitadosHoy: Candidate[] = useMemo(() => {
    const today = localTodayIso();
    return candidates.filter(
      (c) => c.status === "entrevista" && (c.fecha_cita ?? "") === today,
    );
  }, [candidates]);

  const candidateTotals = useMemo(() => {
    const enProceso = candidatesInProcess.length;
    const citadosHoy = candidatesCitadosHoy.length;
    return { enProceso, citadosHoy };
  }, [candidatesInProcess, candidatesCitadosHoy]);

  /* ── Cobertura para el detalle de puestos pendientes ──────── */
  const currentPositionCoverage = useMemo(() => {
    return calculatePositionCoverage(employees, comments, positions);
  }, [employees, comments, positions]);

  /* ── Proyección Estratégica ───────────────────────────────── */
  const todayIso = useMemo(() => localTodayIso(), []);

  const projectionTotals = useMemo(
    () => calculateWorkforceProjection(employees, positions, todayIso, dismissedKeys),
    [employees, positions, todayIso, dismissedKeys],
  );

  return {
    loading,
    employees,
    bajas,
    positions,
    dismissedKeys,
    currentPositionCoverage,
    projectionTotals,
    weekOffset,
    setWeekOffset,
    currentWeek,
    currentWeekLabel,
    previousWeek,
    previousWeekLabel,
    weeklyHires,
    weeklyBajas,
    previousWeekHires,
    previousWeekBajas,
    weeklyFutureHires,
    candidatesInProcess,
    candidatesCitadosHoy,
    candidateTotals,
    todayIso,
  };
}
