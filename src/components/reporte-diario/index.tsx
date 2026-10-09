import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { Link, useMatch, useNavigate } from "react-router-dom";
import { ReportDayPage } from "@/pages/ReportDayPage";
import { getReportDayPath, REPORT_DAY_PATTERN } from "./navigation";
import "./ReporteDiario.css";
import { Modal } from "@/components/ui/Modal";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "@/lib/notify";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import {
  Archive,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ChartSpline,
  FileBraces,
  FileUp,
  FileX2,
} from "lucide-react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Save as SaveIconData,
} from "lucide";

import {
  VISIBLE_SECTIONS,
} from "./constants";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import {
  daysInMonth,
  parseReporteJSON,
  isIncidence,
  getMexicoHolidayLabels,
} from "./helpers";
import type {
  IncidentTab,
  ReporteRow,
} from "./types";

import ReporteCalendar from "./reporte-calendar";
import { AnalisisAsistenciaModal } from "./AnalisisAsistenciaModal";
import ReporteKpiDashboard from "./reporte-kpi-dashboard";
import ReporteComparison from "./reporte-comparison";
import ReporteEmployeeDetail from "./reporte-employee-detail";
import ReportesGuardadosDialog from "./reportes-guardados-dialog";
import { ReporteFormatErrors } from "./ReporteFormatErrors";
import {
  ReporteUploadPanel,
  type ReportProcessStep,
} from "./ReporteUploadPanel";

import { useReporteDiario } from "@/hooks/useReporteDiario";
import type { ReporteDiarioSummary } from "@/hooks/useReporteDiario";
import { useReportLocale } from "./useReportLocale";
import { useReportDayDetails } from "./useReportDayDetails";
import { useReportDayRouteLoading } from "./useReportDayRouteLoading";

const SAVE_SUCCESS_DURATION_MS = 1500;

