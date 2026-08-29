import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ReporteDiario.css";
import { Modal } from "@/components/ui/Modal";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "@/lib/notify";
import { format, getISOWeek } from "date-fns";
import { es } from "date-fns/locale";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import {
  CloudUpload,
  Calendar,
  CircleAlert,
  LoaderCircle,
  X,
  ChevronRight,
  ChevronLeft,
  FileJson,
  BarChart2,
} from "lucide-react";

import {
  INCIDENT_TABS,
  INCIDENCIA_LABELS,
  SECTION_CONFIGS,
  VISIBLE_SECTIONS,
} from "./constants";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Save as SaveIconData,
} from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import {
  formatMes,
  daysInMonth,
  parseReporteJSON,
  isIncidence,
  isIncidentTab,
  getMexicoHolidayLabels,
} from "./helpers";
import type {
  IncidentTab,
  AreaStaffSummary,
  ReporteRow,
  EmployeeRef,
} from "./types";

import ReporteCalendar from "./reporte-calendar";
import ReporteAreaSummary from "./reporte-area-summary";
import { AnalisisAsistenciaModal } from "./AnalisisAsistenciaModal";
import ReporteIncidentTabs from "./reporte-incident-tabs";
import ReporteKpiDashboard from "./reporte-kpi-dashboard";
import ReporteComparison from "./reporte-comparison";
import ReporteEmployeeDetail from "./reporte-employee-detail";
import ReportesGuardadosDialog from "./reportes-guardados-dialog";

import { useReporteDiario } from "@/hooks/useReporteDiario";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";

const SAVE_SUCCESS_DURATION_MS = 1500;

