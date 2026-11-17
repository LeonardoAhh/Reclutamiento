import { useMemo } from 'react';
import { SECTION_CONFIGS, VISIBLE_SECTIONS } from './constants';
import { isIncidence } from './helpers';
import { getReportDayHeading } from './reportDayHeading';
import type { AreaStaffSummary, ReporteRow } from './types';

interface ReportDayDetailsInput {
  selectedRows: ReporteRow[];
  selectedDay: string;
  selectedArea: string | null;
  currentMonth: string;
  en: boolean;
  dayHeaders: string[];
  dayAusentismoPct: Record<string, number>;
  daySummaries: Record<string, number>;
}

export function useReportDayDetails({ selectedRows, selectedDay, selectedArea, currentMonth, en, dayHeaders, dayAusentismoPct, daySummaries }: ReportDayDetailsInput) {
  const selectedDayAreaSummary = useMemo<AreaStaffSummary[]>(() => {
    if (!selectedDay)
      return SECTION_CONFIGS.filter((sec) =>
        VISIBLE_SECTIONS.has(sec.seccion),
      ).map((sec) => ({
        area: sec.seccion,
        personal_activo: 0,
        personal_autorizado: sec.personal_autorizado,
        personal_incidencia: 0,
        personal_real: sec.personal_autorizado,
        operadores_autorizados: sec.operadores_autorizados,
        operadores_contratados: 0,
        operadores_incidencia: 0,
      }));

    let dayOfWeek = -1;
    if (currentMonth && selectedDay) {
      const [year, month] = currentMonth.split("-").map(Number);
      dayOfWeek = new Date(year, month - 1, parseInt(selectedDay, 10)).getDay();
    }

    return SECTION_CONFIGS.filter((sec) =>
      VISIBLE_SECTIONS.has(sec.seccion),
    ).map((sec) => {
      const rowsInSection = selectedRows.filter((row) => {
        const effectiveSection = VISIBLE_SECTIONS.has(row.area)
          ? row.area
          : row.departamento;
        return effectiveSection === sec.seccion;
      });
      const personal_activo = rowsInSection.length;
      const personal_incidencia = rowsInSection.reduce((count, row) => {
        return count + (isIncidence(row.days[selectedDay]) ? 1 : 0);
      }, 0);

      const operadoresRows = rowsInSection.filter(
        (row) =>
          row.puesto &&
          row.puesto.toUpperCase().includes("OPERADOR DE MÁQUINA"),
      );
      const operadores_contratados = operadoresRows.length;
      const operadores_incidencia = operadoresRows.reduce((count, row) => {
        return count + (isIncidence(row.days[selectedDay]) ? 1 : 0);
      }, 0);

      // Lógica de descanso para turnos de producción
      let is_descanso = false;
      if (dayOfWeek !== -1) {
        if ((sec.seccion === "PRODUCCIÓN 1ER. TURNO" || sec.seccion === "PRODUCCIÓN 1ER. TURNO (STARLITE)") && dayOfWeek === 0)
          is_descanso = true;
        else if (
          sec.seccion === "PRODUCCIÓN 2o. TURNO" &&
          (dayOfWeek === 1 || dayOfWeek === 2)
        )
          is_descanso = true;
        else if (
          sec.seccion === "PRODUCCIÓN 3ER. TURNO" &&
          (dayOfWeek === 3 || dayOfWeek === 4)
        )
          is_descanso = true;
        else if (
          sec.seccion === "PRODUCCIÓN 4o. TURNO" &&
          (dayOfWeek === 5 || dayOfWeek === 6)
        )
          is_descanso = true;
      }

      return {
        area: sec.seccion,
        personal_activo,
        personal_autorizado: sec.personal_autorizado,
        operadores_autorizados: sec.operadores_autorizados,
        operadores_contratados,
        operadores_incidencia,
        personal_incidencia,
        personal_real: Math.max(personal_activo - personal_incidencia, 0),
        is_descanso,
      };
    });
  }, [selectedRows, selectedDay, currentMonth]);

  const selectedAreaDetailRows = useMemo(() => {
    if (!selectedDay || !selectedArea) return [];

    const seen = new Set<string>();
    return selectedRows
      .filter((row) => {
        const effectiveSection = VISIBLE_SECTIONS.has(row.area)
          ? row.area
          : row.departamento;
        return (
          effectiveSection === selectedArea &&
          isIncidence(row.days[selectedDay])
        );
      })
      .filter((row) => {
        if (seen.has(row.numero_empleado)) return false;
        seen.add(row.numero_empleado);
        return true;
      })
      .map((row, idx) => ({
        key: `${row.numero_empleado}||${row.area}||${idx}`,
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        departamento: row.departamento,
        area: row.area,
        puesto: row.puesto,
        turno: row.turno || "-",
        tipo_incidencia: row.days[selectedDay] || "-",
      }));
  }, [selectedRows, selectedDay, selectedArea]);

  const daysWithData = useMemo(() => {
    return dayHeaders.filter(
      (day) =>
        dayAusentismoPct[day] !== undefined || (daySummaries[day] ?? 0) > 0,
    );
  }, [dayHeaders, dayAusentismoPct, daySummaries]);

  const currentDayIndex = selectedDay ? daysWithData.indexOf(selectedDay) : -1;
  const prevDay =
    currentDayIndex > 0 ? daysWithData[currentDayIndex - 1] : null;
  const nextDay =
    currentDayIndex !== -1 && currentDayIndex < daysWithData.length - 1
      ? daysWithData[currentDayIndex + 1]
      : null;

  const selectedDateHeading = useMemo(
    () => getReportDayHeading(currentMonth, selectedDay, en),
    [selectedDay, currentMonth, en],
  );

  return { selectedDayAreaSummary, selectedAreaDetailRows, prevDay, nextDay, selectedDateHeading };
}