export default function ReporteDiarioContent() {
  const { en, copy, month, incident } = useReportLocale();
  const [rows, setRows] = useState<ReporteRow[]>([]);
  const [selectedMes, setSelectedMes] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [departamentoFilter, setDepartamentoFilter] = useState("");
  const [turnoFilter, setTurnoFilter] = useState("");
  const [selectedIncidentTab, setSelectedIncidentTab] = useState<
    IncidentTab | ""
  >("");
  const dayRoute = useMatch(REPORT_DAY_PATTERN);
  const navigate = useNavigate();
  const [calendarDay, setCalendarDay] = useState("");
  const routeMonth = dayRoute?.params.month ?? '';
  const routeDay = dayRoute?.params.day ?? '';
  const validDayRoute = /^\d{4}-(0[1-9]|1[0-2])$/.test(routeMonth)
    && /^(0[1-9]|[12]\d|3[01])$/.test(routeDay)
    && Number(routeDay) <= daysInMonth(routeMonth);
  const selectedDay = dayRoute ? (validDayRoute ? routeDay : '') : calendarDay;
  useEffect(() => {
    if (validDayRoute) {
      setCalendarDay(routeDay);
      setSelectedMes(routeMonth);
    }
  }, [validDayRoute, routeDay, routeMonth]);
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

  const [processStep, setProcessStep] = useState<ReportProcessStep>(null);

  const {
    saving: dbSaving,
    error: dbError,
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

  const currentMonth = (validDayRoute ? routeMonth : "") || selectedMes || months[0] || "";
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

  const { selectedDayIncidentSummary, selectedDayAreaSummary, selectedAreaDetailRows,
    selectedDayCounts, prevDay, nextDay, selectedDateHeading } = useReportDayDetails({
      selectedRows, selectedDay, selectedArea, currentMonth, en,
      dayHeaders, dayAusentismoPct, daySummaries,
    });

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

  const processReportContent = useCallback(
    async (
      readContent: () => string | Promise<string>,
      sourceName: string,
      initialStep: Exclude<ReportProcessStep, null>,
      errorTitle: string,
    ) => {
      if (processStep) return;

      setErrors([]);
      setProcessStep(initialStep);

      try {
        const text = await readContent();
        setProcessStep("validating");

        const json: unknown = JSON.parse(text);
        if (!Array.isArray(json)) {
          setErrors([
            en ? "The JSON content must contain a list of records." : "El contenido JSON debe contener una lista de registros.",
          ]);
          return;
        }
        const { rows: parsed, errors: errs } = parseReporteJSON(json);

        if (errs.length > 0) {
          setErrors(errs);
          return;
        }

        setRows(parsed);
        setSelectedMes(parsed[0]?.mes ?? "");
        setFileName(sourceName);
        try {
          sessionStorage.setItem("reporteDiarioCache", JSON.stringify(json));
        } catch (error) {
          console.warn(
            "No se pudo actualizar la caché local del reporte:",
            error,
          );
        }
        toast.success({ title: en ? "Report loaded" : "Reporte cargado" });
      } catch (err) {
        const msg = `${en ? "Error checking the report" : "Error al revisar el reporte"}: ${err instanceof Error ? err.message : String(err)}`;
        setErrors([msg]);
        toast.error({ title: errorTitle });
      } finally {
        setProcessStep(null);
      }
    },
    [processStep, en],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (
        file.type !== "application/json" &&
        !file.name.toLowerCase().endsWith(".json")
      ) {
        toast.error({ title: en ? "Invalid file format" : "Formato de archivo inválido" });
        return;
      }

      await processReportContent(
        () => file.text(),
        file.name,
        "reading",
        en ? "Corrupt file" : "Archivo corrupto",
      );
    },
    [processReportContent, en],
  );

  const processPastedJson = useCallback(
    async (content: string) => {
      await processReportContent(
        () => content,
        en ? "Pasted content" : "Contenido pegado",
        "validating",
        en ? "Invalid JSON content" : "Contenido JSON inválido",
      );
    },
    [processReportContent, en],
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
    toast.info({ title: en ? "Report view cleared" : "Vista de datos limpiada" });
  }, [en]);

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
    setSaveError(null);
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
      setSaveError(result.error || (en ? "Could not save" : "Error al guardar"));
    }
  }, [currentMonth, rows, dbSaving, computeKpis, saveReport, fetchSummaries, en]);

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
      setFileName(mes);
      setErrors([]);
      // panel is always visible; no collapse
    },
    [fetchByMes],
  );

  const { dayReportLoading, retryDayReport } = useReportDayRouteLoading({
    isDayPage: Boolean(dayRoute), validDayRoute, routeMonth, rows,
    loadingDb, loadReport: handleLoadFromDb,
  });

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
      const DAY_NAMES = en
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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
              label: incident(code),
            });
          }
        }
      }
      return days.sort((a, b) => parseInt(a.day, 10) - parseInt(b.day, 10));
    },
    [allMonthsRows, en, incident],
  );

  const hasData = rows.length > 0 && Boolean(currentMonth);
  const recentSummaries = savedSummaries.slice(0, 3);

  if (dayRoute) {
    return <ReportDayPage
      heading={selectedDateHeading}
      month={currentMonth}
      day={selectedDay}
      loading={validDayRoute && (loadingDb || dayReportLoading)}
      hasData={validDayRoute && rows.some(row => row.mes === routeMonth)}
      hasError={validDayRoute && !rows.some(row => row.mes === routeMonth) && Boolean(dbError || errors.length)}
      onRetry={retryDayReport}
      prevDay={prevDay}
      nextDay={nextDay}
      areas={selectedDayAreaSummary}
      selectedArea={selectedArea}
      onSelectArea={setSelectedArea}
      detailRows={selectedAreaDetailRows}
      selectedTab={selectedIncidentTab}
      onSelectTab={setSelectedIncidentTab}
      dayCounts={selectedDayCounts}
      incidentSummary={selectedDayIncidentSummary}
    />;
  }

  /* Estado inicial: carga de archivo y acceso a reportes recientes. */
  if (!hasData) {
    return (
      <BoneyardSkeleton
        name="reportes-page"
        loading={loadingDb}
        loadingLabel={copy("Cargando reportes de asistencia…", "Loading attendance reports…")}
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
          aria-labelledby="reporte-page-title"
        >
            <PageHeading id="reporte-page-title" className="app-page-title">
              {copy("Reporte Diario", "Daily Report")}
            </PageHeading>

          <div className="reporte-hero__workspace">
            <ReporteUploadPanel
              processStep={processStep}
              isDragging={isDragging}
              onSelectFile={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSubmitJson={processPastedJson}
            />

            <section
              className="reporte-hero__panel reporte-hero__panel--recent"
              aria-labelledby="reporte-recent-title"
            >
              <header className="reporte-hero__panel-header">
                <span className="reporte-hero__panel-icon" aria-hidden="true">
                  <Archive size="1em" />
                </span>
                <div className="reporte-hero__panel-copy">
                  <h2 id="reporte-recent-title">{copy("Reportes recientes", "Recent reports")}</h2>
                  <p>{copy("Consulta o compara reportes guardados.", "View or compare saved reports.")}</p>
                </div>
              </header>

              {recentSummaries.length > 0 ? (
                <ul className="reporte-hero__recent-list">
                  {recentSummaries.map((summary) => (
                    <li key={summary.id}>
                      <button
                        type="button"
                        className="reporte-hero__recent-item"
                        onClick={() => void handleLoadFromDb(summary.mes)}
                        aria-label={`${copy("Abrir reporte de", "Open report for")} ${month(summary.mes)}`}
                      >
                        <span
                          className="reporte-hero__recent-icon"
                          aria-hidden="true"
                        >
                          <CalendarDays size="1em" />
                        </span>
                        <span className="reporte-hero__recent-copy">
                          <span className="reporte-hero__recent-title">
                            {month(summary.mes)}
                          </span>
                          <span className="reporte-hero__recent-meta">
                            {summary.total_incidencias === 1
                              ? copy("1 incidencia", "1 incident")
                              : `${summary.total_incidencias} ${copy("incidencias", "incidents")}`}
                          </span>
                        </span>
                        <ChevronRight size="1em" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="reporte-hero__recent-empty">
                  <Archive size="1em" aria-hidden="true" />
                  <p>{copy("No hay reportes guardados.", "No saved reports.")}</p>
                  <span>{copy("Cuando guardes uno, aparecerá aquí.", "Saved reports will appear here.")}</span>
                </div>
              )}

              <div className="reporte-hero__recent-actions">
                <Link
                  className="btn-secondary reporte-hero__motivos-link"
                  to="/departure-reasons"
                >
                  <BarChart3 size="var(--icon-size-sm)" aria-hidden="true" />
                  {copy("Motivos de baja", "Reasons for leaving")}
                </Link>
                {savedSummaries.length > 0 && (
                  <>
                    <ReportesGuardadosDialog
                      savedSummaries={savedSummaries}
                      dbSaving={dbSaving}
                      onLoad={handleLoadFromDb}
                      onDelete={handleDeleteFromDb}
                      formatMes={month}
                      triggerVariant="labeled"
                      triggerLabel={copy("Ver todos", "View all")}
                    />
                    {savedSummaries.length >= 2 && (
                      <ReporteComparison
                        triggerVariant="labeled"
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </motion.section>

        {errors.length > 0 && (
          <ReporteFormatErrors
            errors={errors}
            onDismiss={() => setErrors([])}
          />
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
              aria-label={copy("Suelta el archivo para cargar el reporte", "Drop the file to load the report")}
            >
              <motion.div
                initial={overlayPanelInitial}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }
                }
                className="reporte-drag__inner"
              >
                <FileUp
                  size="1em"
                  className="reporte-overlay__icon-primary reporte-drag__icon"
                  aria-hidden="true"
                />
                <h2 className="reporte-overlay__title">
                  {copy("Suelta el archivo aquí", "Drop the file here")}
                </h2>
                <p className="reporte-subtitle">
                  {copy("Detecta automáticamente el mes y valida el formato.", "The month is detected and the format checked automatically.")}
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
          {copy("Actualizando datos del reporte…", "Updating report data…")}
        </span>
      )}
      <header className="reporte-header__top">
        <PageHeading id="reporte-page-title" className="app-page-title">
          {copy("Reporte Diario", "Daily Report")}
        </PageHeading>

        <div
          className="reporte-head__grid"
          aria-label={copy("Información del reporte cargado", "Loaded report information")}
        >
          {fileName && !processStep && (
            <div
              className="reporte-status-banner reporte-status-banner--file"
              data-testid="reporte-filename"
            >
              <FileBraces size={16} className="text-primary" aria-hidden="true" />
              <span className="reporte-head__grid-text">{fileName === "Autoguardado" ? copy("Autoguardado", "Autosaved") : fileName === selectedMes ? month(fileName) : fileName}</span>
              <button
                type="button"
                onClick={handleClearFile}
                title={copy("Limpiar archivo actual", "Clear current file")}
                aria-label={copy("Limpiar archivo actual", "Clear current file")}
                className="reporte-iconbtn"
                data-testid="clear-file-btn"
              >
                <FileX2 size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {savedSummaries.length >= 2 && (
            <ReporteComparison
              triggerVariant="labeled"
            />
          )}
          {savedSummaries.length > 0 && (
            <ReportesGuardadosDialog
              savedSummaries={savedSummaries}
              dbSaving={dbSaving}
              onLoad={handleLoadFromDb}
              onDelete={handleDeleteFromDb}
              formatMes={month}
              triggerVariant="labeled"
            />
          )}

          <Link className="btn-secondary" to="/departure-reasons">
            <BarChart3 size="var(--icon-size-sm)" aria-hidden="true" />
            {copy("Motivos de baja", "Reasons for leaving")}
          </Link>

          {hasData && (
            <div className="reporte-head__save-action">
              <AnimatedSubmitButton
                type="button"
                isSubmitting={dbSaving}
                isSuccess={saveSuccess}
                isError={!!saveError}
                errorText={saveError || undefined}
                errorMessageId="report-save-error"
                idleText={
                  savedSummaries.some((s) => s.mes === currentMonth)
                    ? copy("Actualizar", "Update")
                    : copy("Guardar", "Save")
                }
                loadingText={copy("Guardando…", "Saving…")}
                successText={copy("¡Guardado!", "Saved!")}
                idleIcon={SaveIconData}
                className="btn-primary"
                onClick={handleSaveToDb}
                data-testid="save-report-btn"
              />
              {saveError && (
                <p id="report-save-error" className="form-error-text" role="alert">
                  {saveError}
                </p>
              )}
            </div>
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
            <ReporteFormatErrors
              errors={errors}
              onDismiss={() => setErrors([])}
            />
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
                          {month(currentMonth)}
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
                            aria-label={copy("Ver top 10 empleados con más incidencias", "View the 10 employees with the most incidents")}
                          >
                            <ChartSpline size={13} aria-hidden="true" />
                            <span>{copy("Análisis de asistencia", "Attendance analysis")}</span>
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
                      onSelectDay={day => {
                        setCalendarDay(day);
                        navigate(getReportDayPath(currentMonth, day));
                      }}
                    />
                  </div>
                </motion.div>
              )}
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
          formatMes={month}
        />
      </div>
    </>
  );
}
