import { useMemo } from 'react';
import { format, getISOWeek } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { INCIDENT_TABS, SECTION_CONFIGS, VISIBLE_SECTIONS } from './constants';
import { isIncidence, isIncidentTab } from './helpers';
import type { AreaStaffSummary, EmployeeRef, IncidentTab, ReporteRow } from './types';

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
  const emptyIncident = () =>
    INCIDENT_TABS.reduce(
      (acc, c) => ({ ...acc, [c]: [] as EmployeeRef[] }),
      {} as Record<IncidentTab, EmployeeRef[]>,
    );

  const selectedDayIncidentSummary = useMemo(() => {
    const base = emptyIncident();
    if (!selectedDay) return base;
    const result = selectedRows.reduce((acc, row, idx) => {
      const code = row.days[selectedDay];
      if (!isIncidence(code) || !isIncidentTab(code!)) return acc;
      acc[code].push({
        key: `${code}||${row.departamento}||${row.area}||${row.turno || "-"}||${row.numero_empleado}||${idx}`,
        numero_empleado: row.numero_empleado,
        nombre: row.nombre,
        departamento: row.departamento,
        area: row.area,
        puesto: row.puesto,
        turno: row.turno || "-",
      });
      return acc;
    }, base);
    for (const tab of INCIDENT_TABS) {
      result[tab].sort((a, b) => a.area.localeCompare(b.area));
    }
    return result;
  }, [selectedRows, selectedDay]);

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

  const selectedDayCounts = useMemo(() => {
    const base = INCIDENT_TABS.reduce(
      (acc, c) => ({ ...acc, [c]: 0 }),
      {} as Record<IncidentTab, number>,
    );
    if (!selectedDay) return base;
    return selectedRows.reduce((acc, row) => {
      const code = row.days[selectedDay];
      if (!isIncidence(code) || !isIncidentTab(code!)) return acc;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, base);
  }, [selectedRows, selectedDay]);

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

  const selectedDateHeading = useMemo(() => {
    if (!selectedDay || !currentMonth) return { date: "", compactDate: "", week: "", compactWeek: "" };
    try {
      const dateStr = `${currentMonth}-${selectedDay}`;
      const date = new Date(dateStr + "T00:00:00");

      const locale = en ? enUS : es;
      const weekday = format(date, "EEEE", { locale });
      const day = format(date, "d", { locale });
      const monthName = format(date, "MMMM", { locale });
      const year = format(date, "yyyy", { locale });

      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const shortWeekday = format(date, "EEE", { locale });
      const capShortWeekday = shortWeekday.charAt(0).toUpperCase() + shortWeekday.slice(1);
      const shortMonth = format(date, "MMM", { locale });
      const weekNum = getISOWeek(date);

      return en
        ? {
          date: `${capWeekday}, ${capMonth} ${day}, ${year}`,
          compactDate: `${capShortWeekday}, ${shortMonth} ${day}`,
          week: `Week ${weekNum}`,
          compactWeek: `Wk ${weekNum}`,
        }
        : {
          date: `${capWeekday} ${day} ${capMonth} ${year}`,
          compactDate: `${capShortWeekday} ${day} ${shortMonth}`,
          week: `Semana ${weekNum}`,
          compactWeek: `Sem ${weekNum}`,
        };
    } catch {
      const date = `${en ? "Incidents — day" : "Incidencias — día"} ${parseInt(selectedDay, 10)}`;
      return { date, compactDate: date, week: "", compactWeek: "" };
    }
  }, [selectedDay, currentMonth, en]);

  return { selectedDayIncidentSummary, selectedDayAreaSummary, selectedAreaDetailRows, selectedDayCounts, prevDay, nextDay, selectedDateHeading };
}