export default function ReporteDiarioContent() {
  const [rows, setRows] = useState<ReporteRow[]>([]);
  const [selectedMes, setSelectedMes] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [turnoFilter, setTurnoFilter] = useState("");
  const [selectedIncidentTab, setSelectedIncidentTab] = useState<
    IncidentTab | ""
  >("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveSuccessTimerRef = useRef<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // collapse behaviour removed — panel is always visible
  const [topEmpModalOpen, setTopEmpModalOpen] = useState(false);

  const reduceMotion = useReducedMotion();

  const enterFromBelow = reduceMotion ? false : { opacity: 0, y: 8 };
  const enterFromRight = reduceMotion ? false : { opacity: 0, x: 24 };
  const enterFromLeft = reduceMotion ? false : { opacity: 0, x: -24 };
  const overlayPanelInitial = reduceMotion
    ? false
    : { opacity: 0, scale: 0.96, y: 12 };
  const exitToRight = reduceMotion ? undefined : { opacity: 0, x: 24 };
  const exitToLeft = reduceMotion ? undefined : { opacity: 0, x: -24 };

  const [processStep, setProcessStep] = useState<
    "reading" | "validating" | null
  >(null);

  const {
    saving: dbSaving,
    fetchSummaries,
    fetchByMes,
    fetchByMesList,
    saveReport,
    deleteReport,
  } = useReporteDiario();

  const [savedSummaries, setSavedSummaries] = useState<ReporteDiarioSummary[]>(
    [],
  );
  const [loadingDb, setLoadingDb] = useState(true);
  // Filas de TODOS los meses guardados en Supabase (para análisis cross-month)
  const [allMonthsRows, setAllMonthsRows] = useState<ReporteRow[]>([]);

  useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current !== null)
        window.clearTimeout(saveSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => setSaveError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveError]);

  // Recuperar último reporte parseado si se recarga la página por accidente
  useEffect(() => {
    try {
      const cached = window.sessionStorage.getItem("reporteDiarioCache");
      if (!cached) return;
      const json = JSON.parse(cached);
      const { rows: parsed, errors: errs } = parseReporteJSON(json);
      if (errs.length === 0 && parsed.length > 0) {
        setRows(parsed);
        setSelectedMes(parsed[0]?.mes ?? "");
        setFileName("Autoguardado");
      }
    } catch {
      // La caché es una mejora progresiva; el reporte funciona sin ella.
    }
  }, []);

  useEffect(() => {
    fetchSummaries().then((data) => {
      setSavedSummaries(data);
      setLoadingDb(false);
    });
  }, [fetchSummaries]);

  // Cuando cambia la lista de meses guardados, trae el contenido completo
  // de todos los meses para el cálculo cross-month (récord de incidencias).
  useEffect(() => {
    if (savedSummaries.length === 0) {
      setAllMonthsRows([]);
      return;
    }
    const mesList = savedSummaries.map((s) => s.mes);
    fetchByMesList(mesList).then((records) => {
      const combined: ReporteRow[] = [];
      for (const record of records) {
        const { rows: parsed } = parseReporteJSON(record.data as unknown[]);
        combined.push(...parsed);
      }
      setAllMonthsRows(combined);
    });
  }, [savedSummaries, fetchByMesList]);

  // Notifica a la navbar (badge del Menú) cuando cambian los datos del
  // reporte o la lista de meses guardados en Supabase.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("reporte-diario:changed"));
  }, [rows, savedSummaries]);

  const months = useMemo(
    () => Array.from(new Set(rows.map((r) => r.mes))).sort(),
    [rows],
  );

  const currentMonth = selectedMes || months[0] || "";
  const dayCount = currentMonth ? daysInMonth(currentMonth) : 0;
  const dayHeaders = Array.from({ length: dayCount }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  // ── Top 10 empleados con más incidencias (todos los meses guardados) ──────
  const topIncidenceEmployees = useMemo(() => {
    const dbMeses = new Set(allMonthsRows.map((r) => r.mes));
    const currentMes = rows[0]?.mes ?? null;
    const analysisRowsRaw: ReporteRow[] =
      currentMes && !dbMeses.has(currentMes)
        ? [...allMonthsRows, ...rows]
        : allMonthsRows;

    const analysisRows = analysisRowsRaw.filter(
      (r) =>
        VISIBLE_SECTIONS.has(r.departamento) || VISIBLE_SECTIONS.has(r.area),
    );

    if (analysisRows.length === 0) return [];

    const empMap = new Map<
      string,
      {
        numero_empleado: string;
        nombre: string;
        departamento: string;
        area: string;
        total: number;
        byCode: Record<string, number>;
        byMes: Record<string, number>;
      }
    >();

    for (const row of analysisRows) {
      const k = row.numero_empleado;
      if (!empMap.has(k)) {
        empMap.set(k, {
          numero_empleado: row.numero_empleado,
          nombre: row.nombre,
          departamento: row.departamento,
          area: row.area,
          total: 0,
          byCode: {},
          byMes: {},
        });
      }
      const emp = empMap.get(k)!;
      for (const code of Object.values(row.days)) {
        if (isIncidence(code)) {
          // TODO: Temporalmente ignoramos "I" (Incapacidad) y "V" (Vacaciones) a petición del usuario.
          // Eliminar este bloque if cuando se requiera volver a contarlas.
          if (code === "I" || code === "V") continue;

          emp.total++;
          emp.byCode[code] = (emp.byCode[code] ?? 0) + 1;
          emp.byMes[row.mes] = (emp.byMes[row.mes] ?? 0) + 1;
        }
      }
    }

    return Array.from(empMap.values())
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [allMonthsRows, rows]);

  const selectedRows = useMemo(() => {
    return rows
      .filter((r) => r.mes === currentMonth)
      .filter(
        (r) =>
          VISIBLE_SECTIONS.has(r.departamento) || VISIBLE_SECTIONS.has(r.area),
      )
      .filter((r) => {
        if (departamentoFilter && r.departamento !== departamentoFilter)
          return false;
        if (turnoFilter && r.turno !== turnoFilter) return false;
        return true;
      });
  }, [rows, currentMonth, departamentoFilter, turnoFilter]);

  const openEmployeeModal = useCallback((employeeId: string) => {
    setSelectedEmployee(employeeId);
    setEmpDetailOpen(true);
  }, []);

  const daySummaries = useMemo(() => {
    return dayHeaders.reduce<Record<string, number>>((acc, day) => {
      acc[day] = selectedRows.reduce((n, r) => {
        return n + (isIncidence(r.days[day]) ? 1 : 0);
      }, 0);
      return acc;
    }, {});
  }, [dayHeaders, selectedRows]);

  const dayAusentismoPct = useMemo(() => {
    const total = selectedRows.length;
    if (total === 0) return {} as Record<string, number>;
    return dayHeaders.reduce<Record<string, number>>((acc, day) => {
      const hasAnyCode = selectedRows.some((r) => !!r.days[day]);
      if (!hasAnyCode) {
        return acc;
      }

      const ausentes = selectedRows.reduce((n, r) => {
        const code = r.days[day];
        return n + (code === "F" || code === "P" || code === "I" ? 1 : 0);
      }, 0);
      acc[day] = Math.round((ausentes / total) * 100 * 100) / 100;
      return acc;
    }, {});
  }, [dayHeaders, selectedRows]);

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
        if (sec.seccion === "PRODUCCIÓN 1ER. TURNO" && dayOfWeek === 0)
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

  const selectedDateTitle = useMemo(() => {
    if (!selectedDay || !currentMonth) return "";
    try {
      const dateStr = `${currentMonth}-${selectedDay}`;
      const date = new Date(dateStr + "T00:00:00");

      const weekday = format(date, "EEEE", { locale: es });
      const day = format(date, "d", { locale: es });
      const month = format(date, "MMMM", { locale: es });
      const year = format(date, "yyyy", { locale: es });

      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const weekNum = getISOWeek(date);

      return `${capWeekday} ${day} ${capMonth} ${year} - Semana ${weekNum}`;
    } catch {
      return `Incidencias — día ${parseInt(selectedDay, 10)}`;
    }
  }, [selectedDay, currentMonth]);

  const monthFirstDay = currentMonth
    ? (() => {
        const [year, month] = currentMonth.split("-").map(Number);
        return new Date(year, month - 1, 1).getDay();
      })()
    : 0;

  const selectedMonthHolidayLabels = useMemo(() => {
    if (!currentMonth) return {} as Record<string, string>;
    const [year] = currentMonth.split("-").map(Number);
    return getMexicoHolidayLabels(year);
  }, [currentMonth]);

  const calendarCells = Array.from(
    { length: dayCount + monthFirstDay },
    (_, i) =>
      i < monthFirstDay ? null : String(i - monthFirstDay + 1).padStart(2, "0"),
  );

  const processFile = useCallback(
    async (file: File) => {
      if (processStep) return;
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        toast.error({ title: "Formato de archivo inválido" });
        return;
      }

      setErrors([]);
      setProcessStep("reading");

      try {
        const text = await file.text();

        setProcessStep("validating");

        const json = JSON.parse(text);
        const { rows: parsed, errors: errs } = parseReporteJSON(json);

        if (errs.length > 0) {
          setProcessStep(null);
          setErrors(errs);
          toast.error({ title: "Inconsistencias en el archivo" });
          return;
        }

        setRows(parsed);
        setSelectedMes(parsed[0]?.mes ?? "");
        setFileName(file.name);
        try {
          sessionStorage.setItem(
            "reporteDiarioCache",
            JSON.stringify(json),
          );
        } catch (error) {
          console.warn("No se pudo actualizar la caché local del reporte:", error);
        }
        setProcessStep(null);
        toast.success({ title: "Reporte cargado" });
      } catch (err) {
        setProcessStep(null);
        const msg = `Error al revisar el archivo: ${err instanceof Error ? err.message : String(err)}`;
        setErrors([msg]);
        toast.error({ title: "Archivo corrupto" });
      }
    },
    [processStep],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      try {
        await processFile(file);
      } finally {
        input.value = "";
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      await processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Solo quitamos isDragging si salimos del documento principal
    if (
      e.relatedTarget === null ||
      (e.relatedTarget as HTMLElement).nodeName === "HTML"
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setRows([]);
    setFileName("");
    setErrors([]);
    try {
      window.sessionStorage.removeItem("reporteDiarioCache");
    } catch {
      // La limpieza visual no depende de que sessionStorage esté disponible.
    }
    toast.info({ title: "Vista de datos limpiada" });
  }, []);

  const computeKpis = useCallback(
    (reportRows: ReporteRow[], dayH: string[]) => {
      let totalIncidencias = 0;
      let totalAsistencias = 0;
      let totalDaysTracked = 0;
      for (const row of reportRows) {
        for (const day of dayH) {
          const code = row.days[day];
          if (!code || code === "-" || code === "X") continue;
          totalDaysTracked++;
          if (code === "A") totalAsistencias++;
          else if (isIncidence(code)) totalIncidencias++;
        }
      }
      const tasaAsistencia =
        totalDaysTracked > 0
          ? Math.round((totalAsistencias / totalDaysTracked) * 100 * 100) / 100
          : 0;
      return { totalIncidencias, tasaAsistencia };
    },
    [],
  );

  const heroKpis = useMemo(
    () =>
      computeKpis(
        selectedRows.filter(
          (r) =>
            VISIBLE_SECTIONS.has(r.departamento) ||
            VISIBLE_SECTIONS.has(r.area),
        ),
        dayHeaders,
      ),
    [computeKpis, selectedRows, dayHeaders],
  );

  const handleSaveToDb = useCallback(async () => {
    setSaveSuccess(false);
    if (!currentMonth || rows.length === 0 || dbSaving) return;
    const monthRows = rows.filter((r) => r.mes === currentMonth);
    const dCount = daysInMonth(currentMonth);
    const dHeaders = Array.from({ length: dCount }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    );

    // Solo las 14 secciones configuradas para KPIs del resumen
    const visibleRows = monthRows.filter(
      (r) =>
        VISIBLE_SECTIONS.has(r.departamento) || VISIBLE_SECTIONS.has(r.area),
    );
    const { totalIncidencias, tasaAsistencia } = computeKpis(
      visibleRows,
      dHeaders,
    );

    const diasDisponibles = visibleRows.length * dCount;
    let totalAusentismo = 0;
    for (const row of visibleRows) {
      for (const day of dHeaders) {
        const code = row.days[day];
        // F=Falta injustificada, FJ=Falta justificada, S=Sanción, P=Permiso, I=Incapacidad
        if (
          code === "F" ||
          code === "FJ" ||
          code === "S" ||
          code === "P" ||
          code === "I"
        ) {
          totalAusentismo++;
        }
      }
    }
    const pctAusentismo =
      diasDisponibles > 0
        ? Math.round((totalAusentismo / diasDisponibles) * 100 * 100) / 100
        : 0;

    const result = await saveReport({
      mes: currentMonth,
      data: monthRows, // datos completos para drill-down
      total_empleados: visibleRows.length, // solo 14 secciones
      total_incidencias: totalIncidencias,
      tasa_asistencia: tasaAsistencia,
      dias_disponibles: diasDisponibles,
      total_ausentismo: totalAusentismo,
      pct_ausentismo: pctAusentismo,
    });
    if (result.success) {
      setSaveSuccess(true);
      if (saveSuccessTimerRef.current !== null)
        window.clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = window.setTimeout(() => {
        setSaveSuccess(false);
        saveSuccessTimerRef.current = null;
      }, SAVE_SUCCESS_DURATION_MS);
      const updated = await fetchSummaries();
      setSavedSummaries(updated);
    } else {
      setSaveError(result.error || "Error al guardar");
    }
  }, [currentMonth, rows, dbSaving, computeKpis, saveReport, fetchSummaries]);

  const handleLoadFromDb = useCallback(
    async (mes: string) => {
      const record = await fetchByMes(mes);
      if (!record) return;
      const { rows: parsed, errors: errs } = parseReporteJSON(
        record.data as unknown[],
      );
      if (errs.length > 0) {
        setErrors(errs);
        return;
      }
      setRows(parsed);
      setSelectedMes(mes);
      setFileName(formatMes(mes));
      setErrors([]);
      // panel is always visible; no collapse
    },
    [fetchByMes],
  );

  const handleDeleteFromDb = useCallback(
    async (id: string) => {
      const result = await deleteReport(id);
      if (result.success) {
        const updated = await fetchSummaries();
        setSavedSummaries(updated);
      }
    },
    [deleteReport, fetchSummaries],
  );

  // Días con incidencia de un empleado en un mes específico (para drill-down)
  const getDrillDownDays = useCallback(
    (empKey: string, mes: string) => {
      const [year, month] = mes.split("-").map(Number);
      const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const empRows = allMonthsRows.filter(
        (r) => r.numero_empleado === empKey && r.mes === mes,
      );
      const seen = new Set<string>();
      const days: {
        day: string;
        dayLabel: string;
        code: string;
        label: string;
      }[] = [];
      for (const row of empRows) {
        for (const [day, code] of Object.entries(row.days)) {
          if (isIncidence(code) && !seen.has(day)) {
            // TODO: Temporalmente ignoramos "I" (Incapacidad) y "V" (Vacaciones).
            if (code === "I" || code === "V") continue;

            seen.add(day);
            const dayNum = parseInt(day, 10);
            const weekday =
              DAY_NAMES[new Date(year, month - 1, dayNum).getDay()];
            days.push({
              day,
              dayLabel: `${weekday} ${dayNum}`,
              code,
              label: INCIDENCIA_LABELS[code] ?? code,
            });
          }
        }
      }
      return days.sort((a, b) => parseInt(a.day, 10) - parseInt(b.day, 10));
    },
    [allMonthsRows],
  );

  const hasData = rows.length > 0 && Boolean(currentMonth);

  /* ── Rediseño (Idea A): Hero centrado cuando NO hay reporte ──────────
       Rompe el split lateral y muestra: título + dropzone protagonista +
       3 pasos de onboarding + acceso rápido a reportes guardados. */
  if (!hasData) {
    return (
      <BoneyardSkeleton
        name="reportes-page"
        loading={loadingDb}
        loadingLabel="Cargando reportes de asistencia…"
      >
        <div className="reporte-container">
        <input
          ref={fileInputRef}
          className="reporte-file-input"
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        <motion.section
          className="reporte-hero"
          initial={enterFromBelow}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          aria-labelledby="reporte-hero-title"
        >
          <header className="reporte-hero__intro">
            <span className="reporte-hero__eyebrow" aria-hidden="true">
              <BarChart2 size={14} />
              Reporte Diario
            </span>
            <h1 id="reporte-hero-title" className="reporte-hero__title">
              Reporte Diario
            </h1>
          </header>

          <div
            className="reporte-hero__dropzone"
            data-dragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !processStep && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (!processStep && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Sube un archivo de reporte de asistencia"
            aria-busy={Boolean(processStep)}
            aria-disabled={Boolean(processStep)}
            data-testid="upload-dropzone"
          >
            <AnimatePresence mode="wait">
              {processStep ? (
                <motion.div
                  key="processing"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  className="reporte-hero__dropzone-inner reporte-hero__dropzone-inner--processing"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <LoaderCircle
                    size="1em"
                    className="reporte-spinner reporte-overlay__icon-primary"
                    aria-hidden="true"
                  />
                  <h2 className="reporte-hero__dropzone-title">
                    {processStep === "reading" && "Leyendo archivo…"}
                    {processStep === "validating" && "Revisando incidencias…"}
                  </h2>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  className="reporte-hero__dropzone-inner"
                >
                  <span
                    className="reporte-hero__dropzone-icon"
                    aria-hidden="true"
                  >
                    <CloudUpload size={34} />
                  </span>
                  <h2 className="reporte-hero__dropzone-title">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </h2>
                  <p className="reporte-hero__dropzone-hint">
                    Detecta automáticamente el mes y valida el formato
                  </p>
                  <span className="reporte-hero__dropzone-format" aria-hidden="true">
                    <FileJson size={14} />
                    .json
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {savedSummaries.length > 0 && (
            <div
              className="reporte-hero__saved"
              aria-label="Acceso a reportes guardados"
            >
              <p className="reporte-hero__saved-hint">Reportes guardados.</p>
              <div className="reporte-hero__saved-actions">
                <ReportesGuardadosDialog
                  savedSummaries={savedSummaries}
                  dbSaving={dbSaving}
                  onLoad={handleLoadFromDb}
                  onDelete={handleDeleteFromDb}
                  formatMes={formatMes}
                  triggerVariant="labeled"
                />
                {savedSummaries.length >= 2 && (
                  <ReporteComparison
                    summaries={savedSummaries}
                    triggerVariant="labeled"
                  />
                )}
              </div>
            </div>
          )}
        </motion.section>

        {errors.length > 0 && (
          <div
            className="reporte-status-banner error reporte-errors"
            role="alert"
            data-testid="errors-banner"
          >
            <CircleAlert size={16} aria-hidden="true" />
            <div className="reporte-errors__content">
              <div className="reporte-flex-between">
                <strong>Errores de formato</strong>
                <button
                  type="button"
                  onClick={() => setErrors([])}
                  className="reporte-iconbtn"
                  aria-label="Cerrar errores"
                >
                  <X size={16} />
                </button>
              </div>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}



        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="reporte-drag"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="status"
              aria-live="assertive"
              aria-label="Suelta el archivo para cargar el reporte"
            >
              <motion.div
                initial={overlayPanelInitial}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }
                }
                className="reporte-drag__inner"
              >
                <CloudUpload
                  size="1em"
                  className="reporte-overlay__icon-primary reporte-drag__icon"
                  aria-hidden="true"
                />
                <h2 className="reporte-overlay__title">
                  Suelta el archivo aquí
                </h2>
                <p className="reporte-subtitle">
                  Detecta automáticamente el mes y valida el formato.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </BoneyardSkeleton>
    );
  }

  return (
    <>
      {loadingDb && (
        <span className="sr-only" role="status" aria-live="polite">
          Actualizando datos del reporte…
        </span>
      )}
      <header className="reporte-header__top">
        <div className="reporte-head__left">
          <h1 className="reporte-title">Reporte Diario</h1>
        </div>

        <div
          className="reporte-head__grid"
          aria-label="Información del reporte cargado"
        >
          {fileName && !processStep && (
            <div
              className="reporte-status-banner reporte-status-banner--file"
              data-testid="reporte-filename"
            >
              <FileJson size={16} className="text-primary" aria-hidden="true" />
              <span className="reporte-head__grid-text">{fileName}</span>
              <button
                type="button"
                onClick={handleClearFile}
                title="Limpiar archivo actual"
                aria-label="Limpiar archivo actual"
                className="reporte-iconbtn"
                data-testid="clear-file-btn"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {savedSummaries.length >= 2 && (
            <ReporteComparison
              summaries={savedSummaries}
              triggerVariant="labeled"
            />
          )}
          {savedSummaries.length > 0 && (
            <ReportesGuardadosDialog
              savedSummaries={savedSummaries}
              dbSaving={dbSaving}
              onLoad={handleLoadFromDb}
              onDelete={handleDeleteFromDb}
              formatMes={formatMes}
              triggerVariant="labeled"
            />
          )}

          {hasData && (
            <AnimatedSubmitButton
              type="button"
              isSubmitting={dbSaving}
              isSuccess={saveSuccess}
              isError={!!saveError}
              errorText={saveError || undefined}
              idleText={
                savedSummaries.some((s) => s.mes === currentMonth)
                  ? "Actualizar"
                  : "Guardar"
              }
              loadingText="Guardando…"
              successText="¡Guardado!"
              idleIcon={SaveIconData}
              className="btn-primary"
              onClick={handleSaveToDb}
              data-testid="save-report-btn"
            />
          )}
        </div>
      </header>

      <div className="reporte-layout">
        <input
          ref={fileInputRef}
          className="reporte-file-input"
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* ── PANEL IZQUIERDO: búsqueda y acciones (controles movidos arriba) ───────── */}
        <aside className="reporte-panel">
          {/* Controles movidos arriba; aside no longer contains the search */}

          {errors.length > 0 && (
            <div
              className="reporte-status-banner error reporte-errors"
              role="alert"
              data-testid="errors-banner"
            >
              <CircleAlert size={16} aria-hidden="true" />
              <div className="reporte-errors__content">
                <div className="reporte-flex-between">
                  <strong>Errores de formato</strong>
                  <button
                    type="button"
                    onClick={() => setErrors([])}
                    className="reporte-iconbtn"
                    aria-label="Cerrar errores"
                  >
                    <X size={16} />
                  </button>
                </div>
                <ul>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {/* Controles movidos arriba */}
        </aside>

        {/* ── PANEL DERECHO: el reporte ───────────────────────────── */}
        <div className="reporte-main">
          {hasData && (
            <motion.div
              className="reporte-container"
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { staggerChildren: 0.08, delayChildren: 0.05 },
                },
              }}
            >
              {currentMonth && rows.length > 0 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: reduceMotion ? 0 : 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                >
                  <ReporteKpiDashboard
                    selectedRows={selectedRows.filter(
                      (r) =>
                        VISIBLE_SECTIONS.has(r.departamento) ||
                        VISIBLE_SECTIONS.has(r.area),
                    )}
                    dayHeaders={dayHeaders}
                    currentMonth={currentMonth}
                  />
                </motion.div>
              )}

              {currentMonth && rows.length > 0 && (
                <motion.div
                  className="reporte-card"
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                >
                  <div className="reporte-card__header">
                    <div className="reporte-flex-between">
                      <div>
                        <h2 className="reporte-card__title reporte-card__title--capitalize">
                          {formatMes(currentMonth)}
                        </h2>
                      </div>
                      <div className="reporte-cal-actions">
                        {topIncidenceEmployees.length > 0 && (
                          <button
                            type="button"
                            className="reporte-top-emp-btn"
                            onClick={() => {
                              setTopEmpModalOpen(true);
                            }}
                            data-testid="top-incidence-btn"
                            aria-label="Ver top 10 empleados con más incidencias"
                          >
                            <BarChart2 size={13} aria-hidden="true" />
                            <span>Análisis de asistencia</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="reporte-card__content">
                    <ReporteCalendar
                      calendarCells={calendarCells}
                      daySummaries={daySummaries}
                      dayAusentismoPct={dayAusentismoPct}
                      selectedDay={selectedDay}
                      selectedMonthHolidayLabels={selectedMonthHolidayLabels}
                      currentMonth={currentMonth}
                      onSelectDay={setSelectedDay}
                    />
                  </div>
                </motion.div>
              )}
              <motion.div
                className="reporte-card"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                <div className="reporte-card__header">
                  <div className="reporte-dayhead">
                    <div className="reporte-dayhead__title">
                      <div className="reporte-dayhead__icon">
                        <Calendar size={18} aria-hidden="true" />
                      </div>
                      <h3 data-testid="selected-day-title">
                        {selectedDay ? selectedDateTitle : "Detalle del día"}
                      </h3>
                    </div>
                    {selectedDay && (
                      <div className="reporte-dayhead__actions">
                        {(() => {
                          const totalInc = daySummaries[selectedDay] || 0;
                          if (totalInc === 0) return null;
                          return (
                            <span
                              className="ras__incidents-total"
                              aria-label={`${totalInc} incidencias`}
                            >
                              {totalInc}{" "}
                              {totalInc === 1 ? "incidencia" : "incidencias"}
                            </span>
                          );
                        })()}
                        <div className="reporte-daynav">
                          <button
                            type="button"
                            className="reporte-daynav__btn"
                            onClick={() => prevDay && setSelectedDay(prevDay)}
                            disabled={!prevDay}
                            title="Día anterior"
                            aria-label="Día anterior"
                            data-testid="prev-day-btn"
                          >
                            <ChevronLeft size={16} />
                            <span className="reporte-daynav__text">
                              Anterior
                            </span>
                          </button>
                          <button
                            type="button"
                            className="reporte-daynav__btn"
                            onClick={() => nextDay && setSelectedDay(nextDay)}
                            disabled={!nextDay}
                            title="Día siguiente"
                            aria-label="Día siguiente"
                            data-testid="next-day-btn"
                          >
                            <span className="reporte-daynav__text">
                              Siguiente
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="reporte-card__content">
                  {!selectedDay ? (
                    <p className="reporte-placeholder">
                      Selecciona un día en el calendario.
                    </p>
                  ) : (
                    <>
                      <ReporteAreaSummary
                        areas={selectedDayAreaSummary}
                        selectedArea={selectedArea}
                        onSelectArea={setSelectedArea}
                        detailRows={selectedAreaDetailRows}
                      />

                      <ReporteIncidentTabs
                        selectedTab={selectedIncidentTab}
                        onSelectTab={setSelectedIncidentTab}
                        dayCounts={selectedDayCounts}
                        incidentSummary={selectedDayIncidentSummary}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* ── Employee Detail Modal ────────────────────────────────── */}
        <ReporteEmployeeDetail
          open={empDetailOpen}
          onClose={() => {
            setEmpDetailOpen(false);
            setSelectedEmployee("");
          }}
          employee={
            selectedRows.find((r) => r.numero_empleado === selectedEmployee) ??
            null
          }
          dayHeaders={dayHeaders}
          currentMonth={currentMonth}
        />


        {/* ── Modal: Top 10 empleados con más incidencias ──────── */}
        <AnalisisAsistenciaModal
          isOpen={topEmpModalOpen}
          onClose={() => setTopEmpModalOpen(false)}
          topIncidenceEmployees={topIncidenceEmployees}
          getDrillDownDays={getDrillDownDays}
          formatMes={formatMes}
        />
      </div>
    </>
  );
}
